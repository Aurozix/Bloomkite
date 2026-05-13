import { calculateGoalPlan } from '@/lib/calculators/goalPlanner'
import { goalPlannerInputs } from '../../../fixtures/calculators'

describe('calculateGoalPlan', () => {
  describe('RAD canonical example (§1)', () => {
    // ₹50L goal, 10yr, 5% inflation, ₹10L current at 8%, 10% returns.
    // Per spec §1.3 step-by-step:
    //   futureCost = 5,000,000 × 1.05^10 ≈ 8,144,473
    //   futureValue = 1,000,000 × 1.08^10 ≈ 2,158,925
    //   finalCorpus = futureCost − futureValue ≈ 5,985,548
    //   monthlyInv = annuity-due inverse at r=10/12/100, n=120
    //              ≈ ₹28,972/mo (not the spec's ₹44,124.56 — that figure
    //              doesn't match any consistent reading of §1.3).
    const result = calculateGoalPlan(goalPlannerInputs.basic)

    it('returns futureCost ≈ ₹81.44L per spec §1.3 step 2', () => {
      expect(parseFloat(result.futureCost)).toBeCloseTo(8144473.21, 0)
    })

    it('returns futureValue ≈ ₹21.59L per spec §1.3 step 3', () => {
      expect(parseFloat(result.futureValue)).toBeCloseTo(2158924.99, 0)
    })

    it('returns finalCorpus = futureCost − futureValue', () => {
      const fc = parseFloat(result.futureCost)
      const fv = parseFloat(result.futureValue)
      expect(parseFloat(result.finalCorpus)).toBeCloseTo(fc - fv, 0)
    })

    it('returns monthlyInv from FV-of-annuity-due inverse at nominal monthly rate', () => {
      // The spec's quoted ₹44,124.56 is inconsistent with its own §1.3
      // formula. With the correct accumulation formula and §1.6's
      // month-start (annuity-due) convention, the value lands near ₹28,978.
      expect(parseFloat(result.monthlyInv)).toBeCloseTo(28978, -2)
    })

    it('returns annualInv = monthlyInv × 12', () => {
      const m = parseFloat(result.monthlyInv)
      expect(parseFloat(result.annualInv)).toBeCloseTo(m * 12, 0)
    })

    it('returns rateOfReturn as nominal monthly rate (annual / 12)', () => {
      // 10% annual → 0.00833 monthly per spec §1.3 step 5.
      expect(parseFloat(result.rateOfReturn)).toBeCloseTo(10 / 12 / 100, 5)
    })
  })

  describe('tenureType handling', () => {
    it('treats 120 months identically to 10 years', () => {
      const inYears = calculateGoalPlan(goalPlannerInputs.basic)
      const inMonths = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        tenure: 120,
        tenureType: 'MONTH',
      })
      expect(inMonths.futureCost).toBe(inYears.futureCost)
      expect(inMonths.futureValue).toBe(inYears.futureValue)
      expect(inMonths.monthlyInv).toBe(inYears.monthlyInv)
    })
  })

  describe('output shape & formatting', () => {
    it('returns all six spec-defined fields', () => {
      const r = calculateGoalPlan(goalPlannerInputs.basic)
      expect(r).toHaveProperty('futureCost')
      expect(r).toHaveProperty('futureValue')
      expect(r).toHaveProperty('finalCorpus')
      expect(r).toHaveProperty('monthlyInv')
      expect(r).toHaveProperty('annualInv')
      expect(r).toHaveProperty('rateOfReturn')
    })

    it('returns currency strings with exactly 2 decimal places', () => {
      const r = calculateGoalPlan(goalPlannerInputs.basic)
      expect(r.futureCost).toMatch(/^\d+\.\d{2}$/)
      expect(r.futureValue).toMatch(/^\d+\.\d{2}$/)
      expect(r.finalCorpus).toMatch(/^\d+\.\d{2}$/)
      expect(r.monthlyInv).toMatch(/^\d+\.\d{2}$/)
      expect(r.annualInv).toMatch(/^\d+\.\d{2}$/)
    })
  })

  describe('edge cases', () => {
    it('handles zero current savings', () => {
      const r = calculateGoalPlan(goalPlannerInputs.zeroCurrentSavings)
      expect(parseFloat(r.futureValue)).toBe(0)
      expect(parseFloat(r.finalCorpus)).toBeCloseTo(parseFloat(r.futureCost), 0)
      expect(parseFloat(r.monthlyInv)).toBeGreaterThan(0)
    })

    it('handles zero growth rate (current savings unchanged)', () => {
      const r = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        growthRate: 0,
      })
      expect(parseFloat(r.futureValue)).toBe(goalPlannerInputs.basic.currentAmount)
    })

    it('handles zero inflation (futureCost = goalAmount)', () => {
      const r = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        inflationRate: 0,
      })
      expect(parseFloat(r.futureCost)).toBe(goalPlannerInputs.basic.goalAmount)
    })

    it('handles zero investment rate (linear monthly accumulation)', () => {
      const r = calculateGoalPlan({
        goalAmount: 1200000,
        currentAmount: 0,
        tenure: 10,
        tenureType: 'YEAR',
        inflationRate: 0,
        growthRate: 0,
        annualInvestmentRate: 0,
      })
      // 12L / 120 months = ₹10,000/mo
      expect(parseFloat(r.monthlyInv)).toBeCloseTo(10000, 1)
      expect(parseFloat(r.rateOfReturn)).toBe(0)
    })

    it('returns zero monthly investment when goal is already met by current savings', () => {
      const r = calculateGoalPlan({
        goalAmount: 1000000,
        currentAmount: 5000000,
        tenure: 10,
        tenureType: 'YEAR',
        inflationRate: 2,
        growthRate: 5,
        annualInvestmentRate: 8,
      })
      expect(parseFloat(r.finalCorpus)).toBe(0)
      expect(parseFloat(r.monthlyInv)).toBe(0)
      expect(parseFloat(r.annualInv)).toBe(0)
    })
  })

  describe('financial sensitivity', () => {
    it('higher investment rate reduces required monthly investment', () => {
      const lower = calculateGoalPlan(goalPlannerInputs.basic)
      const higher = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        annualInvestmentRate: 15,
      })
      expect(parseFloat(higher.monthlyInv)).toBeLessThan(parseFloat(lower.monthlyInv))
    })

    it('longer tenure reduces required monthly investment', () => {
      const shorter = calculateGoalPlan(goalPlannerInputs.basic)
      const longer = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        tenure: 20,
      })
      expect(parseFloat(longer.monthlyInv)).toBeLessThan(parseFloat(shorter.monthlyInv))
    })

    it('higher inflation rate increases futureCost', () => {
      const lower = calculateGoalPlan(goalPlannerInputs.basic)
      const higher = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        inflationRate: 10,
      })
      expect(parseFloat(higher.futureCost)).toBeGreaterThan(parseFloat(lower.futureCost))
    })

    it('higher growth on current savings reduces finalCorpus', () => {
      const lower = calculateGoalPlan(goalPlannerInputs.basic)
      const higher = calculateGoalPlan({
        ...goalPlannerInputs.basic,
        growthRate: 15,
      })
      expect(parseFloat(higher.finalCorpus)).toBeLessThan(parseFloat(lower.finalCorpus))
    })
  })
})
