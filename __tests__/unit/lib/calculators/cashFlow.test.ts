import { calculateCashFlow } from '@/lib/calculators/cashFlow'
import { cashFlowInputs } from '../../../fixtures/calculators'

describe('calculateCashFlow', () => {
  describe('happy path', () => {
    it('should calculate cash flow with basic inputs', () => {
      const result = calculateCashFlow(cashFlowInputs.basic)

      expect(result).toHaveProperty('totalMonthlyIncome')
      expect(result).toHaveProperty('totalMonthlyExpenses')
      expect(result).toHaveProperty('monthlyNetCashFlow')
      expect(result).toHaveProperty('yearlyNetCashFlow')
      expect(result).toHaveProperty('savingsRate')
      expect(result).toHaveProperty('surplus')
      expect(result).toHaveProperty('deficit')
    })

    it('should aggregate income items correctly', () => {
      const result = calculateCashFlow(cashFlowInputs.basic)

      const expectedIncome = 100000 + 50000
      expect(parseFloat(result.totalMonthlyIncome)).toBe(expectedIncome)
    })

    it('should aggregate expense items correctly', () => {
      const result = calculateCashFlow(cashFlowInputs.basic)

      const expectedExpenses = 30000 + 15000 + 5000
      expect(parseFloat(result.totalMonthlyExpenses)).toBe(expectedExpenses)
    })
  })

  describe('surplus scenarios', () => {
    it('should calculate positive cash flow as surplus', () => {
      const result = calculateCashFlow(cashFlowInputs.surplus)

      expect(parseFloat(result.monthlyNetCashFlow)).toBeGreaterThan(0)
      expect(parseFloat(result.surplus)).toBeGreaterThan(0)
      expect(parseFloat(result.deficit)).toBe(0)
    })

    it('should calculate yearly net cash flow correctly', () => {
      const result = calculateCashFlow(cashFlowInputs.surplus)

      const expectedYearly = parseFloat(result.monthlyNetCashFlow) * 12
      expect(parseFloat(result.yearlyNetCashFlow)).toBe(expectedYearly)
    })

    it('should calculate savings rate as percentage', () => {
      const result = calculateCashFlow(cashFlowInputs.surplus)

      const income = parseFloat(result.totalMonthlyIncome)
      const netFlow = parseFloat(result.monthlyNetCashFlow)
      const expectedRate = (netFlow / income) * 100

      expect(parseFloat(result.savingsRate)).toBeCloseTo(expectedRate, 1)
    })
  })

  describe('deficit scenarios', () => {
    it('should calculate negative cash flow as deficit', () => {
      const result = calculateCashFlow(cashFlowInputs.deficit)

      expect(parseFloat(result.monthlyNetCashFlow)).toBeLessThan(0)
      expect(parseFloat(result.deficit)).toBeGreaterThan(0)
      expect(parseFloat(result.surplus)).toBe(0)
    })

    it('should calculate negative savings rate', () => {
      const result = calculateCashFlow(cashFlowInputs.deficit)

      expect(parseFloat(result.savingsRate)).toBeLessThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle zero income', () => {
      const result = calculateCashFlow({
        incomeItems: [],
        expenseItems: [{ name: 'Expense', amount: 10000 }],
      })

      expect(parseFloat(result.totalMonthlyIncome)).toBe(0)
      expect(parseFloat(result.monthlyNetCashFlow)).toBeLessThan(0)
    })

    it('should handle zero expenses', () => {
      const result = calculateCashFlow({
        incomeItems: [{ name: 'Income', amount: 100000 }],
        expenseItems: [],
      })

      expect(parseFloat(result.totalMonthlyExpenses)).toBe(0)
      expect(parseFloat(result.monthlyNetCashFlow)).toBe(100000)
    })

    it('should handle equal income and expenses', () => {
      const result = calculateCashFlow({
        incomeItems: [{ name: 'Salary', amount: 50000 }],
        expenseItems: [{ name: 'Expenses', amount: 50000 }],
      })

      expect(parseFloat(result.monthlyNetCashFlow)).toBe(0)
      expect(parseFloat(result.savingsRate)).toBe(0)
      expect(parseFloat(result.surplus)).toBe(0)
      expect(parseFloat(result.deficit)).toBe(0)
    })

    it('should handle multiple income sources', () => {
      const result = calculateCashFlow({
        incomeItems: [
          { name: 'Salary', amount: 100000 },
          { name: 'Bonus', amount: 50000 },
          { name: 'Investment Income', amount: 25000 },
        ],
        expenseItems: [{ name: 'Expenses', amount: 75000 }],
      })

      expect(parseFloat(result.totalMonthlyIncome)).toBe(175000)
    })

    it('should handle multiple expense categories', () => {
      const result = calculateCashFlow({
        incomeItems: [{ name: 'Salary', amount: 150000 }],
        expenseItems: [
          { name: 'Rent', amount: 50000 },
          { name: 'Food', amount: 20000 },
          { name: 'Utilities', amount: 10000 },
          { name: 'Insurance', amount: 5000 },
          { name: 'Transport', amount: 8000 },
        ],
      })

      expect(parseFloat(result.totalMonthlyExpenses)).toBe(93000)
    })

    it('should handle decimal amounts', () => {
      const result = calculateCashFlow({
        incomeItems: [{ name: 'Income', amount: 100000.75 }],
        expenseItems: [{ name: 'Expense', amount: 50000.25 }],
      })

      expect(parseFloat(result.monthlyNetCashFlow)).toBeCloseTo(50000.5, 1)
    })
  })

  describe('precision and formatting', () => {
    it('should return all values with 2 decimal places', () => {
      const result = calculateCashFlow(cashFlowInputs.basic)

      Object.values(result).forEach((value) => {
        expect(value).toMatch(/^\d+\.\d{2}$/)
      })
    })

    it('should handle large amounts correctly', () => {
      const result = calculateCashFlow({
        incomeItems: [{ name: 'Income', amount: 99999999.99 }],
        expenseItems: [{ name: 'Expense', amount: 50000000.50 }],
      })

      expect(parseFloat(result.monthlyNetCashFlow)).toBeGreaterThan(0)
    })
  })
})
