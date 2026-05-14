import type { Metadata } from 'next'

import { canonicalUrl } from '@/lib/seo'

// Section-level SEO defaults for /articles and /articles/[id] (BRD §13).

export const metadata: Metadata = {
  title: 'Articles — Financial planning insights',
  description:
    'Read articles by Bloomkite\'s verified financial advisors. Educational content on retirement planning, tax, insurance, mutual funds, and more.',
  alternates: { canonical: canonicalUrl('/articles') },
}

export default function ArticlesSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
