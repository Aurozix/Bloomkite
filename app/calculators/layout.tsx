import type { Metadata } from 'next'

import { FinancialDisclaimer } from '@/app/components/FinancialDisclaimer'
import { canonicalUrl } from '@/lib/seo'

// Layout wrapper for /calculators/*. Two responsibilities:
//
// (1) BRD §8.3 / §12.2 — every calculator page (current and future)
//     carries the SEBI-compliant educational-content disclaimer. Adding a
//     new calculator page automatically inherits it.
//
// (2) BRD §13 — section-level SEO defaults. Per-calculator pages override
//     `title` via the root layout's title-template (`%s · Bloomkite`); the
//     description here applies to /calculators and any per-calc page that
//     doesn't supply its own.

export const metadata: Metadata = {
  title: 'Financial calculators',
  description:
    '15 free financial planning calculators — goal planning, EMI, net worth, cash flow, insurance needs, retirement, and more. No sign-up required.',
  alternates: { canonical: canonicalUrl('/calculators') },
}

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <FinancialDisclaimer />
      </div>
    </>
  )
}
