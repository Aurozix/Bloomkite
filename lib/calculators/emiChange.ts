import Decimal from 'decimal.js'
import {
  emiFromLoan,
  formatMonthYear,
  monthsBetween,
  parseStartDate,
  resolveStartOrToday,
} from './emi'
import { EmiChangeInput, EmiChangeResult, EmiChangeRow } from './types'

// Defensive cap. The schedule should never exceed 2× the original tenure
// in any reasonable scenario; if it would, we mark the run as `diverged` so
// the UI can explain the result rather than render a 1000-row table.
const DIVERGENCE_TENURE_MULTIPLIER = 2

// Half a paisa. After ~240 iterations of (opening − principal) on Decimal
// values the residual can be a few millionths of a rupee; without this snap
// the loop runs one extra month past the true terminal period.
const CLOSING_EPSILON = new Decimal('0.005')

// Simulates a fixed-rate, variable-EMI loan. The borrower keeps paying the
// original EMI until each `emiChangedDate` lands; from that month onward the
// new EMI applies. The schedule terminates as soon as the balance reaches
// zero. A "diverged" run (EMI < interest accrual) is truncated and flagged.
export function calculateEmiChange(input: EmiChangeInput): EmiChangeResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const principal = new Decimal(input.loanAmount)
  const annualRate = new Decimal(input.interestRate)
  const monthlyRate = annualRate.dividedBy(100).dividedBy(12)

  const originalMonths =
    input.tenureType === 'YEAR'
      ? Math.round(input.tenure * 12)
      : Math.round(input.tenure)

  if (originalMonths <= 0 || principal.lessThanOrEqualTo(0)) {
    const zero = new Decimal(0).toFixed(2)
    return {
      originalEmi: zero,
      finalEmi: zero,
      originalTenureMonths: originalMonths,
      originalTenureYears: new Decimal(originalMonths).dividedBy(12).toFixed(2),
      originalTotalInterest: zero,
      revisedTenureMonths: 0,
      revisedTenureYears: '0.00',
      tenureReductionMonths: 0,
      tenureReductionYears: '0.00',
      totalInterestNow: zero,
      interestSaved: zero,
      diverged: false,
      newAmortisation: [],
    }
  }

  const originalEmi = emiFromLoan(principal, monthlyRate, originalMonths)
  const start = resolveStartOrToday(input.loanDate)

  const originalTotalInterest = monthlyRate.isZero()
    ? new Decimal(0)
    : originalEmi.times(originalMonths).minus(principal)

  // Map EMI-change dates → month offsets, drop unresolvable / out-of-range
  // entries. If multiple changes land on the same month, the latest one in
  // input order wins (caller can express "first X, then Y" via order).
  const emiChangesByMonth = new Map<number, Decimal>()
  if (input.loanDate && parseStartDate(input.loanDate)) {
    for (const entry of input.emiChangeReq ?? []) {
      const offset = monthsBetween(input.loanDate, entry.emiChangedDate)
      const newEmi = new Decimal(entry.newEmi)
      if (offset === null || offset < 0) continue
      if (newEmi.lessThanOrEqualTo(0)) continue
      emiChangesByMonth.set(offset, newEmi)
    }
  }

  const scheduleCap = Math.max(
    originalMonths * DIVERGENCE_TENURE_MULTIPLIER,
    originalMonths + 12,
  )

  const schedule: EmiChangeRow[] = []
  let opening = principal
  let cumulativePaid = new Decimal(0)
  let currentEmi = originalEmi
  let diverged = false

  for (let i = 0; i < scheduleCap; i++) {
    if (opening.lessThanOrEqualTo(0)) break

    if (emiChangesByMonth.has(i)) {
      currentEmi = emiChangesByMonth.get(i)!
    }

    const interest = opening.times(monthlyRate)

    // Divergence: EMI smaller than the interest accrual → loan never closes.
    // Stop here and flag so the result doesn't pretend tenure was reduced.
    if (currentEmi.lessThanOrEqualTo(interest) && monthlyRate.greaterThan(0)) {
      diverged = true
      break
    }

    let principalPortion = Decimal.min(currentEmi.minus(interest), opening)
    let closing = opening.minus(principalPortion)

    // Final-row rounding: snap closing to zero so floating drift doesn't leave
    // a residual sub-paisa on the books (which would otherwise force a
    // spurious extra row).
    if (closing.lessThanOrEqualTo(CLOSING_EPSILON)) {
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
      emiUsed: currentEmi.toFixed(2),
      loanPaid: loanPaidPct.toFixed(2),
      totalPaid: cumulativePaid.toFixed(2),
    })

    opening = closing
    if (closing.isZero()) break
  }

  // If we hit the schedule cap without closing the loan, treat it as diverged.
  if (schedule.length === scheduleCap && opening.greaterThan(0)) {
    diverged = true
  }

  const revisedTenureMonths = diverged ? 0 : schedule.length
  const tenureReductionMonths = diverged
    ? 0
    : Math.max(0, originalMonths - revisedTenureMonths)
  const totalInterestNow = schedule.reduce(
    (sum, row) => sum.plus(row.interest),
    new Decimal(0),
  )
  const interestSavedRaw = originalTotalInterest.minus(totalInterestNow)
  const interestSaved =
    diverged || interestSavedRaw.lessThan(0) ? new Decimal(0) : interestSavedRaw

  return {
    originalEmi: originalEmi.toFixed(2),
    finalEmi: currentEmi.toFixed(2),
    originalTenureMonths: originalMonths,
    originalTenureYears: new Decimal(originalMonths).dividedBy(12).toFixed(2),
    originalTotalInterest: originalTotalInterest.toFixed(2),
    revisedTenureMonths,
    revisedTenureYears: new Decimal(revisedTenureMonths).dividedBy(12).toFixed(2),
    tenureReductionMonths,
    tenureReductionYears: new Decimal(tenureReductionMonths).dividedBy(12).toFixed(2),
    totalInterestNow: totalInterestNow.toFixed(2),
    interestSaved: interestSaved.toFixed(2),
    diverged,
    newAmortisation: schedule,
  }
}
