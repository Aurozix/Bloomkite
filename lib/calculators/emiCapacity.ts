import Decimal from 'decimal.js'
import { loanFromEmi } from './emi'
import {
  BackupAvailability,
  EMICapacityInput,
  EMICapacityResult,
  IncomeStabilityLevel,
} from './types'

// Maximum loan tenure in years for a home-loan affordability check.
// Spec §12.3 caps tenure at 20 years even if (retirementAge − currentAge)
// would allow longer; this is the standard Indian home-loan ceiling.
const MAX_LOAN_TENURE_YEARS = 20

// Stability × backup → surplus retention multiplier (spec §12.3).
// HIGH+YES keeps 100% of surplus; MEDIUM income with NO backup is the most
// conservative case at 80%.
function stabilityMultiplier(
  stability: IncomeStabilityLevel,
  backUp: BackupAvailability,
): Decimal {
  if (stability === 'HIGH' && backUp === 'YES') return new Decimal('1.00')
  if (stability === 'HIGH' && backUp === 'NO') return new Decimal('0.90')
  if (stability === 'MEDIUM' && backUp === 'YES') return new Decimal('0.90')
  return new Decimal('0.80')
}

// Computes the maximum loan amount affordable from monthly cash flow and the
// induced EMI. Reuses the present-value-of-annuity helper from the EMI lib so
// the loan math stays consistent across the loans cluster.
export function calculateEmiCapacity(input: EMICapacityInput): EMICapacityResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const netIncome = new Decimal(input.netFamilyIncome)
  const existingEmi = new Decimal(input.existingEmi)
  const expense = new Decimal(input.houseHoldExpense)
  const additional = new Decimal(input.additionalIncome)
  const rate = new Decimal(input.interestRate)
  const monthlyRate = rate.dividedBy(100).dividedBy(12)

  // Step 1: gross monthly surplus
  const surplusMoney = netIncome.minus(existingEmi).minus(expense)

  // Step 2: apply stability × backup multiplier
  const multiplier = stabilityMultiplier(input.stability, input.backUp)
  const adjustedSurplus = surplusMoney.times(multiplier)

  // Step 3: total EMI capacity adds back any non-salary income
  const emiCapacity = adjustedSurplus.plus(additional)

  // Step 4: tenure is min(20yr, working years remaining), floor at 0
  const workingYears = Math.max(0, input.retirementAge - input.currentAge)
  const termOfLoan = Math.min(MAX_LOAN_TENURE_YEARS, workingYears)
  const tenureMonths = termOfLoan * 12

  // Step 5: invert the EMI formula to get the loan principal that this EMI
  // can service. loanFromEmi clamps negative/zero capacity → 0 loan.
  const advisable = emiCapacity.lessThanOrEqualTo(0)
    ? new Decimal(0)
    : loanFromEmi(emiCapacity, monthlyRate, tenureMonths)

  return {
    surplusMoney: surplusMoney.toFixed(2),
    surplus: adjustedSurplus.toFixed(2),
    emiCapacity: emiCapacity.toFixed(2),
    termOfLoan,
    advisableLoanAmount: advisable.toFixed(2),
    monthlyEmiAffordable: emiCapacity.toFixed(2),
    stabilityMultiplier: multiplier.times(100).toFixed(0),
  }
}
