// SEBI-compliant educational-content disclaimer (BRD §8.3, §12.2).
// Rendered globally on calculator pages and article detail pages. Variant:
//   "default"  - subtle bottom banner (calculators)
//   "article"  - top-of-content callout (article detail)
//   "inline"   - tight one-liner for cards / share dialogs
//
// The wording is intentionally generic enough to satisfy SEBI guidance while
// staying readable. Counsel should confirm before launch but it never names
// a specific product, never quotes a return figure, and explicitly directs
// the reader to a registered advisor for personalised advice.

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  variant?: 'default' | 'article' | 'inline'
}

const COPY =
  'This is educational content, not personalised financial advice. Calculator outputs are illustrative and depend on the assumptions you provide. Consult a SEBI-registered investment advisor before making any investment, insurance, tax, or borrowing decision.'

export function FinancialDisclaimer({ variant = 'default' }: Props) {
  if (variant === 'inline') {
    return (
      <p className="text-xs text-ink-500 italic leading-snug">
        Educational only — not personalised financial advice. Consult a SEBI-registered advisor.
      </p>
    )
  }

  if (variant === 'article') {
    return (
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 flex gap-3"
        role="note"
        aria-label="Educational content disclaimer"
      >
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 leading-relaxed">{COPY}</p>
      </div>
    )
  }

  return (
    <aside
      className="mt-12 mb-6 rounded-lg border border-ink-200 bg-paper p-4 flex gap-3"
      role="note"
      aria-label="Educational content disclaimer"
    >
      <ExclamationTriangleIcon className="h-5 w-5 text-ink-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-ink-600 leading-relaxed">{COPY}</p>
    </aside>
  )
}
