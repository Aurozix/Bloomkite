import { calculateInsuranceNeeds } from '@/lib/calculators/insuranceNeeds'
import { insuranceNeedsInputs } from '../../../fixtures/calculators'

describe('calculateInsuranceNeeds', () => {
  describe('happy path', () => {
    it('should calculate insurance needs with all input types', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      expect(result).toHaveProperty('requiredInsurance')
      expect(result).toHaveProperty('coverageMultiplier')
      expect(result).toHaveProperty('existingInsurance')
      expect(result).toHaveProperty('additionalCoverageNeeded')
      expect(result).toHaveProperty('riskProfile')
    })

    it('should return numeric string for insurance amounts', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      expect(result.requiredInsurance).toMatch(/^\d+\.\d{2}$/)
      expect(result.existingInsurance).toMatch(/^\d+\.\d{2}$/)
      expect(result.additionalCoverageNeeded).toMatch(/^\d+\.\d{2}$/)
    })
  })

  describe('multiplier matrix', () => {
    it('should apply 10x multiplier for STABLE + PREDICTABLE', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      expect(result.coverageMultiplier).toBe(10)
      expect(parseFloat(result.requiredInsurance)).toBe(
        insuranceNeedsInputs.stablePredictable.annualIncome * 10,
      )
    })

    it('should apply 15x multiplier for STABLE + UNPREDICTABLE', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'STABLE',
        incomePredictability: 'UNPREDICTABLE',
        existingInsurance: 0,
      })

      expect(result.coverageMultiplier).toBe(15)
      expect(parseFloat(result.requiredInsurance)).toBe(15000000)
    })

    it('should apply 10x multiplier for FLUCTUATING + PREDICTABLE', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'FLUCTUATING',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 0,
      })

      expect(result.coverageMultiplier).toBe(10)
      expect(parseFloat(result.requiredInsurance)).toBe(10000000)
    })

    it('should apply 15x multiplier for FLUCTUATING + UNPREDICTABLE', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.fluctuatingUnpredictable)

      expect(result.coverageMultiplier).toBe(15)
      expect(parseFloat(result.requiredInsurance)).toBe(
        insuranceNeedsInputs.fluctuatingUnpredictable.annualIncome * 15,
      )
    })
  })

  describe('risk profiles', () => {
    it('should assign Low risk for STABLE + PREDICTABLE', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      expect(result.riskProfile).toBe('Low')
    })

    it('should assign Medium risk for STABLE + UNPREDICTABLE', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'STABLE',
        incomePredictability: 'UNPREDICTABLE',
        existingInsurance: 0,
      })

      expect(result.riskProfile).toBe('Medium')
    })

    it('should assign Medium risk for FLUCTUATING + PREDICTABLE', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'FLUCTUATING',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 0,
      })

      expect(result.riskProfile).toBe('Medium')
    })

    it('should assign High risk for FLUCTUATING + UNPREDICTABLE', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.fluctuatingUnpredictable)

      expect(result.riskProfile).toBe('High')
    })
  })

  describe('coverage gap calculation', () => {
    it('should calculate gap when required > existing', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      const required = parseFloat(result.requiredInsurance)
      const existing = parseFloat(result.existingInsurance)
      const gap = parseFloat(result.additionalCoverageNeeded)

      expect(gap).toBe(required - existing)
      expect(gap).toBeGreaterThan(0)
    })

    it('should return zero gap when existing >= required', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 20000000,
      })

      expect(parseFloat(result.additionalCoverageNeeded)).toBe(0)
    })

    it('should handle case when existing exactly equals required', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 10000000,
      })

      expect(parseFloat(result.additionalCoverageNeeded)).toBe(0)
    })

    it('should return zero gap for partial but sufficient coverage', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 15000000,
      })

      expect(parseFloat(result.additionalCoverageNeeded)).toBe(0)
    })
  })

  describe('income levels', () => {
    it('should handle high income correctly', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.highIncome)

      expect(parseFloat(result.requiredInsurance)).toBeGreaterThan(0)
      expect(result.coverageMultiplier).toBe(10)
    })

    it('should handle low income correctly', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.lowIncome)

      expect(parseFloat(result.requiredInsurance)).toBeGreaterThan(0)
      expect(result.coverageMultiplier).toBe(15)
    })

    it('should scale correctly with different incomes', () => {
      const low = calculateInsuranceNeeds({
        annualIncome: 300000,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 0,
      })

      const high = calculateInsuranceNeeds({
        annualIncome: 3000000,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 0,
      })

      expect(parseFloat(high.requiredInsurance)).toBe(
        parseFloat(low.requiredInsurance) * 10,
      )
    })
  })

  describe('edge cases', () => {
    it('should handle zero income', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 0,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 100000,
      })

      expect(parseFloat(result.requiredInsurance)).toBe(0)
      expect(parseFloat(result.additionalCoverageNeeded)).toBe(0)
    })

    it('should handle zero existing insurance', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 0,
      })

      expect(parseFloat(result.additionalCoverageNeeded)).toBe(
        parseFloat(result.requiredInsurance),
      )
    })

    it('should handle decimal income amounts', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 1000000.75,
        incomeStability: 'STABLE',
        incomePredictability: 'PREDICTABLE',
        existingInsurance: 500000.25,
      })

      const required = parseFloat(result.requiredInsurance)
      expect(required).toBeCloseTo(1000000.75 * 10, 1)
    })

    it('should handle very large income amounts', () => {
      const result = calculateInsuranceNeeds({
        annualIncome: 500000000,
        incomeStability: 'FLUCTUATING',
        incomePredictability: 'UNPREDICTABLE',
        existingInsurance: 10000000000,
      })

      expect(parseFloat(result.requiredInsurance)).toBeGreaterThan(0)
      expect(parseFloat(result.additionalCoverageNeeded)).toBeLessThanOrEqual(0)
    })
  })

  describe('precision and formatting', () => {
    it('should maintain 2 decimal places for all currency values', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      expect(result.requiredInsurance).toMatch(/^\d+\.\d{2}$/)
      expect(result.existingInsurance).toMatch(/^\d+\.\d{2}$/)
      expect(result.additionalCoverageNeeded).toMatch(/^\d+\.\d{2}$/)
    })

    it('should return integer multiplier', () => {
      const result = calculateInsuranceNeeds(insuranceNeedsInputs.stablePredictable)

      expect(typeof result.coverageMultiplier).toBe('number')
      expect(Number.isInteger(result.coverageMultiplier)).toBe(true)
    })
  })
})
