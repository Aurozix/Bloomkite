import { FinancialDisclaimer } from '@/app/components/FinancialDisclaimer'

// Layout wrapper for /calculators/*. The single point that ensures every
// calculator page (current and future) carries the BRD §8.3 / §12.2
// educational-content disclaimer. Adding a new calculator page automatically
// inherits this — you can't ship a calculator without the SEBI-compliant
// disclaimer.

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
