import { calculateEmiChange } from '@/lib/calculators/emiChange'
import { calculateEmi } from '@/lib/calculators/emi'

describe('calculateEmiChange', () => {
  describe('RAD canonical scenario (§14.1)', () => {
    // ₹30L at 8% for 20 years starting Jan-2024.
    // Original EMI ≈ ₹25,093.10 (not ₹27,748 as quoted in spec §14.1; that
    // value is internally inconsistent with the EMI formula, same as §11.5.)
    // At Jun-2029 (month-index 65), EMI bumps from ~25,093 to ₹35,000.
    const result = calculateEmiChange({
      loanAmount: 3000000,
      interestRate: 8,
      tenure: 20,
      tenureType: 'YEAR',
      loanDate: 'Jan-2024',
      emiChangeReq: [{ emiChangedDate: 'Jun-2029', newEmi: 35000 }],
    })

    it('reports the correct original EMI from the underlying loan', () => {
      const original = calculateEmi({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
      })
      expect(result.originalEmi).toBe(original.emi)
    })

    it('records the new EMI as the final EMI in effect', () => {
      expect(parseFloat(result.finalEmi)).toBeCloseTo(35000, 2)
    })

    it('shortens tenure relative to the original 240 months', () => {
      expect(result.originalTenureMonths).toBe(240)
      expect(result.revisedTenureMonths).toBeLessThan(240)
      expect(result.tenureReductionMonths).toBe(240 - result.revisedTenureMonths)
    })

    it('saves interest vs. the original loan', () => {
      expect(parseFloat(result.interestSaved)).toBeGreaterThan(0)
      expect(parseFloat(result.totalInterestNow)).toBeLessThan(
        parseFloat(result.originalTotalInterest),
      )
    })

    it('rows before Jun-2029 use the original EMI', () => {
      const before = result.newAmortisation.find((r) => r.date === 'Jan-2024')
      expect(before).toBeDefined()
      expect(parseFloat(before!.emiUsed)).toBeCloseTo(parseFloat(result.originalEmi), 2)
    })

    it('rows from Jun-2029 onward use the new EMI', () => {
      const switchRow = result.newAmortisation.find((r) => r.date === 'Jun-2029')
      expect(switchRow).toBeDefined()
      expect(parseFloat(switchRow!.emiUsed)).toBeCloseTo(35000, 2)
      // And the row right after
      const idx = result.newAmortisation.indexOf(switchRow!)
      if (idx + 1 < result.newAmortisation.length) {
        expect(parseFloat(result.newAmortisation[idx + 1].emiUsed)).toBeCloseTo(35000, 2)
      }
    })

    it('terminates at exactly zero closing balance', () => {
      const last = result.newAmortisation[result.newAmortisation.length - 1]
      expect(parseFloat(last.closingBalance)).toBe(0)
      expect(parseFloat(last.loanPaid)).toBeCloseTo(100, 1)
    })

    it('does not mark the run as diverged', () => {
      expect(result.diverged).toBe(false)
    })
  })

  describe('schedule invariants', () => {
    const result = calculateEmiChange({
      loanAmount: 3000000,
      interestRate: 8,
      tenure: 20,
      tenureType: 'YEAR',
      loanDate: 'Jan-2024',
      emiChangeReq: [{ emiChangedDate: 'Jun-2029', newEmi: 35000 }],
    })

    it('opening[n] equals closing[n-1] for every adjacent pair', () => {
      for (let i = 1; i < result.newAmortisation.length; i++) {
        const prev = parseFloat(result.newAmortisation[i - 1].closingBalance)
        const curr = parseFloat(result.newAmortisation[i].openingBalance)
        expect(curr).toBeCloseTo(prev, 1)
      }
    })

    it('totalPaid on the final row equals principal + revised total interest', () => {
      const last = result.newAmortisation[result.newAmortisation.length - 1]
      const expected = 3000000 + parseFloat(result.totalInterestNow)
      expect(parseFloat(last.totalPaid)).toBeCloseTo(expected, 0)
    })

    it('interest portion is non-negative everywhere', () => {
      for (const row of result.newAmortisation) {
        expect(parseFloat(row.interest)).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('no-change baseline', () => {
    it('matches the EMI calculator exactly when emiChangeReq is empty', () => {
      const result = calculateEmiChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [],
      })
      const original = calculateEmi({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        startDate: 'Jan-2024',
      })
      expect(result.revisedTenureMonths).toBe(240)
      expect(result.tenureReductionMonths).toBe(0)
      expect(parseFloat(result.interestSaved)).toBe(0)
      expect(parseFloat(result.totalInterestNow)).toBeCloseTo(
        parseFloat(original.interestPayable),
        0,
      )
    })
  })

  describe('multiple sequential changes', () => {
    it('applies later changes after earlier ones', () => {
      const result = calculateEmiChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [
          { emiChangedDate: 'Jan-2026', newEmi: 30000 },
          { emiChangedDate: 'Jan-2028', newEmi: 40000 },
        ],
      })
      const jan2026 = result.newAmortisation.find((r) => r.date === 'Jan-2026')
      const jan2028 = result.newAmortisation.find((r) => r.date === 'Jan-2028')
      const dec2027 = result.newAmortisation.find((r) => r.date === 'Dec-2027')
      expect(parseFloat(jan2026!.emiUsed)).toBeCloseTo(30000, 2)
      expect(parseFloat(dec2027!.emiUsed)).toBeCloseTo(30000, 2)
      expect(parseFloat(jan2028!.emiUsed)).toBeCloseTo(40000, 2)
      expect(parseFloat(result.finalEmi)).toBeCloseTo(40000, 2)
    })

    it('shortens tenure more aggressively with two ramps than one', () => {
      const single = calculateEmiChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Jan-2026', newEmi: 30000 }],
      })
      const double = calculateEmiChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [
          { emiChangedDate: 'Jan-2026', newEmi: 30000 },
          { emiChangedDate: 'Jan-2028', newEmi: 40000 },
        ],
      })
      expect(double.revisedTenureMonths).toBeLessThan(single.revisedTenureMonths)
    })
  })

  describe('divergence handling (EMI below interest accrual)', () => {
    it('flags the run as diverged when new EMI is below monthly interest', () => {
      // At 12% on ₹10L the monthly interest alone is ₹10,000. Dropping the EMI
      // to ₹5,000 means the principal would grow forever.
      const result = calculateEmiChange({
        loanAmount: 1000000,
        interestRate: 12,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Jan-2025', newEmi: 5000 }],
      })
      expect(result.diverged).toBe(true)
      expect(result.tenureReductionMonths).toBe(0)
      expect(parseFloat(result.interestSaved)).toBe(0)
    })

    it('does not flag divergence for a healthy EMI bump', () => {
      const result = calculateEmiChange({
        loanAmount: 1000000,
        interestRate: 12,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Jan-2025', newEmi: 20000 }],
      })
      expect(result.diverged).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('ignores EMI changes dated before the loan start', () => {
      const result = calculateEmiChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Jan-2020', newEmi: 30000 }],
      })
      expect(result.tenureReductionMonths).toBe(0)
      expect(result.revisedTenureMonths).toBe(120)
    })

    it('ignores changes with non-positive EMI', () => {
      const result = calculateEmiChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [
          { emiChangedDate: 'Jan-2026', newEmi: 0 },
          { emiChangedDate: 'Jan-2027', newEmi: -5000 },
        ],
      })
      expect(result.tenureReductionMonths).toBe(0)
    })

    it('handles a change at the very first month', () => {
      const result = calculateEmiChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Jan-2024', newEmi: 30000 }],
      })
      expect(parseFloat(result.newAmortisation[0].emiUsed)).toBeCloseTo(30000, 2)
      expect(result.diverged).toBe(false)
      expect(result.revisedTenureMonths).toBeLessThan(120)
    })

    it('handles zero-rate loans with mid-stream EMI bumps', () => {
      const result = calculateEmiChange({
        loanAmount: 120000,
        interestRate: 0,
        tenure: 12,
        tenureType: 'MONTH',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Mar-2024', newEmi: 20000 }],
      })
      // EMI 10,000 for 2 months (paid 20k), then 20,000 for 5 months (100k)
      // → loan closes in 7 months.
      expect(parseFloat(result.originalEmi)).toBeCloseTo(10000, 2)
      expect(result.revisedTenureMonths).toBeLessThan(12)
      expect(parseFloat(result.totalInterestNow)).toBe(0)
      expect(parseFloat(result.interestSaved)).toBe(0)
    })

    it('returns empty schedule for zero principal', () => {
      const result = calculateEmiChange({
        loanAmount: 0,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        emiChangeReq: [{ emiChangedDate: 'Jun-2029', newEmi: 35000 }],
      })
      expect(result.newAmortisation).toEqual([])
    })

    it('falls back gracefully when loanDate is missing/malformed', () => {
      const result = calculateEmiChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        emiChangeReq: [{ emiChangedDate: 'Jun-2029', newEmi: 30000 }],
      })
      // Can't align without a parseable loanDate → no EMI change is applied,
      // schedule runs the full original tenure.
      expect(result.revisedTenureMonths).toBe(120)
      expect(result.tenureReductionMonths).toBe(0)
    })
  })

  describe('output formatting', () => {
    it('returns currency strings with exactly 2 decimal places', () => {
      const result = calculateEmiChange({
        loanAmount: 1234567,
        interestRate: 7.5,
        tenure: 15,
        tenureType: 'YEAR',
        loanDate: 'Mar-2024',
        emiChangeReq: [{ emiChangedDate: 'Jul-2027', newEmi: 25000 }],
      })
      expect(result.originalEmi).toMatch(/^\d+\.\d{2}$/)
      expect(result.finalEmi).toMatch(/^\d+\.\d{2}$/)
      expect(result.interestSaved).toMatch(/^\d+\.\d{2}$/)
      expect(result.totalInterestNow).toMatch(/^\d+\.\d{2}$/)
      expect(result.newAmortisation[0].emiUsed).toMatch(/^\d+\.\d{2}$/)
    })
  })
})
