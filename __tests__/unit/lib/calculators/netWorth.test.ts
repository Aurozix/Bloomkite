import { calculateNetWorth } from '@/lib/calculators/netWorth'
import { netWorthInputs } from '../../../fixtures/calculators'

describe('calculateNetWorth', () => {
  describe('happy path', () => {
    it('should calculate net worth with basic inputs', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      expect(result).toHaveProperty('totalAssets')
      expect(result).toHaveProperty('totalLiabilities')
      expect(result).toHaveProperty('netWorth')
      expect(result).toHaveProperty('assetBreakdown')
      expect(Array.isArray(result.assetBreakdown)).toBe(true)
    })

    it('should calculate total assets correctly', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      const expectedAssets = 500000 + 2000000 + 5000000
      expect(parseFloat(result.totalAssets)).toBe(expectedAssets)
    })

    it('should calculate total liabilities correctly', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      const expectedLiabilities = 3000000 + 200000
      expect(parseFloat(result.totalLiabilities)).toBe(expectedLiabilities)
    })

    it('should calculate net worth as assets minus liabilities', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      const assets = parseFloat(result.totalAssets)
      const liabilities = parseFloat(result.totalLiabilities)
      const expected = assets - liabilities

      expect(parseFloat(result.netWorth)).toBe(expected)
    })
  })

  describe('asset breakdown', () => {
    it('should include all assets in breakdown', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      expect(result.assetBreakdown.length).toBe(netWorthInputs.basic.assets.length)
    })

    it('should calculate asset percentages correctly', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      const totalAssets = parseFloat(result.totalAssets)
      result.assetBreakdown.forEach((breakdown) => {
        const amount = parseFloat(breakdown.amount)
        const expectedPercentage = (amount / totalAssets) * 100

        expect(parseFloat(breakdown.percentage)).toBeCloseTo(expectedPercentage, 1)
      })
    })

    it('should sum asset percentages to 100', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      const totalPercentage = result.assetBreakdown.reduce(
        (sum, asset) => sum + parseFloat(asset.percentage),
        0,
      )

      expect(totalPercentage).toBeCloseTo(100, 0)
    })

    it('should have correct category names in breakdown', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      const categories = result.assetBreakdown.map((a) => a.category)
      const expectedCategories = netWorthInputs.basic.assets.map((a) => a.name)

      expectedCategories.forEach((expected) => {
        expect(categories).toContain(expected)
      })
    })
  })

  describe('scenarios', () => {
    it('should handle no liabilities', () => {
      const result = calculateNetWorth(netWorthInputs.noLiabilities)

      expect(parseFloat(result.totalLiabilities)).toBe(0)
      expect(parseFloat(result.netWorth)).toBe(parseFloat(result.totalAssets))
    })

    it('should handle balanced assets and liabilities', () => {
      const result = calculateNetWorth(netWorthInputs.balanced)

      const netWorth = parseFloat(result.netWorth)
      const assets = parseFloat(result.totalAssets)
      const liabilities = parseFloat(result.totalLiabilities)

      expect(netWorth).toBe(assets - liabilities)
      expect(netWorth).toBeGreaterThan(0)
    })

    it('should handle liabilities greater than assets', () => {
      const result = calculateNetWorth({
        assets: [{ name: 'Savings', amount: 100000 }],
        liabilities: [{ name: 'Debt', amount: 500000 }],
      })

      expect(parseFloat(result.netWorth)).toBeLessThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle no assets', () => {
      const result = calculateNetWorth({
        assets: [],
        liabilities: [{ name: 'Debt', amount: 100000 }],
      })

      expect(parseFloat(result.totalAssets)).toBe(0)
      expect(result.assetBreakdown.length).toBe(0)
      expect(parseFloat(result.netWorth)).toBe(-100000)
    })

    it('should handle zero assets and zero liabilities', () => {
      const result = calculateNetWorth({
        assets: [],
        liabilities: [],
      })

      expect(parseFloat(result.totalAssets)).toBe(0)
      expect(parseFloat(result.totalLiabilities)).toBe(0)
      expect(parseFloat(result.netWorth)).toBe(0)
      expect(result.assetBreakdown.length).toBe(0)
    })

    it('should handle single asset', () => {
      const result = calculateNetWorth({
        assets: [{ name: 'House', amount: 5000000 }],
        liabilities: [],
      })

      expect(parseFloat(result.totalAssets)).toBe(5000000)
      expect(result.assetBreakdown[0].percentage).toBe('100.00')
    })

    it('should handle many assets and liabilities', () => {
      const result = calculateNetWorth({
        assets: Array(10)
          .fill(null)
          .map((_, i) => ({ name: `Asset ${i}`, amount: 100000 })),
        liabilities: Array(10)
          .fill(null)
          .map((_, i) => ({ name: `Liability ${i}`, amount: 50000 })),
      })

      expect(result.assetBreakdown.length).toBe(10)
      expect(parseFloat(result.totalAssets)).toBe(1000000)
      expect(parseFloat(result.totalLiabilities)).toBe(500000)
    })

    it('should handle decimal amounts', () => {
      const result = calculateNetWorth({
        assets: [{ name: 'Savings', amount: 100000.75 }],
        liabilities: [{ name: 'Loan', amount: 50000.25 }],
      })

      const expectedNetWorth = 100000.75 - 50000.25
      expect(parseFloat(result.netWorth)).toBeCloseTo(expectedNetWorth, 1)
    })
  })

  describe('precision and formatting', () => {
    it('should return all string values with 2 decimal places', () => {
      const result = calculateNetWorth(netWorthInputs.basic)

      expect(result.totalAssets).toMatch(/^\d+\.\d{2}$/)
      expect(result.totalLiabilities).toMatch(/^\d+\.\d{2}$/)
      expect(result.netWorth).toMatch(/^-?\d+\.\d{2}$/)

      result.assetBreakdown.forEach((asset) => {
        expect(asset.amount).toMatch(/^\d+\.\d{2}$/)
        expect(asset.percentage).toMatch(/^\d+\.\d{2}$/)
      })
    })

    it('should handle large amounts', () => {
      const result = calculateNetWorth({
        assets: [{ name: 'Property', amount: 999999999.99 }],
        liabilities: [{ name: 'Mortgage', amount: 500000000.50 }],
      })

      expect(parseFloat(result.totalAssets)).toBeGreaterThan(0)
      expect(parseFloat(result.netWorth)).toBeGreaterThan(0)
    })
  })
})
