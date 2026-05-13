import { calculateEmiCapacity } from '@/lib/calculators/emiCapacity'
import { calculateEmi } from '@/lib/calculators/emi'
import { BackupAvailability, IncomeStabilityLevel } from '@/lib/calculators/types'

describe('calculateEmiCapacity', () => {
  describe('RAD canonical example (§12.5)', () => {
    // Income 83,333 − Existing EMI 5,000 − Expense 33,333 = ₹45,000 surplus
    // HIGH/YES → 100% multiplier, no additional income → capacity = ₹45,000
    // Age 35 → retire 65 (30yr available, capped to 20yr = 240mo)
    // Rate 8% p.a. → monthly 0.00666…
    //
    // Spec §12.5 quotes "Max Loan ≈ ₹48.45L", but the inverse-annuity formula
    // (which §12.3 explicitly states) gives ~₹53.80L from EMI=45,000 at those
    // params. The spec's example number doesn't match its own formula — same
    // kind of internal inconsistency seen in §11.5. We assert the math, not
    // the spec's example figure.
    const result = calculateEmiCapacity({
      currentAge: 35,
      retirementAge: 65,
      netFamilyIncome: 83333,
      existingEmi: 5000,
      houseHoldExpense: 33333,
      additionalIncome: 0,
      stability: 'HIGH',
      backUp: 'YES',
      interestRate: 8,
    })

    it('computes gross monthly surplus as income − existing EMI − expenses', () => {
      expect(parseFloat(result.surplusMoney)).toBeCloseTo(45000, 0)
    })

    it('applies 100% multiplier for HIGH/YES', () => {
      expect(parseFloat(result.surplus)).toBeCloseTo(45000, 0)
      expect(result.stabilityMultiplier).toBe('100')
    })

    it('EMI capacity equals adjusted surplus plus additional income', () => {
      expect(parseFloat(result.emiCapacity)).toBeCloseTo(45000, 0)
      expect(parseFloat(result.monthlyEmiAffordable)).toBeCloseTo(45000, 0)
    })

    it('caps tenure at 20 years even when retirement allows longer', () => {
      expect(result.termOfLoan).toBe(20)
    })

    it('max loan equals the inverse-annuity formula result (~₹53.8L)', () => {
      // EMI 45,000 at 8% over 240 months → ₹53,79,943.13 (within ₹500).
      expect(parseFloat(result.advisableLoanAmount)).toBeCloseTo(5379943, -3)
    })

    it('the returned loan amount produces an EMI back-matching the capacity', () => {
      // Inverse round-trip: feed advisable loan into EMI calculator and the
      // resulting EMI should equal the input capacity (within rounding).
      const inverse = calculateEmi({
        loanAmount: parseFloat(result.advisableLoanAmount),
        tenure: 20,
        tenureType: 'YEAR',
        interestRate: 8,
      })
      expect(parseFloat(inverse.emi)).toBeCloseTo(45000, 0)
    })
  })

  describe('stability × backup multiplier matrix (§12.3)', () => {
    const base = {
      currentAge: 30,
      retirementAge: 60,
      netFamilyIncome: 100000,
      existingEmi: 0,
      houseHoldExpense: 50000,
      additionalIncome: 0,
      interestRate: 8,
    }

    const cases: Array<{
      stability: IncomeStabilityLevel
      backUp: BackupAvailability
      pct: string
    }> = [
      { stability: 'HIGH', backUp: 'YES', pct: '100' },
      { stability: 'HIGH', backUp: 'NO', pct: '90' },
      { stability: 'MEDIUM', backUp: 'YES', pct: '90' },
      { stability: 'MEDIUM', backUp: 'NO', pct: '80' },
    ]

    it.each(cases)('$stability/$backUp → $pct%', ({ stability, backUp, pct }) => {
      const r = calculateEmiCapacity({ ...base, stability, backUp })
      expect(r.stabilityMultiplier).toBe(pct)
      const expectedSurplus = 50000 * (parseInt(pct, 10) / 100)
      expect(parseFloat(r.surplus)).toBeCloseTo(expectedSurplus, 0)
    })

    it('HIGH/YES yields a strictly larger loan capacity than MEDIUM/NO', () => {
      const highYes = calculateEmiCapacity({ ...base, stability: 'HIGH', backUp: 'YES' })
      const medNo = calculateEmiCapacity({ ...base, stability: 'MEDIUM', backUp: 'NO' })
      expect(parseFloat(highYes.advisableLoanAmount)).toBeGreaterThan(
        parseFloat(medNo.advisableLoanAmount),
      )
    })
  })

  describe('tenure cap (§12.3 step 4)', () => {
    const base = {
      netFamilyIncome: 100000,
      existingEmi: 0,
      houseHoldExpense: 50000,
      additionalIncome: 0,
      stability: 'HIGH' as const,
      backUp: 'YES' as const,
      interestRate: 8,
    }

    it('caps at 20 years when working years exceed 20', () => {
      const r = calculateEmiCapacity({ ...base, currentAge: 25, retirementAge: 65 })
      expect(r.termOfLoan).toBe(20)
    })

    it('uses working years when they are less than 20', () => {
      const r = calculateEmiCapacity({ ...base, currentAge: 55, retirementAge: 65 })
      expect(r.termOfLoan).toBe(10)
    })

    it('uses working years exactly when equal to 20', () => {
      const r = calculateEmiCapacity({ ...base, currentAge: 45, retirementAge: 65 })
      expect(r.termOfLoan).toBe(20)
    })

    it('shorter tenure produces a smaller advisable loan at the same EMI capacity', () => {
      const longer = calculateEmiCapacity({ ...base, currentAge: 25, retirementAge: 65 })
      const shorter = calculateEmiCapacity({ ...base, currentAge: 55, retirementAge: 65 })
      expect(parseFloat(longer.advisableLoanAmount)).toBeGreaterThan(
        parseFloat(shorter.advisableLoanAmount),
      )
    })
  })

  describe('edge cases', () => {
    const base = {
      currentAge: 35,
      retirementAge: 65,
      stability: 'HIGH' as const,
      backUp: 'YES' as const,
      interestRate: 8,
    }

    it('returns zero loan when expenses + existing EMI exceed income', () => {
      const r = calculateEmiCapacity({
        ...base,
        netFamilyIncome: 50000,
        existingEmi: 10000,
        houseHoldExpense: 60000,
        additionalIncome: 0,
      })
      expect(parseFloat(r.surplusMoney)).toBeLessThan(0)
      expect(parseFloat(r.advisableLoanAmount)).toBe(0)
    })

    it('includes additional income in EMI capacity', () => {
      const without = calculateEmiCapacity({
        ...base,
        netFamilyIncome: 80000,
        existingEmi: 0,
        houseHoldExpense: 40000,
        additionalIncome: 0,
      })
      const withAdd = calculateEmiCapacity({
        ...base,
        netFamilyIncome: 80000,
        existingEmi: 0,
        houseHoldExpense: 40000,
        additionalIncome: 10000,
      })
      expect(parseFloat(withAdd.emiCapacity) - parseFloat(without.emiCapacity)).toBeCloseTo(
        10000,
        0,
      )
      expect(parseFloat(withAdd.advisableLoanAmount)).toBeGreaterThan(
        parseFloat(without.advisableLoanAmount),
      )
    })

    it('handles retirement age below current age by clamping tenure to 0', () => {
      const r = calculateEmiCapacity({
        ...base,
        currentAge: 70,
        retirementAge: 65,
        netFamilyIncome: 100000,
        existingEmi: 0,
        houseHoldExpense: 30000,
        additionalIncome: 0,
      })
      expect(r.termOfLoan).toBe(0)
      expect(parseFloat(r.advisableLoanAmount)).toBe(0)
    })

    it('zero interest rate gives a finite loan (linear amortization)', () => {
      // At r=0, max loan = EMI × n
      const r = calculateEmiCapacity({
        ...base,
        netFamilyIncome: 100000,
        existingEmi: 0,
        houseHoldExpense: 50000,
        additionalIncome: 0,
        interestRate: 0,
      })
      const expected = 50000 * 240
      expect(parseFloat(r.advisableLoanAmount)).toBeCloseTo(expected, -2)
    })
  })

  describe('output formatting', () => {
    it('returns currency strings with exactly 2 decimal places', () => {
      const r = calculateEmiCapacity({
        currentAge: 32,
        retirementAge: 62,
        netFamilyIncome: 90000.55,
        existingEmi: 7200.33,
        houseHoldExpense: 38500.11,
        additionalIncome: 1234.56,
        stability: 'MEDIUM',
        backUp: 'NO',
        interestRate: 9.25,
      })
      expect(r.surplusMoney).toMatch(/^-?\d+\.\d{2}$/)
      expect(r.surplus).toMatch(/^-?\d+\.\d{2}$/)
      expect(r.emiCapacity).toMatch(/^-?\d+\.\d{2}$/)
      expect(r.advisableLoanAmount).toMatch(/^\d+\.\d{2}$/)
      expect(r.monthlyEmiAffordable).toMatch(/^-?\d+\.\d{2}$/)
    })
  })
})
