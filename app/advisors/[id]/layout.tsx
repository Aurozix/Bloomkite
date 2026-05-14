import type { Metadata } from 'next'

import { prisma } from '@/lib/db'
import { canonicalUrl, SITE_NAME, truncateForMeta } from '@/lib/seo'

// Per-advisor SEO metadata (BRD §13). Pulls displayName + companyName + bio
// for the title / description / OG card. The page component itself is a
// client component; this server-side layout is the only seam where Next.js
// lets us inject per-resource metadata.

interface Params {
  params: { id: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const profile = await prisma.advisorProfile
    .findUnique({
      where: { userId: params.id },
      select: {
        displayName: true,
        companyName: true,
        designation: true,
        city: true,
        bio: true,
        workflowStatus: true,
        isVerified: true,
      },
    })
    .catch(() => null)

  if (!profile || profile.workflowStatus !== 'approved' || !profile.isVerified) {
    // Either missing or not yet public — let the page show its 404.
    // robots: noindex so search engines don't surface a stub.
    return {
      title: 'Advisor',
      robots: { index: false, follow: false },
    }
  }

  const name = profile.displayName || 'Advisor'
  const company = profile.companyName ? ` · ${profile.companyName}` : ''
  const titleParts = [name + company]
  if (profile.designation) titleParts.push(profile.designation)
  if (profile.city) titleParts.push(profile.city)
  const description = profile.bio
    ? truncateForMeta(profile.bio, 160)
    : `Verified financial advisor on ${SITE_NAME}.`

  const url = canonicalUrl(`/advisors/${params.id}`)

  return {
    title: titleParts.join(' — '),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      title: titleParts.join(' — '),
      description,
      url,
    },
    twitter: {
      card: 'summary',
      title: titleParts.join(' — '),
      description,
    },
  }
}

export default function AdvisorDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
