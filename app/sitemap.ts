import type { MetadataRoute } from 'next'

import { prisma } from '@/lib/db'
import { canonicalUrl } from '@/lib/seo'

// Dynamic sitemap (BRD §13). Combines:
//   - Static marketing + legal pages (always present)
//   - Approved + verified advisor profiles
//   - Published articles
//   - Open forum questions
//
// Next.js renders this as /sitemap.xml at request time and caches per its
// own heuristics. Sitemap protocol caps at 50,000 URLs / 50 MB per file —
// we're far under both for the foreseeable future. Once we approach that
// scale we'd split into /sitemap-advisors.xml etc. and add a sitemap index.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static + semi-static pages. Home + advisors + articles get higher
  // priority; legal pages are reference content.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: canonicalUrl('/'),         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: canonicalUrl('/advisors'), lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: canonicalUrl('/articles'), lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: canonicalUrl('/forum'),    lastModified: now, changeFrequency: 'hourly',  priority: 0.8 },
    { url: canonicalUrl('/calculators'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: canonicalUrl('/support'),  lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: canonicalUrl('/terms'),    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: canonicalUrl('/privacy'),  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Hard-coded calculator slugs. Mirrors the directory listing under
  // app/calculators/. Add to this list when a new calculator ships — or
  // wire it to master_data_calculator_categories once that table is the
  // canonical source (a §9 follow-up).
  const CALCULATOR_SLUGS = [
    'goal-planner',
    'cash-flow',
    'net-worth',
    'priority-ranker',
    'insurance-needs',
    'risk-profiler',
    'future-value',
    'target-value',
    'rate-finder',
    'tenure-finder',
    'emi',
    'emi-capacity',
    'partial-payment',
    'emi-change',
    'rate-change',
  ]
  const calculatorEntries: MetadataRoute.Sitemap = CALCULATOR_SLUGS.map((slug) => ({
    url: canonicalUrl(`/calculators/${slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Dynamic content. Each in parallel; failures are isolated so one slow
  // query can't block the whole sitemap.
  const [advisors, articles, questions] = await Promise.all([
    prisma.advisorProfile
      .findMany({
        where: { workflowStatus: 'approved', isVerified: true },
        select: { userId: true, updatedAt: true },
        take: 5000,
      })
      .catch(() => []),
    prisma.article
      .findMany({
        where: { status: 'published' },
        select: { id: true, updatedAt: true, publishedAt: true },
        take: 10000,
      })
      .catch(() => []),
    prisma.forumQuestion
      .findMany({
        where: { status: 'open' },
        select: { id: true, updatedAt: true },
        take: 10000,
      })
      .catch(() => []),
  ])

  const advisorEntries: MetadataRoute.Sitemap = advisors.map((a) => ({
    url: canonicalUrl(`/advisors/${a.userId}`),
    lastModified: a.updatedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: canonicalUrl(`/articles/${a.id}`),
    lastModified: a.updatedAt ?? a.publishedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const questionEntries: MetadataRoute.Sitemap = questions.map((q) => ({
    url: canonicalUrl(`/forum/questions/${q.id}`),
    lastModified: q.updatedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    ...staticEntries,
    ...calculatorEntries,
    ...advisorEntries,
    ...articleEntries,
    ...questionEntries,
  ]
}
