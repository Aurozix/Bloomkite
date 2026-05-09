import Decimal from 'decimal.js'
import { InsuranceNeedsInput, InsuranceNeedsResult } from './types'

export function calculateInsuranceNeeds(input: InsuranceNeedsInput): InsuranceNeedsResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const { annualIncome, incomeStability, incomePredictability, existingInsurance } = input

  // Determine multiplier based on stability and predictability
  let multiplier = 10
  let riskProfile = 'Low'

  if (incomeStability === 'STABLE' && incomePredictability === 'PREDICTABLE') {
    multiplier = 10
    riskProfile = 'Low'
  } else if (incomeStability === 'STABLE' && incomePredictability === 'UNPREDICTABLE') {
    multiplier = 15
    riskProfile = 'Medium'
  } else if (incomeStability === 'FLUCTUATING' && incomePredictability === 'PREDICTABLE') {
    multiplier = 10
    riskProfile = 'Medium'
  } else if (incomeStability === 'FLUCTUATING' && incomePredictability === 'UNPREDICTABLE') {
    multiplier = 15
    riskProfile = 'High'
  }

  // Calculate required insurance
  const income = new Decimal(annualIncome)
  const requiredInsurance = income.times(multiplier)

  // Calculate gap
  const existing = new Decimal(existingInsurance)
  const gap = requiredInsurance.minus(existing)
  const additionalCoverageNeeded = gap.isPositive() ? gap : new Decimal(0)

  return {
    requiredInsurance: requiredInsurance.toFixed(2),
    coverageMultiplier: multiplier,
    existingInsurance: existing.toFixed(2),
    additionalCoverageNeeded: additionalCoverageNeeded.toFixed(2),
    riskProfile,
  }
}
