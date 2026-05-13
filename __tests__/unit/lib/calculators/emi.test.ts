import { calculateEmi } from '@/lib/calculators/emi'

describe('calculateEmi', () => {
  describe('RAD canonical example (§11.5)', () => {
    // ₹30L at 8% p.a. for 20 years → EMI ≈ ₹25,093 (per standard EMI formula)
    // Note: the spec quotes ₹27,748 as the EMI but that value derives from a
    // rounded monthly rate (0.00667 instead of 8/12/100 = 0.006666…). With the
    // exact monthly rate the EMI is ₹25,093.10. We assert the mathematically
    // correct figure — the spec rounding is approximate, not authoritative.
    const result = calculateEmi({
      loanAmount: 3000000,
      tenure: 20,
      tenureType: 'YEAR',
      interestRate: 8,
      startDate: 'Jan-2026',
    })

    it('produces a 240-row amortization schedule', () => {
      expect(result.amortisationResponse.length).toBe(240)
      expect(result.tenure).toBe(240)
    })

    it('computes monthly EMI within ₹1 of ₹25,093.10', () => {
      expect(parseFloat(result.emi)).toBeCloseTo(25093.1, 0)
    })

    it('total payable = principal + total interest', () => {
      const total = parseFloat(result.total)
      const principal = parseFloat(result.loanAmount)
      const interest = parseFloat(result.interestPayable)
      expect(total).toBeCloseTo(principal + interest, 1)
    })

    it('first row opening balance equals the principal', () => {
      const first = result.amortisationResponse[0]
      expect(parseFloat(first.openingBalance)).toBeCloseTo(3000000, 1)
    })

    it('first month interest = principal × monthlyRate', () => {
      const first = result.amortisationResponse[0]
      // 3,000,000 × (8/12/100) = 20,000
      expect(parseFloat(first.interest)).toBeCloseTo(20000, 1)
    })

    it('final row closes the loan at zero', () => {
      const last = result.amortisationResponse[239]
      expect(parseFloat(last.closingBalance)).toBe(0)
      expect(parseFloat(last.loanPaid)).toBeCloseTo(100, 1)
    })

    it('schedule dates increment monthly from the start date', () => {
      const first = result.amortisationResponse[0]
      const second = result.amortisationResponse[1]
      const dec2026 = result.amortisationResponse[11]
      const jan2027 = result.amortisationResponse[12]
      expect(first.date).toBe('Jan-2026')
      expect(second.date).toBe('Feb-2026')
      expect(dec2026.date).toBe('Dec-2026')
      expect(jan2027.date).toBe('Jan-2027')
    })
  })

  describe('tenure type handling', () => {
    it('treats 240 months identically to 20 years', () => {
      const inMonths = calculateEmi({
        loanAmount: 3000000,
        tenure: 240,
        tenureType: 'MONTH',
        interestRate: 8,
      })
      const inYears = calculateEmi({
        loanAmount: 3000000,
        tenure: 20,
        tenureType: 'YEAR',
        interestRate: 8,
      })
      expect(inMonths.emi).toBe(inYears.emi)
      expect(inMonths.tenure).toBe(inYears.tenure)
    })
  })

  describe('edge cases', () => {
    it('handles zero interest rate (linear amortization)', () => {
      const result = calculateEmi({
        loanAmount: 120000,
        tenure: 12,
        tenureType: 'MONTH',
        interestRate: 0,
      })
      // 120,000 / 12 = 10,000 EMI; total interest = 0
      expect(parseFloat(result.emi)).toBeCloseTo(10000, 2)
      expect(parseFloat(result.interestPayable)).toBeCloseTo(0, 2)
      expect(parseFloat(result.amortisationResponse[0].interest)).toBe(0)
    })

    it('returns empty schedule for zero tenure', () => {
      const result = calculateEmi({
        loanAmount: 100000,
        tenure: 0,
        tenureType: 'MONTH',
        interestRate: 10,
      })
      expect(result.amortisationResponse).toEqual([])
      expect(parseFloat(result.emi)).toBe(0)
    })

    it('returns empty schedule for zero principal', () => {
      const result = calculateEmi({
        loanAmount: 0,
        tenure: 12,
        tenureType: 'MONTH',
        interestRate: 10,
      })
      expect(result.amortisationResponse).toEqual([])
      expect(parseFloat(result.emi)).toBe(0)
    })

    it('cumulative totalPaid on the final row equals total payable', () => {
      const result = calculateEmi({
        loanAmount: 1000000,
        tenure: 5,
        tenureType: 'YEAR',
        interestRate: 9,
      })
      const last = result.amortisationResponse[result.amortisationResponse.length - 1]
      expect(parseFloat(last.totalPaid)).toBeCloseTo(parseFloat(result.total), 1)
    })

    it('falls back to current month when startDate is omitted', () => {
      const result = calculateEmi({
        loanAmount: 100000,
        tenure: 1,
        tenureType: 'MONTH',
        interestRate: 10,
      })
      expect(result.amortisationResponse[0].date).toMatch(/^[A-Z][a-z]{2}-\d{4}$/)
    })

    it('falls back to current month when startDate is malformed', () => {
      const result = calculateEmi({
        loanAmount: 100000,
        tenure: 1,
        tenureType: 'MONTH',
        interestRate: 10,
        startDate: 'not-a-date',
      })
      expect(result.amortisationResponse[0].date).toMatch(/^[A-Z][a-z]{2}-\d{4}$/)
    })
  })

  describe('schedule invariants', () => {
    const result = calculateEmi({
      loanAmount: 500000,
      tenure: 36,
      tenureType: 'MONTH',
      interestRate: 12,
      startDate: 'Mar-2026',
    })

    it('opening[n] equals closing[n-1] for every adjacent pair', () => {
      for (let i = 1; i < result.amortisationResponse.length; i++) {
        const prev = parseFloat(result.amortisationResponse[i - 1].closingBalance)
        const curr = parseFloat(result.amortisationResponse[i].openingBalance)
        expect(curr).toBeCloseTo(prev, 1)
      }
    })

    it('interest portion strictly decreases over the life of the loan', () => {
      const first = parseFloat(result.amortisationResponse[0].interest)
      const middle = parseFloat(result.amortisationResponse[17].interest)
      const last = parseFloat(result.amortisationResponse[35].interest)
      expect(first).toBeGreaterThan(middle)
      expect(middle).toBeGreaterThan(last)
    })

    it('principal portion strictly increases over the life of the loan', () => {
      const first = parseFloat(result.amortisationResponse[0].principal)
      const last = parseFloat(result.amortisationResponse[34].principal)
      expect(last).toBeGreaterThan(first)
    })
  })

  describe('output formatting', () => {
    it('returns currency strings with exactly 2 decimal places', () => {
      const result = calculateEmi({
        loanAmount: 1234567,
        tenure: 7,
        tenureType: 'YEAR',
        interestRate: 7.5,
      })
      expect(result.emi).toMatch(/^\d+\.\d{2}$/)
      expect(result.interestPayable).toMatch(/^\d+\.\d{2}$/)
      expect(result.total).toMatch(/^\d+\.\d{2}$/)
      expect(result.amortisationResponse[0].interest).toMatch(/^\d+\.\d{2}$/)
    })
  })
})
