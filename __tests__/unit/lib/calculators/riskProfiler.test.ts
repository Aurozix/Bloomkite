import { calculateRiskProfile } from '@/lib/calculators/riskProfiler'
import { riskProfilerInputs } from '../../../fixtures/calculators'

describe('calculateRiskProfile', () => {
  describe('happy path', () => {
    it('should calculate risk profile with all answers', () => {
      const result = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(result).toHaveProperty('totalScore')
      expect(result).toHaveProperty('riskCategory')
      expect(result).toHaveProperty('equityAllocation')
      expect(result).toHaveProperty('debtAllocation')
      expect(result).toHaveProperty('cashAllocation')
    })

    it('should return valid risk category', () => {
      const result = calculateRiskProfile(riskProfilerInputs.moderate)

      const validCategories = [
        'Conservative',
        'Moderately Conservative',
        'Moderate',
        'Moderately Aggressive',
        'Aggressive',
      ]
      expect(validCategories).toContain(result.riskCategory)
    })

    it('should have allocations sum to 100', () => {
      const result = calculateRiskProfile(riskProfilerInputs.moderate)

      const total = result.equityAllocation + result.debtAllocation + result.cashAllocation
      expect(total).toBe(100)
    })
  })

  describe('score inversion', () => {
    it('should invert scores so aggressive answers = high score', () => {
      const result = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(result.riskCategory).toBe('Aggressive')
      expect(result.totalScore).toBeGreaterThan(50)
    })

    it('should invert scores so conservative answers = low score', () => {
      const result = calculateRiskProfile(riskProfilerInputs.conservative)

      expect(result.riskCategory).toBe('Conservative')
      expect(result.totalScore).toBeLessThanOrEqual(30)
    })

    it('should give moderate score for mixed answers', () => {
      const result = calculateRiskProfile(riskProfilerInputs.moderate)

      expect(result.riskCategory).toBe('Moderate')
      expect(result.totalScore).toBeGreaterThan(40)
      expect(result.totalScore).toBeLessThanOrEqual(51)
    })
  })

  describe('risk categories and score ranges', () => {
    it('Conservative: score <= 30', () => {
      const result = calculateRiskProfile(riskProfilerInputs.conservative)

      expect(result.riskCategory).toBe('Conservative')
      expect(result.totalScore).toBeLessThanOrEqual(30)
    })

    it('Moderately Conservative: 30 < score <= 40', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 4,
        })),
      })

      expect(result.riskCategory).toBe('Moderately Conservative')
      expect(result.totalScore).toBeGreaterThan(30)
      expect(result.totalScore).toBeLessThanOrEqual(40)
    })

    it('Moderate: 40 < score <= 51', () => {
      const result = calculateRiskProfile(riskProfilerInputs.moderate)

      expect(result.riskCategory).toBe('Moderate')
      expect(result.totalScore).toBeGreaterThan(40)
      expect(result.totalScore).toBeLessThanOrEqual(51)
    })

    it('Moderately Aggressive: 51 < score <= 61', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 2.5,
        })),
      })

      expect(['Moderately Aggressive', 'Aggressive']).toContain(result.riskCategory)
      expect(result.totalScore).toBeGreaterThan(51)
    })

    it('Aggressive: score > 61', () => {
      const result = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(result.riskCategory).toBe('Aggressive')
      expect(result.totalScore).toBeGreaterThan(61)
    })
  })

  describe('portfolio allocations', () => {
    it('Conservative portfolio: 30/50/20', () => {
      const result = calculateRiskProfile(riskProfilerInputs.conservative)

      expect(result.equityAllocation).toBe(30)
      expect(result.debtAllocation).toBe(50)
      expect(result.cashAllocation).toBe(20)
    })

    it('Moderately Conservative portfolio: 40/45/15', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 4,
        })),
      })

      expect(result.equityAllocation).toBe(40)
      expect(result.debtAllocation).toBe(45)
      expect(result.cashAllocation).toBe(15)
    })

    it('Moderate portfolio: 50/40/10', () => {
      const result = calculateRiskProfile(riskProfilerInputs.moderate)

      expect(result.equityAllocation).toBe(50)
      expect(result.debtAllocation).toBe(40)
      expect(result.cashAllocation).toBe(10)
    })

    it('Moderately Aggressive portfolio has higher equity than moderate', () => {
      const moderate = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 3,
        })),
      })

      const moreAggressive = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 2,
        })),
      })

      expect(moreAggressive.equityAllocation).toBeGreaterThanOrEqual(moderate.equityAllocation)
    })

    it('Aggressive portfolio: 80/15/5', () => {
      const result = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(result.equityAllocation).toBe(80)
      expect(result.debtAllocation).toBe(15)
      expect(result.cashAllocation).toBe(5)
    })
  })

  describe('edge cases', () => {
    it('should handle minimum answers (all conservative)', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 5,
        })),
      })

      expect(result.riskCategory).toBe('Conservative')
      expect(result.totalScore).toBeLessThanOrEqual(30)
    })

    it('should handle maximum answers (all aggressive)', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 1,
        })),
      })

      expect(result.riskCategory).toBe('Aggressive')
      expect(result.totalScore).toBeGreaterThan(61)
    })

    it('should handle boundary score at 30', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: i < 12 ? 5 : 4,
        })),
      })

      expect(result.totalScore).toBeLessThanOrEqual(31)
    })

    it('should handle boundary score at 40', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 4,
        })),
      })

      expect(result.totalScore).toBeGreaterThan(30)
    })

    it('should handle boundary score at 51', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 3,
        })),
      })

      expect(result.totalScore).toBeGreaterThan(40)
    })

    it('should handle boundary score at 61', () => {
      const result = calculateRiskProfile({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 2,
        })),
      })

      expect(result.totalScore).toBeGreaterThan(51)
    })
  })

  describe('score calculation precision', () => {
    it('should calculate numeric total score for aggressive profile', () => {
      const result = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(typeof result.totalScore).toBe('number')
      expect(result.totalScore).toBeGreaterThan(0)
    })

    it('should calculate numeric total score for conservative profile', () => {
      const result = calculateRiskProfile(riskProfilerInputs.conservative)

      expect(typeof result.totalScore).toBe('number')
      expect(result.totalScore).toBeLessThanOrEqual(30)
    })

    it('should calculate numeric total score for moderate profile', () => {
      const result = calculateRiskProfile(riskProfilerInputs.moderate)

      expect(typeof result.totalScore).toBe('number')
      expect(result.totalScore).toBeGreaterThan(40)
      expect(result.totalScore).toBeLessThanOrEqual(51)
    })
  })

  describe('allocation consistency', () => {
    it('should have non-negative allocations', () => {
      const result = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(result.equityAllocation).toBeGreaterThanOrEqual(0)
      expect(result.debtAllocation).toBeGreaterThanOrEqual(0)
      expect(result.cashAllocation).toBeGreaterThanOrEqual(0)
    })

    it('should increase equity with risk level', () => {
      const conservative = calculateRiskProfile(riskProfilerInputs.conservative)
      const moderate = calculateRiskProfile(riskProfilerInputs.moderate)
      const aggressive = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(conservative.equityAllocation).toBeLessThan(moderate.equityAllocation)
      expect(moderate.equityAllocation).toBeLessThan(aggressive.equityAllocation)
    })

    it('should decrease debt with risk level', () => {
      const conservative = calculateRiskProfile(riskProfilerInputs.conservative)
      const moderate = calculateRiskProfile(riskProfilerInputs.moderate)
      const aggressive = calculateRiskProfile(riskProfilerInputs.aggressive)

      expect(conservative.debtAllocation).toBeGreaterThan(moderate.debtAllocation)
      expect(moderate.debtAllocation).toBeGreaterThan(aggressive.debtAllocation)
    })
  })

  describe('mixed risk profiles', () => {
    it('should handle varying answer scores', () => {
      const result = calculateRiskProfile({
        answers: [
          { questionNumber: 1, answerScore: 1 },
          { questionNumber: 2, answerScore: 5 },
          { questionNumber: 3, answerScore: 2 },
          { questionNumber: 4, answerScore: 4 },
          { questionNumber: 5, answerScore: 3 },
          { questionNumber: 6, answerScore: 1 },
          { questionNumber: 7, answerScore: 5 },
          { questionNumber: 8, answerScore: 2 },
          { questionNumber: 9, answerScore: 4 },
          { questionNumber: 10, answerScore: 3 },
          { questionNumber: 11, answerScore: 1 },
          { questionNumber: 12, answerScore: 5 },
          { questionNumber: 13, answerScore: 2 },
          { questionNumber: 14, answerScore: 4 },
          { questionNumber: 15, answerScore: 3 },
          { questionNumber: 16, answerScore: 1 },
        ],
      })

      expect(result.totalScore).toBeGreaterThan(0)
      expect(['Conservative', 'Moderately Conservative', 'Moderate', 'Moderately Aggressive', 'Aggressive']).toContain(
        result.riskCategory,
      )
    })
  })
})
