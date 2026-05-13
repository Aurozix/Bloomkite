import { calculateRateChange } from '@/lib/calculators/rateChange'
import { calculateEmi } from '@/lib/calculators/emi'

describe('calculateRateChange', () => {
  describe('RAD canonical scenario (§15.1): 30L/8% → 7% at Jun-2029', () => {
    const result = calculateRateChange({
      loanAmount: 3000000,
      interestRate: 8,
      tenure: 20,
      tenureType: 'YEAR',
      loanDate: 'Jan-2024',
      interestChangeReq: [{ interestChangedDate: 'Jun-2029', changedRate: 7 }],
    })

    it('reports the correct original EMI for 30L/8%/20yr', () => {
      const original = calculateEmi({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
      })
      expect(result.originalEmi).toBe(original.emi)
      expect(result.originalTenureMonths).toBe(240)
    })

    describe('Approach A (EMI fixed, tenure shortens for rate cut)', () => {
      it('uses the original EMI throughout the schedule', () => {
        const a = result.approachA
        expect(a.finalEmi).toBe(result.originalEmi)
        expect(parseFloat(a.emiChange)).toBe(0)
      })

      it('shortens tenure relative to the original 240 months', () => {
        const a = result.approachA
        expect(a.revisedTenureMonths).toBeLessThan(240)
        expect(a.tenureChangeMonths).toBe(240 - a.revisedTenureMonths)
      })

      it('saves interest vs. the original loan', () => {
        const a = result.approachA
        expect(parseFloat(a.interestSaved)).toBeGreaterThan(0)
        expect(parseFloat(a.totalInterest)).toBeLessThan(
          parseFloat(result.originalTotalInterest),
        )
      })

      it('terminates at exactly zero closing balance', () => {
        const a = result.approachA
        const last = a.newAmortisation[a.newAmortisation.length - 1]
        expect(parseFloat(last.closingBalance)).toBe(0)
      })

      it('switches the row-rate at Jun-2029', () => {
        const a = result.approachA
        const switchRow = a.newAmortisation.find((r) => r.date === 'Jun-2029')
        const before = a.newAmortisation.find((r) => r.date === 'May-2029')
        expect(parseFloat(before!.rateUsed)).toBeCloseTo(8, 2)
        expect(parseFloat(switchRow!.rateUsed)).toBeCloseTo(7, 2)
      })

      it('is not flagged as diverged for a healthy rate cut', () => {
        expect(result.approachA.diverged).toBe(false)
      })
    })

    describe('Approach B (tenure fixed, EMI drops for rate cut)', () => {
      it('keeps tenure at exactly the original 240 months', () => {
        const b = result.approachB
        expect(b.revisedTenureMonths).toBe(240)
        expect(b.tenureChangeMonths).toBe(0)
      })

      it('drops the EMI from the rate change month onward', () => {
        const b = result.approachB
        const before = b.newAmortisation.find((r) => r.date === 'May-2029')
        const after = b.newAmortisation.find((r) => r.date === 'Jun-2029')
        expect(parseFloat(after!.emiUsed)).toBeLessThan(parseFloat(before!.emiUsed))
        expect(parseFloat(b.finalEmi)).toBeLessThan(parseFloat(result.originalEmi))
        expect(parseFloat(b.emiChange)).toBeLessThan(0)
      })

      it('saves interest vs. the original loan', () => {
        const b = result.approachB
        expect(parseFloat(b.interestSaved)).toBeGreaterThan(0)
      })

      it('terminates at exactly zero closing balance on the last row', () => {
        const b = result.approachB
        const last = b.newAmortisation[239]
        expect(parseFloat(last.closingBalance)).toBe(0)
      })
    })

    it('Approach A and B save similar total interest for the same scenario', () => {
      // The total interest paid under the two approaches should be close but
      // not identical (different schedules). The savings should be in the
      // same ballpark.
      const a = parseFloat(result.approachA.interestSaved)
      const b = parseFloat(result.approachB.interestSaved)
      expect(a).toBeGreaterThan(0)
      expect(b).toBeGreaterThan(0)
      // The two approaches diverge meaningfully — A saves time AND interest,
      // B only saves interest — so we just sanity-check they're within 50%
      // of each other (catches a sign flip or unit error, not a precise
      // financial equivalence).
      expect(Math.abs(a - b) / Math.max(a, b)).toBeLessThan(0.5)
    })
  })

  describe('no-change baseline', () => {
    it('matches the EMI calculator exactly when interestChangeReq is empty (both approaches)', () => {
      const result = calculateRateChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [],
      })
      const original = calculateEmi({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        startDate: 'Jan-2024',
      })
      // Approach A
      expect(result.approachA.revisedTenureMonths).toBe(240)
      expect(parseFloat(result.approachA.interestSaved)).toBe(0)
      expect(parseFloat(result.approachA.totalInterest)).toBeCloseTo(
        parseFloat(original.interestPayable),
        0,
      )
      // Approach B
      expect(result.approachB.revisedTenureMonths).toBe(240)
      expect(parseFloat(result.approachB.interestSaved)).toBe(0)
      expect(result.approachB.finalEmi).toBe(result.originalEmi)
    })
  })

  describe('rate hike (8% → 9.5%)', () => {
    const result = calculateRateChange({
      loanAmount: 3000000,
      interestRate: 8,
      tenure: 20,
      tenureType: 'YEAR',
      loanDate: 'Jan-2024',
      interestChangeReq: [{ interestChangedDate: 'Jun-2029', changedRate: 9.5 }],
    })

    it('Approach A extends tenure beyond the original', () => {
      expect(result.approachA.revisedTenureMonths).toBeGreaterThan(240)
      // tenureChange is computed as original − revised so a hike yields a
      // negative value (or zero, since we clamp on divergence).
      expect(result.approachA.tenureChangeMonths).toBeLessThanOrEqual(0)
    })

    it('Approach A reports zero interest saved (or negative clamped)', () => {
      // Hike means MORE interest, not less. The lib clamps negative savings
      // to zero so the UI doesn't show a misleading "saved" number.
      expect(parseFloat(result.approachA.interestSaved)).toBe(0)
    })

    it('Approach B raises the EMI from the change date onward', () => {
      const b = result.approachB
      const before = b.newAmortisation.find((r) => r.date === 'May-2029')
      const after = b.newAmortisation.find((r) => r.date === 'Jun-2029')
      expect(parseFloat(after!.emiUsed)).toBeGreaterThan(parseFloat(before!.emiUsed))
      expect(parseFloat(b.emiChange)).toBeGreaterThan(0)
    })

    it('Approach B keeps tenure at the original 240 months', () => {
      expect(result.approachB.revisedTenureMonths).toBe(240)
    })
  })

  describe('divergence (Approach A only, extreme rate hike)', () => {
    it('flags Approach A diverged when the new rate pushes monthly interest above the EMI', () => {
      // Original EMI ≈ ₹25,093. At a 30% annual rate the monthly interest
      // on ₹30L is ₹75,000 — far above the EMI → can never amortize.
      const result = calculateRateChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [{ interestChangedDate: 'Feb-2024', changedRate: 30 }],
      })
      expect(result.approachA.diverged).toBe(true)
      expect(parseFloat(result.approachA.interestSaved)).toBe(0)
    })

    it('does not flag Approach B as diverged in the same scenario', () => {
      const result = calculateRateChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [{ interestChangedDate: 'Feb-2024', changedRate: 30 }],
      })
      // Approach B simply recomputes a (much higher) EMI; no divergence.
      expect(result.approachB.diverged).toBe(false)
      expect(parseFloat(result.approachB.finalEmi)).toBeGreaterThan(
        parseFloat(result.originalEmi) * 2,
      )
    })
  })

  describe('multiple rate changes', () => {
    it('applies changes in date order (Approach A)', () => {
      const result = calculateRateChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [
          { interestChangedDate: 'Jan-2027', changedRate: 7.5 },
          { interestChangedDate: 'Jan-2030', changedRate: 7 },
        ],
      })
      const a = result.approachA
      const jan2027 = a.newAmortisation.find((r) => r.date === 'Jan-2027')
      const dec2029 = a.newAmortisation.find((r) => r.date === 'Dec-2029')
      const jan2030 = a.newAmortisation.find((r) => r.date === 'Jan-2030')
      expect(parseFloat(jan2027!.rateUsed)).toBeCloseTo(7.5, 2)
      expect(parseFloat(dec2029!.rateUsed)).toBeCloseTo(7.5, 2)
      expect(parseFloat(jan2030!.rateUsed)).toBeCloseTo(7, 2)
    })

    it('recomputes EMI on each rate change (Approach B)', () => {
      const result = calculateRateChange({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [
          { interestChangedDate: 'Jan-2027', changedRate: 7.5 },
          { interestChangedDate: 'Jan-2030', changedRate: 7 },
        ],
      })
      const b = result.approachB
      const before = b.newAmortisation[0]
      const jan2027 = b.newAmortisation.find((r) => r.date === 'Jan-2027')
      const jan2030 = b.newAmortisation.find((r) => r.date === 'Jan-2030')
      const before1 = parseFloat(before.emiUsed)
      const after1 = parseFloat(jan2027!.emiUsed)
      const after2 = parseFloat(jan2030!.emiUsed)
      expect(after1).toBeLessThan(before1)
      expect(after2).toBeLessThan(after1)
      expect(b.revisedTenureMonths).toBe(240)
    })
  })

  describe('edge cases', () => {
    it('ignores changes dated before the loan start', () => {
      const result = calculateRateChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [{ interestChangedDate: 'Jan-2020', changedRate: 8 }],
      })
      expect(result.approachA.revisedTenureMonths).toBe(120)
      expect(result.approachA.tenureChangeMonths).toBe(0)
    })

    it('handles a change at the very first month (Approach B treats as new loan at new rate)', () => {
      const result = calculateRateChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [{ interestChangedDate: 'Jan-2024', changedRate: 8 }],
      })
      // Approach B at month 0 with rate 8% → EMI should match a fresh 8% loan
      const fresh = calculateEmi({
        loanAmount: 1000000,
        interestRate: 8,
        tenure: 10,
        tenureType: 'YEAR',
      })
      expect(parseFloat(result.approachB.finalEmi)).toBeCloseTo(parseFloat(fresh.emi), 1)
    })

    it('returns empty schedules for zero principal', () => {
      const result = calculateRateChange({
        loanAmount: 0,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        interestChangeReq: [{ interestChangedDate: 'Jun-2029', changedRate: 7 }],
      })
      expect(result.approachA.newAmortisation).toEqual([])
      expect(result.approachB.newAmortisation).toEqual([])
    })

    it('handles zero rate → zero rate (no change, no interest)', () => {
      const result = calculateRateChange({
        loanAmount: 120000,
        interestRate: 0,
        tenure: 12,
        tenureType: 'MONTH',
        loanDate: 'Jan-2024',
        interestChangeReq: [{ interestChangedDate: 'Mar-2024', changedRate: 0 }],
      })
      expect(parseFloat(result.approachA.totalInterest)).toBe(0)
      expect(parseFloat(result.approachB.totalInterest)).toBe(0)
    })

    it('falls back gracefully when loanDate is missing/malformed', () => {
      const result = calculateRateChange({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        interestChangeReq: [{ interestChangedDate: 'Jun-2029', changedRate: 7 }],
      })
      // Without a parseable loanDate, no rate change is aligned → both
      // approaches produce the baseline.
      expect(result.approachA.revisedTenureMonths).toBe(120)
      expect(result.approachA.tenureChangeMonths).toBe(0)
      expect(result.approachB.revisedTenureMonths).toBe(120)
      expect(parseFloat(result.approachB.emiChange)).toBe(0)
    })
  })

  describe('output formatting', () => {
    it('returns currency/percentage strings with exactly 2 decimal places', () => {
      const result = calculateRateChange({
        loanAmount: 1234567,
        interestRate: 7.5,
        tenure: 15,
        tenureType: 'YEAR',
        loanDate: 'Mar-2024',
        interestChangeReq: [{ interestChangedDate: 'Jul-2027', changedRate: 7 }],
      })
      expect(result.originalEmi).toMatch(/^\d+\.\d{2}$/)
      expect(result.approachA.totalInterest).toMatch(/^\d+\.\d{2}$/)
      expect(result.approachB.finalEmi).toMatch(/^\d+\.\d{2}$/)
      expect(result.approachA.newAmortisation[0].rateUsed).toMatch(/^\d+\.\d{2}$/)
    })
  })
})
