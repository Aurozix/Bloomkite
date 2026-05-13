import Decimal from 'decimal.js'
import {
  emiFromLoan,
  formatMonthYear,
  monthsBetween,
  parseStartDate,
  resolveStartOrToday,
} from './emi'
import {
  RateChangeApproach,
  RateChangeApproachResult,
  RateChangeInput,
  RateChangeResult,
  RateChangeRow,
} from './types'

// 2× original tenure is the upper bound for Approach A — if a rate hike
// would extend the loan beyond that, we declare the run diverged.
const APPROACH_A_TENURE_MULTIPLIER = 2

// Sub-paisa snap. Floating drift over ~240 simulation steps can leave a
// residual like 1e-6 INR in the closing balance; without this snap the loop
// runs one spurious extra row. Same constant + reasoning as emiChange.ts.
const CLOSING_EPSILON = new Decimal('0.005')

interface ChangeMap {
  // month-index → new monthly rate (Decimal)
  rateByMonth: Map<number, Decimal>
}

function buildRateChangeMap(input: RateChangeInput): ChangeMap {
  const rateByMonth = new Map<number, Decimal>()
  if (!input.loanDate || !parseStartDate(input.loanDate)) return { rateByMonth }
  for (const entry of input.interestChangeReq ?? []) {
    const offset = monthsBetween(input.loanDate, entry.interestChangedDate)
    const newRate = new Decimal(entry.changedRate).dividedBy(100).dividedBy(12)
    if (offset === null || offset < 0) continue
    if (newRate.isNegative()) continue
    rateByMonth.set(offset, newRate)
  }
  return { rateByMonth }
}

// Approach A: EMI stays at the original value; the rate changes mid-stream,
// so the tenure adjusts (shorter for rate cuts, longer for rate hikes).
// Mirrors the EMI Change Impact simulation with the roles of EMI and rate
// swapped — divergence happens here when a rate hike pushes monthly interest
// above the (now-static) EMI.
function simulateApproachA(
  principal: Decimal,
  originalEmi: Decimal,
  initialMonthlyRate: Decimal,
  originalMonths: number,
  changes: Map<number, Decimal>,
  start: { year: number; monthIndex: number },
): { schedule: RateChangeRow[]; diverged: boolean; finalEmi: Decimal } {
  const scheduleCap = Math.max(
    originalMonths * APPROACH_A_TENURE_MULTIPLIER,
    originalMonths + 12,
  )

  const schedule: RateChangeRow[] = []
  let opening = principal
  let cumulativePaid = new Decimal(0)
  let currentRate = initialMonthlyRate
  let diverged = false

  for (let i = 0; i < scheduleCap; i++) {
    if (opening.lessThanOrEqualTo(0)) break

    if (changes.has(i)) currentRate = changes.get(i)!

    const interest = opening.times(currentRate)

    // Negative-amortization guard — rate hike pushed interest above EMI.
    if (originalEmi.lessThanOrEqualTo(interest) && currentRate.greaterThan(0)) {
      diverged = true
      break
    }

    let principalPortion = Decimal.min(originalEmi.minus(interest), opening)
    let closing = opening.minus(principalPortion)

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
      emiUsed: originalEmi.toFixed(2),
      rateUsed: currentRate.times(12).times(100).toFixed(2),
      loanPaid: loanPaidPct.toFixed(2),
      totalPaid: cumulativePaid.toFixed(2),
    })

    opening = closing
    if (closing.isZero()) break
  }

  if (schedule.length === scheduleCap && opening.greaterThan(0)) {
    diverged = true
  }

  return { schedule, diverged, finalEmi: originalEmi }
}

// Approach B: tenure stays at original months; at each rate change we
// recompute the EMI via emiFromLoan(outstanding, newRate, monthsLeft) so the
// loan still closes at month `originalMonths`. Multiple swaps each rebuild
// the EMI on the residual term.
function simulateApproachB(
  principal: Decimal,
  initialMonthlyRate: Decimal,
  originalMonths: number,
  changes: Map<number, Decimal>,
  start: { year: number; monthIndex: number },
): { schedule: RateChangeRow[]; finalEmi: Decimal } {
  const schedule: RateChangeRow[] = []
  let opening = principal
  let cumulativePaid = new Decimal(0)
  let currentRate = initialMonthlyRate
  let currentEmi = emiFromLoan(principal, currentRate, originalMonths)

  for (let i = 0; i < originalMonths; i++) {
    if (opening.lessThanOrEqualTo(0)) break

    // Rate change → recompute EMI to amortize the remaining balance over the
    // remaining months at the new rate.
    if (changes.has(i)) {
      currentRate = changes.get(i)!
      const monthsLeft = originalMonths - i
      currentEmi = emiFromLoan(opening, currentRate, monthsLeft)
    }

    const interest = opening.times(currentRate)
    let principalPortion = Decimal.min(currentEmi.minus(interest), opening)
    let closing = opening.minus(principalPortion)

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
      rateUsed: currentRate.times(12).times(100).toFixed(2),
      loanPaid: loanPaidPct.toFixed(2),
      totalPaid: cumulativePaid.toFixed(2),
    })

    opening = closing
    if (closing.isZero()) break
  }

  return { schedule, finalEmi: currentEmi }
}

