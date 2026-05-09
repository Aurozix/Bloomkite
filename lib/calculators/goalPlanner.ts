import Decimal from 'decimal.js'
import { GoalPlannerInput, GoalPlannerResult } from './types'

export function calculateGoalPlan(input: GoalPlannerInput): GoalPlannerResult {
  const {
    goalAmount,
    currentSavings,
    tenureYears,
    inflationRate,
    growthRate,
    investmentRate,
  } = input

  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  const goal = new Decimal(goalAmount)
  const current = new Decimal(currentSavings)
  const tenure = new Decimal(tenureYears)
  const inflation = new Decimal(inflationRate).dividedBy(100)
  const growth = new Decimal(growthRate).dividedBy(100)
  const investmentRateDecimal = new Decimal(investmentRate).dividedBy(100)
  const months = tenure.times(12)

  // Adjusted inflation-adjusted goal amount
  const inflationFactor = new Decimal(1).plus(inflation).pow(tenure)
  const adjustedGoalAmount = goal.times(inflationFactor)

  // Future value of current savings
  const growthFactor = new Decimal(1).plus(growth).pow(tenure)
  const futureCurrentSavings = current.times(growthFactor)

  // Gap to fill with monthly investments
  const gap = adjustedGoalAmount.minus(futureCurrentSavings)

  // Monthly investment rate
  const monthlyRate = new Decimal(1).plus(investmentRateDecimal).pow(new Decimal(1).dividedBy(12)).minus(1)

  // Required monthly investment using FV of annuity formula
  // PMT = FV / [((1+r)^n - 1) / r]
  let requiredMonthly = new Decimal(0)
  if (monthlyRate.isPositive()) {
    const compoundFactor = new Decimal(1).plus(monthlyRate).pow(months)
    const annuityDivisor = compoundFactor.minus(1).dividedBy(monthlyRate)
    requiredMonthly = gap.dividedBy(annuityDivisor)
  } else {
    requiredMonthly = gap.dividedBy(months)
  }

  // Ensure non-negative
  const finalMonthly = requiredMonthly.isNegative() ? new Decimal(0) : requiredMonthly

  return {
    futureValue: adjustedGoalAmount.toFixed(2),
    requiredMonthlyInvestment: finalMonthly.toFixed(2),
    totalInvestmentNeeded: gap.toFixed(2),
    gap: gap.isNegative() ? new Decimal(0).toFixed(2) : gap.toFixed(2),
    monthlyInvestmentAfterInflation: finalMonthly.toFixed(2),
  }
}
