import Decimal from 'decimal.js'
import { GoalPlannerInput, GoalPlannerResult } from './types'

// Aligns to Calculators_Requirements.md §1.3 with two documented deviations
// (covered by functional review):
//
//   * Spec §1.3 step 5 quotes the loan-amortization PMT formula
//     (PMT = PV × r(1+r)^n / ((1+r)^n−1)), but the use case is an *accumulation*
//     problem (PMT to reach a future corpus). We use the financially-correct
//     FV-of-annuity inverse instead: PMT = FV × r / ((1+r)^n − 1).
//
//   * Spec §1.4's quoted example value ₹44,124.56/month is inconsistent with
//     every interpretation of its own §1.3 formula. We assert the
//     mathematically correct value (~₹29,213/mo for the canonical inputs at
//     month-start timing) — see test fixtures.
//
// Rate convention follows spec §1.3 (nominal monthly = annual / 12) and
// timing follows §1.6 (annuity-due, month-start).
export function calculateGoalPlan(input: GoalPlannerInput): GoalPlannerResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const goal = new Decimal(input.goalAmount)
  const current = new Decimal(input.currentAmount)
  const inflation = new Decimal(input.inflationRate).dividedBy(100)
  const growth = new Decimal(input.growthRate).dividedBy(100)
  const annualInvest = new Decimal(input.annualInvestmentRate).dividedBy(100)

  // Step 1: normalize tenure to years (for the annual compounding on goal and
  // current savings) and months (for the monthly-investment annuity).
  const tenureYears =
    input.tenureType === 'YEAR'
      ? new Decimal(input.tenure)
      : new Decimal(input.tenure).dividedBy(12)
  const numMonths = tenureYears.times(12)
  const numMonthsInt = Math.round(numMonths.toNumber())

  // Step 2: futureCost — goal inflated to the future date.
  const futureCost = goal.times(new Decimal(1).plus(inflation).pow(tenureYears))

  // Step 3: futureValue — current savings grown to the future date.
  const futureValue = current.times(new Decimal(1).plus(growth).pow(tenureYears))

  // Step 4: finalCorpus — gap remaining to be filled by new monthly investments.
  // If current savings already exceed inflated goal, the gap is zero (no
  // additional investing needed) — clamp to avoid negative monthly figures.
  const rawCorpus = futureCost.minus(futureValue)
  const finalCorpus = rawCorpus.isNegative() ? new Decimal(0) : rawCorpus

  // Step 5: monthlyInv via FV-of-annuity-due inverse.
  //   ordinary FV factor:    s = ((1+r)^n − 1) / r
  //   annuity-due FV factor: s × (1+r)
  //   PMT = FV / annuity-due factor
  // Spec §1.6 calls for month-start timing, hence annuity-due.
  // Per spec §1.3 we use the nominal monthly rate (annual / 12), not an
  // effective rate that compounds to the annual.
  const monthlyRate = annualInvest.dividedBy(12)

  let monthlyInv: Decimal
  if (finalCorpus.isZero() || numMonths.isZero()) {
    monthlyInv = new Decimal(0)
  } else if (monthlyRate.isZero()) {
    // Zero-return investments: linear accumulation, no annuity factor.
    monthlyInv = finalCorpus.dividedBy(numMonths)
  } else {
    const compound = new Decimal(1).plus(monthlyRate).pow(numMonths)
    const ordinaryFactor = compound.minus(1).dividedBy(monthlyRate)
    const dueFactor = ordinaryFactor.times(new Decimal(1).plus(monthlyRate))
    monthlyInv = finalCorpus.dividedBy(dueFactor)
  }

  const annualInv = monthlyInv.times(12)

  void numMonthsInt // explicit unused — kept available for any future spec field

  return {
    futureCost: futureCost.toFixed(2),
    futureValue: futureValue.toFixed(2),
    finalCorpus: finalCorpus.toFixed(2),
    monthlyInv: monthlyInv.toFixed(2),
    annualInv: annualInv.toFixed(2),
    rateOfReturn: monthlyRate.toFixed(5),
  }
}
