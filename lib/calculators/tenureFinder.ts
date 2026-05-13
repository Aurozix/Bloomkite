import Decimal from 'decimal.js'
import { TenureFinderInput, TenureFinderResult } from './types'

// Solve FV = PV × (1+r)^n for n:
//   n = ln(FV/PV) / ln(1+r)
//
// Decimal.js's `.ln()` operates on the underlying Decimal. We need natural log
// at high precision to keep the result stable for tight rate inputs.
export function calculateRequiredTenure(input: TenureFinderInput): TenureFinderResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const fv = new Decimal(input.futureValue)
  const pv = new Decimal(input.presentValue)
  const r = new Decimal(input.annualRate).dividedBy(100)

  // Guard against impossible inputs.
  if (pv.isZero() || pv.isNegative() || fv.isZero() || fv.isNegative()) {
    return {
      requiredYears: new Decimal(0).toFixed(2),
      requiredMonths: new Decimal(0).toFixed(0),
    }
  }
  if (r.isZero() || r.isNegative()) {
    // With non-positive growth, target is only reachable if FV <= PV; otherwise
    // mathematically unreachable. Return 0 to signal "not achievable" rather
    // than blowing up; the UI surfaces the constraint.
    return {
      requiredYears: fv.lessThanOrEqualTo(pv) ? new Decimal(0).toFixed(2) : new Decimal(0).toFixed(2),
      requiredMonths: new Decimal(0).toFixed(0),
    }
  }

  const ratio = fv.dividedBy(pv)
  const years = ratio.ln().dividedBy(new Decimal(1).plus(r).ln())
  const months = years.times(12)

  return {
    requiredYears: years.toFixed(2),
    requiredMonths: months.toFixed(0),
  }
}
