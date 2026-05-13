import Decimal from 'decimal.js'
import {
  emiFromLoan,
  formatMonthYear,
  monthsBetween,
  parseStartDate,
  resolveStartOrToday,
} from './emi'
import {
  PartialPaymentInput,
  PartialPaymentResult,
  PartialPaymentRow,
} from './types'

// Hard cap on schedule length. Original tenure is the upper bound — prepayments
// only shorten, never lengthen — so this is just defensive against bad inputs.
const MAX_SCHEDULE_MONTHS_HARDCAP = 1000

// Models lump-sum prepayments against a running loan with constant EMI.
// At the start of each month index that matches a prepayment date, the amount
// is added to that month's principal reduction. EMI stays the same; the loan
// terminates as soon as the closing balance reaches zero.
//
// Output mirrors the EMI Calculator schedule with an extra `partialPayment`
// column, plus tenure/interest comparisons vs. the original (non-prepaid) loan.
export function calculatePartialPayment(input: PartialPaymentInput): PartialPaymentResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const principal = new Decimal(input.loanAmount)
  const annualRate = new Decimal(input.interestRate)
  const monthlyRate = annualRate.dividedBy(100).dividedBy(12)

  const originalMonths =
    input.tenureType === 'YEAR'
      ? Math.round(input.tenure * 12)
      : Math.round(input.tenure)

  // Degenerate inputs → empty result; caller can surface the validation issue.
  if (originalMonths <= 0 || principal.lessThanOrEqualTo(0)) {
    const zero = new Decimal(0).toFixed(2)
    return {
      emi: zero,
      originalTenureMonths: originalMonths,
      originalTenureYears: new Decimal(originalMonths).dividedBy(12).toFixed(2),
      originalTotalInterest: zero,
      revisedTenureMonths: 0,
      revisedTenureYears: '0.00',
      tenureReductionMonths: 0,
      tenureReductionYears: '0.00',
      totalInterestNow: zero,
      interestSaved: zero,
      newAmortisation: [],
    }
  }

  const emi = emiFromLoan(principal, monthlyRate, originalMonths)
  const startDate = input.loanDate ?? ''
  const start = resolveStartOrToday(input.loanDate)

  // Original (no-prepayment) total interest is needed for the "saved" output.
  // We sum it symbolically — for zero-rate loans interest = 0, otherwise it's
  // EMI × n − principal (matches the EMI calculator's totals path).
  const originalTotalInterest = monthlyRate.isZero()
    ? new Decimal(0)
    : emi.times(originalMonths).minus(principal)

  // Map prepayment dates to month indices (0-based, from loan start).
  // Entries with unresolvable dates, negative offsets, or beyond the tenure
  // are dropped — we don't error, since the UI may be exploring scenarios.
  const prepaymentByMonth = new Map<number, Decimal>()
  if (input.loanDate && parseStartDate(input.loanDate)) {
    for (const entry of input.partialPaymentReq ?? []) {
      const offset = monthsBetween(input.loanDate, entry.partPayDate)
      const amount = new Decimal(entry.partPayAmount)
      if (offset === null || offset < 0 || offset >= originalMonths) continue
      if (amount.lessThanOrEqualTo(0)) continue
      const existing = prepaymentByMonth.get(offset) ?? new Decimal(0)
      prepaymentByMonth.set(offset, existing.plus(amount))
    }
  } else {
    // Without a parseable loan start date we can't align prepayment dates to
    // month indices. The schedule still runs but treats prepayments as absent.
  }

  const schedule: PartialPaymentRow[] = []
  let opening = principal
  let cumulativePaid = new Decimal(0)

  const scheduleCap = Math.min(originalMonths, MAX_SCHEDULE_MONTHS_HARDCAP)

  for (let i = 0; i < scheduleCap; i++) {
    if (opening.lessThanOrEqualTo(0)) break

    const interest = opening.times(monthlyRate)
    let principalPortion = Decimal.min(emi.minus(interest), opening)
    let prepayment = prepaymentByMonth.get(i) ?? new Decimal(0)

    // If the prepayment alone would close the loan, cap it at the remaining
    // balance after the scheduled EMI principal. Don't refund the excess.
    let closing = opening.minus(principalPortion).minus(prepayment)
    if (closing.lessThan(0)) {
      prepayment = opening.minus(principalPortion)
      if (prepayment.lessThan(0)) prepayment = new Decimal(0)
      closing = new Decimal(0)
    }

    // Final scheduled row: if the EMI would over-pay the residual, absorb the
    // overage so closing lands exactly at zero (same approach as EMI calc).
    if (closing.lessThanOrEqualTo(0)) {
      principalPortion = opening.minus(prepayment)
      if (principalPortion.lessThan(0)) {
        prepayment = opening
        principalPortion = new Decimal(0)
      }
      closing = new Decimal(0)
    }

    cumulativePaid = cumulativePaid.plus(interest).plus(principalPortion).plus(prepayment)

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
      partialPayment: prepayment.toFixed(2),
      closingBalance: closing.toFixed(2),
      loanPaid: loanPaidPct.toFixed(2),
      totalPaid: cumulativePaid.toFixed(2),
    })

    opening = closing
    if (closing.isZero()) break
  }

  const revisedTenureMonths = schedule.length
  const tenureReductionMonths = Math.max(0, originalMonths - revisedTenureMonths)
  const totalInterestNow = schedule.reduce(
    (sum, row) => sum.plus(row.interest),
    new Decimal(0),
  )
  const interestSaved = originalTotalInterest.minus(totalInterestNow)
  // Negative interestSaved would only arise if the prepayment math drifted;
  // clamp it to zero so the UI never displays a negative "saved" number.
  const interestSavedClamped = interestSaved.lessThan(0) ? new Decimal(0) : interestSaved

  void startDate // explicit no-op; field retained for future "loanDate echoed" outputs

  return {
    emi: emi.toFixed(2),
    originalTenureMonths: originalMonths,
    originalTenureYears: new Decimal(originalMonths).dividedBy(12).toFixed(2),
    originalTotalInterest: originalTotalInterest.toFixed(2),
    revisedTenureMonths,
    revisedTenureYears: new Decimal(revisedTenureMonths).dividedBy(12).toFixed(2),
    tenureReductionMonths,
    tenureReductionYears: new Decimal(tenureReductionMonths).dividedBy(12).toFixed(2),
    totalInterestNow: totalInterestNow.toFixed(2),
    interestSaved: interestSavedClamped.toFixed(2),
    newAmortisation: schedule,
  }
}
