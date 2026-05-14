// Indian-locale currency formatting + parsing.
//
// Indian numbering is non-uniform: thousands grouping switches at the lakh
// boundary. 100000 → "1,00,000" (one lakh), 10000000 → "1,00,00,000" (one
// crore). Intl.NumberFormat('en-IN') handles this natively. Don't roll your
// own grouping logic — it's a tarpit.
//
// All currency inputs across calculators flow through this. Display uses
// formatINR; user-edited values flow through parseINR. Both are pure.

/**
 * Format a number as INR with Indian grouping. No symbol by default — the
 * input field renders ₹ as a static prefix so the formatted value can sit
 * directly beside it without spacing fights. Set `withSymbol` for places
 * that need the all-in-one string (charts, tooltips).
 */
export function formatINR(value: number, options?: { withSymbol?: boolean }): string {
  if (!Number.isFinite(value)) return ''
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
  return options?.withSymbol ? `₹${formatted}` : formatted
}

/**
 * Parse a user-entered currency string back to a number. Strips the rupee
 * symbol, every comma, and any whitespace. Returns NaN if the residue isn't
 * numeric — callers should guard.
 *
 *   parseINR("₹1,00,000")   → 100000
 *   parseINR("100000")       → 100000
 *   parseINR("1,23,456.78")  → 123456.78
 *   parseINR("abc")          → NaN
 */
export function parseINR(input: string): number {
  if (!input) return NaN
  const cleaned = input.replace(/₹|,|\s/g, '')
  if (cleaned === '') return NaN
  const n = Number(cleaned)
  return n
}

/**
 * Format a number as a compact INR string for tight surfaces (chart axes,
 * sparklines, slider readouts on mobile). Uses lakh / crore suffixes.
 *
 *   formatINRCompact(50000)    → "₹50K"
 *   formatINRCompact(100000)   → "₹1L"
 *   formatINRCompact(1500000)  → "₹15L"
 *   formatINRCompact(10000000) → "₹1Cr"
 */
export function formatINRCompact(value: number): string {
  if (!Number.isFinite(value)) return ''
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 10_000_000) {
    return `${sign}₹${(abs / 10_000_000).toFixed(abs >= 1_00_00_00_000 ? 0 : 2).replace(/\.?0+$/, '')}Cr`
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 2).replace(/\.?0+$/, '')}L`
  }
  if (abs >= 1_000) {
    return `${sign}₹${(abs / 1_000).toFixed(0)}K`
  }
  return `${sign}₹${Math.round(abs)}`
}
