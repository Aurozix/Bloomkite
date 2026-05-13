import Decimal from 'decimal.js'
import { TargetValueInput, TargetValueResult } from './types'

// PMT = FV / [((1 + r_m)^N - 1) / r_m]
// where r_m is the monthly compounding rate derived from the annual rate
// and N is the total number of monthly contributions.
//
// Edge cases:
//   - annualRate = 0: PMT = FV / N (linear, no compounding)
//   - tenureYears = 0: invalid; caller should validate
export function calculateTargetValue(input: TargetValueInput): TargetValueResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const fv = new Decimal(input.targetAmount)
  const annualRate = new Decimal(input.annualRate).dividedBy(100)
  const months = new Decimal(input.tenureYears).times(12)

  let pmt: Decimal
  if (annualRate.isZero()) {
    pmt = months.isZero() ? new Decimal(0) : fv.dividedBy(months)
  } else {
    // Convert annual to effective monthly: (1+r)^(1/12) - 1
    const rMonthly = new Decimal(1).plus(annualRate).pow(new Decimal(1).dividedBy(12)).minus(1)
    const compoundFactor = new Decimal(1).plus(rMonthly).pow(months)
    const annuityDivisor = compoundFactor.minus(1).dividedBy(rMonthly)
    pmt = fv.dividedBy(annuityDivisor)
  }

  const totalContribution = pmt.times(months)
  const expectedReturns = fv.minus(totalContribution)

  return {
    requiredMonthlyInvestment: pmt.toFixed(2),
    totalContribution: totalContribution.toFixed(2),
    expectedReturns: expectedReturns.isNegative()
      ? new Decimal(0).toFixed(2)
      : expectedReturns.toFixed(2),
  }
}
