import Decimal from 'decimal.js'
import { FutureValueInput, FutureValueResult } from './types'

// FV = P × (1 + r) ^ n
// where r is the annual rate and n is the tenure in years.
export function calculateFutureValue(input: FutureValueInput): FutureValueResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const pv = new Decimal(input.presentValue)
  const r = new Decimal(input.annualRate).dividedBy(100)
  const n = new Decimal(input.tenureYears)

  const compoundFactor = new Decimal(1).plus(r).pow(n)
  const fv = pv.times(compoundFactor)
  const interest = fv.minus(pv)
  // Compound rate is the annual rate itself for simple FV; expose for clarity.
  const effective = r.times(100)

  return {
    futureValue: fv.toFixed(2),
    totalInterest: interest.toFixed(2),
    effectiveAnnualGrowth: effective.toFixed(2),
  }
}
