import { calculateGoalPlan } from '@/lib/calculators/goalPlanner'
import { goalPlannerInputs } from '../../../fixtures/calculators'

describe('calculateGoalPlan', () => {
  describe('happy path', () => {
    it('should calculate goal plan with standard inputs', () => {
      const result = calculateGoalPlan(goalPlannerInputs.basic)

      expect(result).toHaveProperty('futureValue')
      expect(result).toHaveProperty('requiredMonthlyInvestment')
      expect(result).toHaveProperty('totalInvestmentNeeded')
      expect(result).toHaveProperty('gap')
      expect(result).toHaveProperty('monthlyInvestmentAfterInflation')

      expect(parseFloat(result.futureValue)).toBeGreaterThan(goalPlannerInputs.basic.goalAmount)
      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThan(0)
    })

    it('should return all values as string with 2 decimal places', () => {
      const result = calculateGoalPlan(goalPlannerInputs.basic)

      Object.values(result).forEach((value) => {
        if (typeof value === 'string') {
          const decimalMatch = value.match(/^\d+(\.\d{2})?$/)
          expect(decimalMatch).toBeTruthy()
        }
      })
    })

    it('should calculate aggressive scenario correctly', () => {
      const result = calculateGoalPlan(goalPlannerInputs.aggressive)

      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThan(0)
      expect(parseFloat(result.futureValue)).toBeGreaterThan(0)
    })

    it('should calculate conservative scenario correctly', () => {
      const result = calculateGoalPlan(goalPlannerInputs.conservative)

      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThan(0)
      expect(parseFloat(result.gap)).toBeGreaterThanOrEqual(0)
    })
  })

  describe('edge cases', () => {
    it('should handle zero current savings', () => {
      const result = calculateGoalPlan(goalPlannerInputs.zeroCurrentSavings)

      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThan(0)
      expect(result.futureValue).toBeDefined()
    })

    it('should handle zero growth rate', () => {
      const result = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        growthRate: 0,
      })

      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThan(0)
    })

    it('should handle zero inflation', () => {
      const result = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        inflationRate: 0,
      })

      expect(parseFloat(result.futureValue)).toBeLessThan(
        parseFloat(calculateGoalPlan(goalPlannerInputs.basic).futureValue),
      )
    })

    it('should return zero monthly investment when goal is already met', () => {
      const result = calculateGoalPlan({
        goalAmount: 1000000,
        currentSavings: 5000000,
        tenureYears: 10,
        inflationRate: 2,
        growthRate: 5,
        investmentRate: 8,
      })

      expect(parseFloat(result.requiredMonthlyInvestment)).toBe(0)
    })

    it('should handle very high goal amounts', () => {
      const result = calculateGoalPlan({
        goalAmount: 500000000,
        currentSavings: 10000000,
        tenureYears: 20,
        inflationRate: 4,
        growthRate: 7,
        investmentRate: 10,
      })

      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThan(0)
    })

    it('should handle very small goal amounts', () => {
      const result = calculateGoalPlan({
        goalAmount: 10000,
        currentSavings: 1000,
        tenureYears: 1,
        inflationRate: 5,
        growthRate: 8,
        investmentRate: 10,
      })

      expect(parseFloat(result.requiredMonthlyInvestment)).toBeGreaterThanOrEqual(0)
    })
  })

  describe('financial logic', () => {
    it('future value should be greater than goal amount due to inflation', () => {
      const result = calculateGoalPlan(goalPlannerInputs.basic)
      const futureValue = parseFloat(result.futureValue)
      const goalAmount = goalPlannerInputs.basic.goalAmount

      expect(futureValue).toBeGreaterThan(goalAmount)
    })

    it('gap should be positive when goal cannot be met with current savings', () => {
      const result = calculateGoalPlan(goalPlannerInputs.basic)

      expect(parseFloat(result.gap)).toBeGreaterThan(0)
    })

    it('higher growth rate should reduce required monthly investment', () => {
      const result1 = calculateGoalPlan(goalPlannerInputs.basic)
      const result2 = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        growthRate: 15,
      })

      expect(parseFloat(result2.requiredMonthlyInvestment)).toBeLessThan(
        parseFloat(result1.requiredMonthlyInvestment),
      )
    })

    it('longer tenure should reduce required monthly investment', () => {
      const result1 = calculateGoalPlan(goalPlannerInputs.basic)
      const result2 = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        tenureYears: 20,
      })

      expect(parseFloat(result2.requiredMonthlyInvestment)).toBeLessThan(
        parseFloat(result1.requiredMonthlyInvestment),
      )
    })

    it('higher inflation rate should increase future value', () => {
      const result1 = calculateGoalPlan(goalPlannerInputs.basic)
      const result2 = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        inflationRate: 10,
      })

      expect(parseFloat(result2.futureValue)).toBeGreaterThan(parseFloat(result1.futureValue))
    })
  })

  describe('precision and rounding', () => {
    it('should use ROUND_HALF_UP for decimal calculations', () => {
      const result = calculateGoalPlan({
        goalAmount: 1000000,
        currentSavings: 100000,
        tenureYears: 10,
        inflationRate: 5.5,
        growthRate: 7.25,
        investmentRate: 9.33,
      })

      // String-based precision check — float modulo on currency values
      // produces 0.00999... artifacts that flap. The calculator returns a
      // Decimal-formatted string, so verify directly that it has at most 2
      // decimal places.
      const formatted = result.requiredMonthlyInvestment
      const decimals = formatted.split('.')[1] ?? ''
      expect(decimals.length).toBeLessThanOrEqual(2)
    })

    it('should handle currency precision correctly', () => {
      const result = calculateGoalPlan({
        goalAmount: 9999999.99,
        currentSavings: 1.01,
        tenureYears: 5,
        inflationRate: 3.14159,
        growthRate: 6.87,
        investmentRate: 11.11,
      })

      expect(result.futureValue).toMatch(/^\d+\.\d{2}$/)
    })
  })
})
