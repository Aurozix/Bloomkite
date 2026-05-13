import { calculatePartialPayment } from '@/lib/calculators/partialPayment'
import { calculateEmi } from '@/lib/calculators/emi'

describe('calculatePartialPayment', () => {
  describe('RAD canonical scenario (§13.1)', () => {
    // ₹30L at 8% for 20 years starting Jan-2024, single ₹5L prepayment Jun-2029.
    // Jun-2029 is month-index 65 (0-based) from Jan-2024 → the 66th payment.
    const result = calculatePartialPayment({
      loanAmount: 3000000,
      interestRate: 8,
      tenure: 20,
      tenureType: 'YEAR',
      loanDate: 'Jan-2024',
      partialPaymentReq: [
        { partPayDate: 'Jun-2029', partPayAmount: 500000 },
      ],
    })

    it('keeps the EMI unchanged from the original loan', () => {
      const original = calculateEmi({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
      })
      expect(result.emi).toBe(original.emi)
    })

    it('shortens the tenure relative to the original 240 months', () => {
      expect(result.originalTenureMonths).toBe(240)
      expect(result.revisedTenureMonths).toBeLessThan(240)
      expect(result.tenureReductionMonths).toBe(240 - result.revisedTenureMonths)
    })

    it('produces a positive interest saved', () => {
      expect(parseFloat(result.interestSaved)).toBeGreaterThan(0)
      expect(parseFloat(result.totalInterestNow)).toBeLessThan(
        parseFloat(result.originalTotalInterest),
      )
    })

    it('records the ₹5L prepayment at the Jun-2029 row (month 66)', () => {
      const prepaymentRow = result.newAmortisation.find((r) => r.date === 'Jun-2029')
      expect(prepaymentRow).toBeDefined()
      expect(prepaymentRow!.monthNumber).toBe(66)
      expect(parseFloat(prepaymentRow!.partialPayment)).toBeCloseTo(500000, 0)
    })

    it('every non-prepayment row has zero partialPayment', () => {
      const nonPrepay = result.newAmortisation.filter((r) => r.date !== 'Jun-2029')
      for (const row of nonPrepay) {
        expect(parseFloat(row.partialPayment)).toBe(0)
      }
    })

    it('terminates at exactly zero closing balance', () => {
      const last = result.newAmortisation[result.newAmortisation.length - 1]
      expect(parseFloat(last.closingBalance)).toBe(0)
      expect(parseFloat(last.loanPaid)).toBeCloseTo(100, 1)
    })

    it('schedule date increments monthly from the loan start', () => {
      expect(result.newAmortisation[0].date).toBe('Jan-2024')
      expect(result.newAmortisation[11].date).toBe('Dec-2024')
      expect(result.newAmortisation[12].date).toBe('Jan-2025')
    })
  })

  describe('schedule invariants', () => {
    const result = calculatePartialPayment({
      loanAmount: 3000000,
      interestRate: 8,
      tenure: 20,
      tenureType: 'YEAR',
      loanDate: 'Jan-2024',
      partialPaymentReq: [{ partPayDate: 'Jun-2029', partPayAmount: 500000 }],
    })

    it('opening[n] equals closing[n-1] for every adjacent pair', () => {
      for (let i = 1; i < result.newAmortisation.length; i++) {
        const prev = parseFloat(result.newAmortisation[i - 1].closingBalance)
        const curr = parseFloat(result.newAmortisation[i].openingBalance)
        expect(curr).toBeCloseTo(prev, 1)
      }
    })

    it('totalPaid on final row equals principal + revised total interest', () => {
      const last = result.newAmortisation[result.newAmortisation.length - 1]
      const expectedTotal = 3000000 + parseFloat(result.totalInterestNow)
      expect(parseFloat(last.totalPaid)).toBeCloseTo(expectedTotal, 0)
    })

    it('% paid is monotonically non-decreasing', () => {
      let prev = -1
      for (const row of result.newAmortisation) {
        const pct = parseFloat(row.loanPaid)
        expect(pct).toBeGreaterThanOrEqual(prev)
        prev = pct
      }
    })
  })

  describe('no-prepayment baseline', () => {
    it('matches the EMI calculator exactly when no prepayments are provided', () => {
      const result = calculatePartialPayment({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [],
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

  describe('multiple prepayments', () => {
    it('shortens tenure further than a single equivalent prepayment', () => {
      const single = calculatePartialPayment({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [{ partPayDate: 'Jan-2027', partPayAmount: 1000000 }],
      })
      const split = calculatePartialPayment({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [
          { partPayDate: 'Jan-2027', partPayAmount: 500000 },
          { partPayDate: 'Jan-2028', partPayAmount: 500000 },
        ],
      })
      // Earlier-only prepayment is mathematically at least as good as splitting
      // it (same total, but more time at lower balance). Tenure should be
      // shorter-or-equal for single, never longer.
      expect(single.revisedTenureMonths).toBeLessThanOrEqual(split.revisedTenureMonths)
    })

    it('sums multiple prepayments on the same month into one row', () => {
      const result = calculatePartialPayment({
        loanAmount: 3000000,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [
          { partPayDate: 'Jan-2027', partPayAmount: 200000 },
          { partPayDate: 'Jan-2027', partPayAmount: 300000 },
        ],
      })
      const row = result.newAmortisation.find((r) => r.date === 'Jan-2027')
      expect(parseFloat(row!.partialPayment)).toBeCloseTo(500000, 0)
    })
  })

  describe('edge cases', () => {
    it('drops prepayments dated before the loan start', () => {
      const result = calculatePartialPayment({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [{ partPayDate: 'Jan-2020', partPayAmount: 100000 }],
      })
      expect(result.tenureReductionMonths).toBe(0)
      expect(result.newAmortisation.every((r) => parseFloat(r.partialPayment) === 0)).toBe(true)
    })

    it('drops prepayments dated after the natural loan end', () => {
      const result = calculatePartialPayment({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [{ partPayDate: 'Jan-2099', partPayAmount: 100000 }],
      })
      expect(result.tenureReductionMonths).toBe(0)
    })

    it('handles a prepayment that fully closes the loan in one shot', () => {
      const result = calculatePartialPayment({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [{ partPayDate: 'Feb-2024', partPayAmount: 5000000 }],
      })
      expect(result.revisedTenureMonths).toBe(2)
      const last = result.newAmortisation[1]
      expect(parseFloat(last.closingBalance)).toBe(0)
      // The prepayment is capped at the remaining outstanding — no refund of
      // the ₹50L over-payment.
      expect(parseFloat(last.partialPayment)).toBeLessThan(5000000)
    })

    it('handles zero-rate loans with prepayments (linear amortization)', () => {
      const result = calculatePartialPayment({
        loanAmount: 120000,
        interestRate: 0,
        tenure: 12,
        tenureType: 'MONTH',
        loanDate: 'Jan-2024',
        partialPaymentReq: [{ partPayDate: 'Mar-2024', partPayAmount: 30000 }],
      })
      // Original EMI = 10,000. After 2 EMIs (20k) + 30k prepayment in mar = 50k
      // paid by Mar; remaining 70k at 10k/mo = 7 more months. Loan closes by
      // Oct-2024 (month 10). Total = 10 months.
      expect(parseFloat(result.emi)).toBeCloseTo(10000, 2)
      expect(result.revisedTenureMonths).toBeLessThan(12)
      expect(parseFloat(result.interestSaved)).toBe(0)
      expect(parseFloat(result.totalInterestNow)).toBe(0)
    })

    it('returns empty schedule for zero principal', () => {
      const result = calculatePartialPayment({
        loanAmount: 0,
        interestRate: 8,
        tenure: 20,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [{ partPayDate: 'Jun-2029', partPayAmount: 500000 }],
      })
      expect(result.newAmortisation).toEqual([])
    })

    it('ignores prepayments with non-positive amounts', () => {
      const result = calculatePartialPayment({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        loanDate: 'Jan-2024',
        partialPaymentReq: [
          { partPayDate: 'Jan-2026', partPayAmount: 0 },
          { partPayDate: 'Jan-2027', partPayAmount: -100000 },
        ],
      })
      expect(result.tenureReductionMonths).toBe(0)
    })

    it('falls back gracefully when loanDate is missing/malformed', () => {
      const result = calculatePartialPayment({
        loanAmount: 1000000,
        interestRate: 10,
        tenure: 10,
        tenureType: 'YEAR',
        partialPaymentReq: [{ partPayDate: 'Jun-2029', partPayAmount: 100000 }],
      })
      // Without a parseable loanDate we can't align prepayments → schedule
      // runs full tenure, no prepayment applied.
      expect(result.revisedTenureMonths).toBe(120)
      expect(result.tenureReductionMonths).toBe(0)
    })
  })

  describe('output formatting', () => {
    it('returns currency strings with exactly 2 decimal places', () => {
      const result = calculatePartialPayment({
        loanAmount: 1234567,
        interestRate: 7.5,
        tenure: 15,
        tenureType: 'YEAR',
        loanDate: 'Mar-2024',
        partialPaymentReq: [{ partPayDate: 'Jul-2027', partPayAmount: 50000 }],
      })
      expect(result.emi).toMatch(/^\d+\.\d{2}$/)
      expect(result.interestSaved).toMatch(/^\d+\.\d{2}$/)
      expect(result.totalInterestNow).toMatch(/^\d+\.\d{2}$/)
      expect(result.originalTotalInterest).toMatch(/^\d+\.\d{2}$/)
      expect(result.newAmortisation[0].partialPayment).toMatch(/^\d+\.\d{2}$/)
    })
  })
})
