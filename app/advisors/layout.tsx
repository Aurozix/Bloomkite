import type { Metadata } from 'next'

import { canonicalUrl } from '@/lib/seo'

// Section-level SEO defaults for /advisors and /advisors/[id] (BRD §13).
// Per-advisor pages override `title` + `description` via their own layout's
// generateMetadata; this layout supplies the listing-page metadata and
// inherited OG fields.

export const metadata: Metadata = {
  title: 'Find a verified financial advisor',
  description:
    'Browse Bloomkite\'s curated, credential-verified financial advisors. Filter by products, services, brands, expertise, and city to find someone who fits your needs.',
  alternates: { canonical: canonicalUrl('/advisors') },
}

export default function AdvisorsSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