function packApproachResult(
  approach: RateChangeApproach,
  finalEmi: Decimal,
  originalEmi: Decimal,
  originalMonths: number,
  originalTotalInterest: Decimal,
  schedule: RateChangeRow[],
  diverged: boolean,
): RateChangeApproachResult {
  const revisedTenureMonths = diverged ? 0 : schedule.length
  const tenureChangeMonths = diverged ? 0 : originalMonths - revisedTenureMonths
  const totalInterest = schedule.reduce(
    (sum, row) => sum.plus(row.interest),
    new Decimal(0),
  )
  const interestSavedRaw = originalTotalInterest.minus(totalInterest)
  const interestSaved =
    diverged || interestSavedRaw.lessThan(0) ? new Decimal(0) : interestSavedRaw
  const emiChange = finalEmi.minus(originalEmi)

  return {
    approach,
    finalEmi: finalEmi.toFixed(2),
    revisedTenureMonths,
    revisedTenureYears: new Decimal(revisedTenureMonths).dividedBy(12).toFixed(2),
    tenureChangeMonths,
    tenureChangeYears: new Decimal(tenureChangeMonths).dividedBy(12).toFixed(2),
    emiChange: emiChange.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    interestSaved: interestSaved.toFixed(2),
    diverged,
    newAmortisation: schedule,
  }
}

// Calculates both rate-change strategies in one pass so the UI can render
// them side-by-side and let the borrower pick. The shared baseline is the
// original loan with no rate change at all.
export function calculateRateChange(input: RateChangeInput): RateChangeResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const principal = new Decimal(input.loanAmount)
  const annualRate = new Decimal(input.interestRate)
  const initialMonthlyRate = annualRate.dividedBy(100).dividedBy(12)

  const originalMonths =
    input.tenureType === 'YEAR'
      ? Math.round(input.tenure * 12)
      : Math.round(input.tenure)

  if (originalMonths <= 0 || principal.lessThanOrEqualTo(0)) {
    const zero = new Decimal(0).toFixed(2)
    const emptyApproach = (a: RateChangeApproach): RateChangeApproachResult => ({
      approach: a,
      finalEmi: zero,
      revisedTenureMonths: 0,
      revisedTenureYears: '0.00',
      tenureChangeMonths: 0,
      tenureChangeYears: '0.00',
      emiChange: zero,
      totalInterest: zero,
      interestSaved: zero,
      diverged: false,
      newAmortisation: [],
    })
    return {
      originalEmi: zero,
      originalTenureMonths: originalMonths,
      originalTenureYears: new Decimal(originalMonths).dividedBy(12).toFixed(2),
      originalTotalInterest: zero,
      approachA: emptyApproach('TENURE_ADJUSTS'),
      approachB: emptyApproach('EMI_ADJUSTS'),
    }
  }

  const originalEmi = emiFromLoan(principal, initialMonthlyRate, originalMonths)
  const originalTotalInterest = initialMonthlyRate.isZero()
    ? new Decimal(0)
    : originalEmi.times(originalMonths).minus(principal)

  const start = resolveStartOrToday(input.loanDate)
  const { rateByMonth } = buildRateChangeMap(input)

  const a = simulateApproachA(
    principal,
    originalEmi,
    initialMonthlyRate,
    originalMonths,
    rateByMonth,
    start,
  )
  const b = simulateApproachB(
    principal,
    initialMonthlyRate,
    originalMonths,
    rateByMonth,
    start,
  )

  return {
    originalEmi: originalEmi.toFixed(2),
    originalTenureMonths: originalMonths,
    originalTenureYears: new Decimal(originalMonths).dividedBy(12).toFixed(2),
    originalTotalInterest: originalTotalInterest.toFixed(2),
    approachA: packApproachResult(
      'TENURE_ADJUSTS',
      a.finalEmi,
      originalEmi,
      originalMonths,
      originalTotalInterest,
      a.schedule,
      a.diverged,
    ),
    approachB: packApproachResult(
      'EMI_ADJUSTS',
      b.finalEmi,
      originalEmi,
      originalMonths,
      originalTotalInterest,
      b.schedule,
      false,
    ),
  }
}
