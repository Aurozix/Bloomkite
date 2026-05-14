import type { Metadata } from 'next'

import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Support — Contact Bloomkite',
  description:
    'Get help with your account, billing, advisor issues, or file a grievance. We respond by email.',
  alternates: { canonical: canonicalUrl('/support') },
}

export default function SupportSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
