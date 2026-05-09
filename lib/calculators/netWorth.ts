import Decimal from 'decimal.js'
import { NetWorthCalculatorInput, NetWorthCalculatorResult } from './types'

export function calculateNetWorth(input: NetWorthCalculatorInput): NetWorthCalculatorResult {
  Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

  // Sum all assets
  const totalAssets = input.assets.reduce((sum, asset) => {
    return sum.plus(new Decimal(asset.amount))
  }, new Decimal(0))

  // Sum all liabilities
  const totalLiabilities = input.liabilities.reduce((sum, liability) => {
    return sum.plus(new Decimal(liability.amount))
  }, new Decimal(0))

  // Net worth
  const netWorth = totalAssets.minus(totalLiabilities)

  // Asset breakdown with percentages
  const assetBreakdown = input.assets.map((asset) => {
    const amount = new Decimal(asset.amount)
    let percentage = new Decimal(0)
    if (totalAssets.isPositive()) {
      percentage = amount.dividedBy(totalAssets).times(100)
    }
    return {
      category: asset.name,
      amount: amount.toFixed(2),
      percentage: percentage.toFixed(2),
    }
  })

  return {
    totalAssets: totalAssets.toFixed(2),
    totalLiabilities: totalLiabilities.toFixed(2),
    netWorth: netWorth.toFixed(2),
    assetBreakdown,
  }
}
