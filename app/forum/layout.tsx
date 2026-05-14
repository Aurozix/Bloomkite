import type { Metadata } from 'next'

import { canonicalUrl } from '@/lib/seo'

// Section-level SEO defaults for /forum and /forum/questions/[id] (BRD §13).

export const metadata: Metadata = {
  title: 'Forum — Ask financial advisors',
  description:
    'Ask questions and get answers from Bloomkite\'s verified financial advisor community. Tag advisors directly for expert input.',
  alternates: { canonical: canonicalUrl('/forum') },
}

export default function ForumSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
