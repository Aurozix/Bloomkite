import { solve } from '@/lib/calculators/consolidated'
import { calculateFutureValue } from '@/lib/calculators/futureValue'
import { calculateTargetValue } from '@/lib/calculators/targetValue'
import { calculateRequiredRate } from '@/lib/calculators/rateFinder'
import { calculateRequiredTenure } from '@/lib/calculators/tenureFinder'

describe('solve (consolidated)', () => {
  describe('parity with standalone calculators', () => {
    it('matches Future Value when PMT=0', () => {
      const fv = calculateFutureValue({
        presentValue: 100000,
        annualRate: 10,
        tenureYears: 10,
      })
      const result = solve({
        presentValue: 100000,
        monthlyInvestment: 0,
        annualRate: 10,
        tenureYears: 10,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      expect(result.computed).toBeCloseTo(parseFloat(fv.futureValue), 0)
    })

    it('matches Target Value (required SIP) when PV=0', () => {
      const tv = calculateTargetValue({
        targetAmount: 5000000,
        annualRate: 12,
        tenureYears: 15,
      })
      const result = solve({
        presentValue: 0,
        monthlyInvestment: 0,
        annualRate: 12,
        tenureYears: 15,
        targetValue: 5000000,
        solveFor: 'monthlyInvestment',
      })
      expect(result.computed).toBeCloseTo(parseFloat(tv.requiredMonthlyInvestment), 0)
    })

    it('matches Rate Finder when PMT=0', () => {
      const rf = calculateRequiredRate({
        presentValue: 100000,
        futureValue: 200000,
        tenureYears: 7,
      })
      const result = solve({
        presentValue: 100000,
        monthlyInvestment: 0,
        annualRate: 0,
        tenureYears: 7,
        targetValue: 200000,
        solveFor: 'annualRate',
      })
      expect(result.computed).toBeCloseTo(parseFloat(rf.requiredAnnualRate), 1)
    })

    it('matches Tenure Finder when PMT=0', () => {
      const tf = calculateRequiredTenure({
        presentValue: 100000,
        futureValue: 500000,
        annualRate: 10,
      })
      const result = solve({
        presentValue: 100000,
        monthlyInvestment: 0,
        annualRate: 10,
        tenureYears: 0,
        targetValue: 500000,
        solveFor: 'tenureYears',
      })
      expect(result.computed).toBeCloseTo(parseFloat(tf.requiredYears), 1)
    })
  })

  describe('combined PV + PMT (the new case)', () => {
    it('round-trips: solve FV, then solve PMT given that FV → original PMT', () => {
      const base = {
        presentValue: 100000,
        monthlyInvestment: 10000,
        annualRate: 12,
        tenureYears: 20,
        targetValue: 0,
      }
      const forward = solve({ ...base, solveFor: 'futureValue' })
      const reverse = solve({
        ...base,
        targetValue: forward.computed,
        solveFor: 'monthlyInvestment',
      })
      expect(reverse.computed).toBeCloseTo(base.monthlyInvestment, 0)
    })

    it('round-trips: solve FV, then solve rate given that FV → original rate', () => {
      const base = {
        presentValue: 50000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 15,
        targetValue: 0,
      }
      const forward = solve({ ...base, solveFor: 'futureValue' })
      const reverse = solve({
        ...base,
        targetValue: forward.computed,
        solveFor: 'annualRate',
      })
      expect(reverse.computed).toBeCloseTo(base.annualRate, 1)
    })

    it('round-trips: solve FV, then solve tenure given that FV → original tenure', () => {
      const base = {
        presentValue: 200000,
        monthlyInvestment: 8000,
        annualRate: 8,
        tenureYears: 25,
        targetValue: 0,
      }
      const forward = solve({ ...base, solveFor: 'futureValue' })
      const reverse = solve({
        ...base,
        targetValue: forward.computed,
        solveFor: 'tenureYears',
      })
      expect(reverse.computed).toBeCloseTo(base.tenureYears, 1)
    })
  })

  describe('step-up SIP', () => {
    it('a step-up SIP produces a larger FV than flat SIP, holding everything else equal', () => {
      const flat = solve({
        presentValue: 0,
        monthlyInvestment: 10000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        stepUpPercent: 0,
        solveFor: 'futureValue',
      })
      const stepped = solve({
        presentValue: 0,
        monthlyInvestment: 10000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        stepUpPercent: 10,
        solveFor: 'futureValue',
      })
      expect(stepped.computed).toBeGreaterThan(flat.computed)
    })
  })

  describe('inflation (real value reporting)', () => {
    it('real future value is below nominal when inflation > 0', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        inflationPercent: 6,
        solveFor: 'futureValue',
      })
      expect(r.realFutureValue).toBeLessThan(r.resolved.futureValue)
      // Sanity: (1.06)^20 ≈ 3.21 → real should be ~31% of nominal
      const ratio = r.realFutureValue / r.resolved.futureValue
      expect(ratio).toBeGreaterThan(0.30)
      expect(ratio).toBeLessThan(0.32)
    })

    it('does not affect the nominal calculation', () => {
      const noInfl = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      const withInfl = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        inflationPercent: 6,
        solveFor: 'futureValue',
      })
      expect(withInfl.computed).toBeCloseTo(noInfl.computed, 0)
    })
  })

  describe('edge cases', () => {
    it('zero rate produces linear contribution-only growth', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 0,
        tenureYears: 10,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      // 100000 + 5000 * 12 * 10 = 700000
      expect(r.computed).toBeCloseTo(700000, 0)
    })

    it('zero tenure returns the present value as FV', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 0,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      expect(r.computed).toBeCloseTo(100000, 0)
    })

    it('zero PMT and zero PV produces zero FV', () => {
      const r = solve({
        presentValue: 0,
        monthlyInvestment: 0,
        annualRate: 10,
        tenureYears: 10,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      expect(r.computed).toBe(0)
    })
  })

  describe('year-by-year projection', () => {
    it('emits N+1 points (year 0 through year N)', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 10,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      expect(r.yearly).toHaveLength(11)
      expect(r.yearly[0].year).toBe(0)
      expect(r.yearly[10].year).toBe(10)
    })

    it('year-0 balance equals the present value', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 10,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      expect(r.yearly[0].balance).toBeCloseTo(100000, 0)
      expect(r.yearly[0].contributions).toBeCloseTo(100000, 0)
    })

    it('final-year balance matches the computed FV', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 10,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      expect(r.yearly[10].balance).toBeCloseTo(r.computed, 0)
    })

    it('contributions grow with step-up SIP', () => {
      const r = solve({
        presentValue: 0,
        monthlyInvestment: 10000,
        annualRate: 10,
        tenureYears: 3,
        targetValue: 0,
        stepUpPercent: 10,
        solveFor: 'futureValue',
      })
      // Yr 1 contributions: 10000 * 12 = 120000
      // Yr 2 cumulative: 120000 + 11000*12 = 252000
      // Yr 3 cumulative: 252000 + 12100*12 = 397200
      expect(r.yearly[1].contributions).toBeCloseTo(120000, 0)
      expect(r.yearly[2].contributions).toBeCloseTo(252000, 0)
      expect(r.yearly[3].contributions).toBeCloseTo(397200, 0)
    })
  })

  describe('sensitivity', () => {
    it('reports a row per input (excluding the solved-for one)', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      // FV is solved; PV/PMT/rate/tenure are perturbed (4 rows).
      // targetValue is 0 here so it gets filtered out.
      expect(r.sensitivity).toHaveLength(4)
      const keys = r.sensitivity.map((s) => s.inputKey).sort()
      expect(keys).toEqual(['annualRate', 'monthlyInvestment', 'presentValue', 'tenureYears'])
    })

    it('low < baseline < high for monotonic FV solve', () => {
      const r = solve({
        presentValue: 100000,
        monthlyInvestment: 5000,
        annualRate: 10,
        tenureYears: 20,
        targetValue: 0,
        solveFor: 'futureValue',
      })
      for (const s of r.sensitivity) {
        expect(s.low).toBeLessThan(s.baseline)
        expect(s.high).toBeGreaterThan(s.baseline)
      }
    })
  })
})
