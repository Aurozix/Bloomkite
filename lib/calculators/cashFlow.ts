import Decimal from 'decimal.js'
import { CashFlowAnalyzerInput, CashFlowAnalyzerResult } from './types'

export function calculateCashFlow(input: CashFlowAnalyzerInput): CashFlowAnalyzerResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  // Sum income
  const totalIncome = input.incomeItems.reduce((sum, item) => {
    return sum.plus(new Decimal(item.amount))
  }, new Decimal(0))

  // Sum expenses
  const totalExpenses = input.expenseItems.reduce((sum, item) => {
    return sum.plus(new Decimal(item.amount))
  }, new Decimal(0))

  // Net cash flow
  const monthlyNetCashFlow = totalIncome.minus(totalExpenses)
  const yearlyNetCashFlow = monthlyNetCashFlow.times(12)

  // Savings rate
  let savingsRate = new Decimal(0)
  if (totalIncome.isPositive()) {
    savingsRate = monthlyNetCashFlow.dividedBy(totalIncome).times(100)
  }

  // Surplus or deficit
  const surplus = monthlyNetCashFlow.isPositive() ? monthlyNetCashFlow : new Decimal(0)
  const deficit = monthlyNetCashFlow.isNegative() ? monthlyNetCashFlow.abs() : new Decimal(0)

  return {
    totalMonthlyIncome: totalIncome.toFixed(2),
    totalMonthlyExpenses: totalExpenses.toFixed(2),
    monthlyNetCashFlow: monthlyNetCashFlow.toFixed(2),
    yearlyNetCashFlow: yearlyNetCashFlow.toFixed(2),
    savingsRate: savingsRate.toFixed(2),
    surplus: surplus.toFixed(2),
    deficit: deficit.toFixed(2),
  }
}
