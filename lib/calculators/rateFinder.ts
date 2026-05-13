import Decimal from 'decimal.js'
import { RateFinderInput, RateFinderResult } from './types'

// Solve FV = PV × (1+r)^n for r:
//   r = (FV / PV)^(1/n) - 1
//
// Validates positivity: FV must be > 0, PV must be > 0, n must be > 0.
// Returning percent (× 100), rounded to 2 decimals.
export function calculateRequiredRate(input: RateFinderInput): RateFinderResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const fv = new Decimal(input.futureValue)
  const pv = new Decimal(input.presentValue)
  const n = new Decimal(input.tenureYears)

  if (pv.isZero() || pv.isNegative() || n.isZero() || n.isNegative()) {
    return {
      requiredAnnualRate: new Decimal(0).toFixed(2),
      multiplier: new Decimal(0).toFixed(2),
    }
  }

  const ratio = fv.dividedBy(pv)
  const annualGrowth = ratio.pow(new Decimal(1).dividedBy(n))
  const rate = annualGrowth.minus(1).times(100)

  return {
    requiredAnnualRate: rate.toFixed(2),
    multiplier: ratio.toFixed(2),
  }
}
