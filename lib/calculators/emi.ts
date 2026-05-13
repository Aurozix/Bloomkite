import Decimal from 'decimal.js'
import {
  EMIAmortizationRow,
  EMICalculatorInput,
  EMICalculatorResult,
} from './types'

// EMI = P × [r(1+r)^n] / [(1+r)^n − 1]
// Returns the monthly payment for a fixed-rate loan of principal P over n months
// at monthly rate r. Zero-rate degenerates to P/n (linear amortization).
export function emiFromLoan(
  principal: Decimal,
  monthlyRate: Decimal,
  nMonths: number,
): Decimal {
  if (nMonths <= 0 || principal.lessThanOrEqualTo(0)) return new Decimal(0)
  if (monthlyRate.isZero()) return principal.dividedBy(nMonths)
  const onePlusR = new Decimal(1).plus(monthlyRate)
  const pow = onePlusR.pow(nMonths)
  return principal.times(monthlyRate).times(pow).dividedBy(pow.minus(1))
}

// Inverse of emiFromLoan — the principal that produces a given monthly payment
// stream. This is the present value of an n-month annuity at monthly rate r:
//   P = EMI × [(1+r)^n − 1] / [r(1+r)^n]
// Used by EMI Capacity to convert affordable EMI → max loan amount.
export function loanFromEmi(
  emi: Decimal,
  monthlyRate: Decimal,
  nMonths: number,
): Decimal {
  if (nMonths <= 0 || emi.lessThanOrEqualTo(0)) return new Decimal(0)
  if (monthlyRate.isZero()) return emi.times(nMonths)
  const onePlusR = new Decimal(1).plus(monthlyRate)
  const pow = onePlusR.pow(nMonths)
  return emi.times(pow.minus(1)).dividedBy(monthlyRate.times(pow))
}

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// Parse a "MMM-yyyy" string (e.g. "Jan-2026") into a [year, monthIndex] tuple.
// Returns null on any parse failure; the caller falls back to "today".
export function parseStartDate(input?: string): { year: number; monthIndex: number } | null {
  if (!input) return null
  const m = input.trim().match(/^([A-Za-z]{3})-(\d{4})$/)
  if (!m) return null
  const monthIndex = MONTH_NAMES.findIndex(
    (name) => name.toLowerCase() === m[1].toLowerCase(),
  )
  if (monthIndex < 0) return null
  const year = parseInt(m[2], 10)
  if (!Number.isFinite(year)) return null
  return { year, monthIndex }
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]}-${year}`
}

// Resolve a MMM-yyyy start date, falling back to the current month if missing
// or malformed. Used by every calculator that emits an amortization schedule.
export function resolveStartOrToday(input?: string): { year: number; monthIndex: number } {
  const parsed = parseStartDate(input)
  if (parsed) return parsed
  const now = new Date()
  return { year: now.getFullYear(), monthIndex: now.getMonth() }
}

// Compute the absolute month offset between two MMM-yyyy dates.
// Returns null if either date is unparseable. Negative result means
// `target` is before `start`.
export function monthsBetween(start: string, target: string): number | null {
  const s = parseStartDate(start)
  const t = parseStartDate(target)
  if (!s || !t) return null
  return (t.year - s.year) * 12 + (t.monthIndex - s.monthIndex)
}

// EMI = P × [r × (1+r)^n] / [(1+r)^n − 1]
// where r is the monthly rate (annual/12/100) and n is months.
// Generates a full amortization schedule per spec §11.4.
export function calculateEmi(input: EMICalculatorInput): EMICalculatorResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const principal = new Decimal(input.loanAmount)
  const annualRate = new Decimal(input.interestRate)
  const monthlyRate = annualRate.dividedBy(100).dividedBy(12)

  const nMonths =
    input.tenureType === 'YEAR'
      ? Math.round(input.tenure * 12)
      : Math.round(input.tenure)

  // Guard against zero-month or zero-principal inputs to avoid divide-by-zero.
  if (nMonths <= 0 || principal.lessThanOrEqualTo(0)) {
    return {
      emi: new Decimal(0).toFixed(2),
      interestPayable: new Decimal(0).toFixed(2),
      total: principal.toFixed(2),
      loanAmount: principal.toFixed(2),
      tenure: nMonths,
      rate: annualRate.toFixed(2),
      amortisationResponse: [],
    }
  }

  const emi = emiFromLoan(principal, monthlyRate, nMonths)

  // Build amortization schedule. The last row's closing balance is forced to
  // zero so floating-point drift over hundreds of months doesn't leave a
  // residual rupee balance.
  const start = resolveStartOrToday(input.startDate)

  const schedule: EMIAmortizationRow[] = []
  let opening = principal
  let cumulativePaid = new Decimal(0)

  for (let i = 0; i < nMonths; i++) {
    const interest = opening.times(monthlyRate)
    let principalPortion = emi.minus(interest)
    let closing = opening.minus(principalPortion)

    // Final payment: absorb any rounding residue into the last principal
    // so the schedule terminates at exactly zero.
    if (i === nMonths - 1) {
      principalPortion = opening
      closing = new Decimal(0)
    }

    cumulativePaid = cumulativePaid.plus(interest).plus(principalPortion)

    const loanPaidPct = principal.isZero()
      ? new Decimal(0)
      : principal.minus(closing).dividedBy(principal).times(100)

    const monthIndex = (start.monthIndex + i) % 12
    const year = start.year + Math.floor((start.monthIndex + i) / 12)

    schedule.push({
      monthNumber: i + 1,
      date: formatMonthYear(year, monthIndex),
      openingBalance: opening.toFixed(2),
      interest: interest.toFixed(2),
      principal: principalPortion.toFixed(2),
      closingBalance: closing.toFixed(2),
      loanPaid: loanPaidPct.toFixed(2),
      totalPaid: cumulativePaid.toFixed(2),
    })

    opening = closing
  }

  // Total interest = sum of interest column; total payable = principal + interest.
  // Using the column sum (not EMI × n) keeps the figure consistent with the
  // schedule after the final-row rounding adjustment.
  const totalInterest = schedule.reduce(
    (sum, row) => sum.plus(row.interest),
    new Decimal(0),
  )
  const totalPayable = principal.plus(totalInterest)

  return {
    emi: emi.toFixed(2),
    interestPayable: totalInterest.toFixed(2),
    total: totalPayable.toFixed(2),
    loanAmount: principal.toFixed(2),
    tenure: nMonths,
    rate: annualRate.toFixed(2),
    amortisationResponse: schedule,
  }
}
