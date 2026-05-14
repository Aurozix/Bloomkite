import type { Metadata } from 'next'

import { prisma } from '@/lib/db'
import { canonicalUrl, truncateForMeta } from '@/lib/seo'

// Per-article SEO metadata (BRD §13). Article-type OG card with the author
// surfaced as og:article:author for richer cards on shares.

interface Params {
  params: { id: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = await prisma.article
    .findUnique({
      where: { id: params.id },
      select: {
        title: true,
        content: true,
        category: true,
        tags: true,
        featuredImageUrl: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
            email: true,
            advisorProfile: { select: { displayName: true } },
          },
        },
      },
    })
    .catch(() => null)

  if (!article || article.status !== 'published') {
    return {
      title: 'Article',
      robots: { index: false, follow: false },
    }
  }

  const description = truncateForMeta(article.content, 160)
  const authorName =
    article.author?.advisorProfile?.displayName ||
    article.author?.name ||
    article.author?.email ||
    undefined
  const url = canonicalUrl(`/articles/${params.id}`)
  const image = article.featuredImageUrl || undefined

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    keywords: article.tags?.length ? article.tags : undefined,
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
      authors: authorName ? [authorName] : undefined,
      section: article.category ?? undefined,
      tags: article.tags ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: article.title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default function ArticleDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
