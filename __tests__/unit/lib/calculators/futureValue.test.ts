import { calculateFutureValue } from '@/lib/calculators/futureValue'

describe('calculateFutureValue', () => {
  it('matches RAD example: ₹1L at 10% for 10 years → ₹2.59L', () => {
    const result = calculateFutureValue({
      presentValue: 100000,
      annualRate: 10,
      tenureYears: 10,
    })
    // (1.10)^10 = 2.59374... → 259374.25
    expect(parseFloat(result.futureValue)).toBeCloseTo(259374.25, 1)
  })

  it('returns the principal when tenure is zero', () => {
    const result = calculateFutureValue({
      presentValue: 100000,
      annualRate: 10,
      tenureYears: 0,
    })
    expect(parseFloat(result.futureValue)).toBe(100000)
    expect(parseFloat(result.totalInterest)).toBe(0)
  })

  it('returns the principal when rate is zero', () => {
    const result = calculateFutureValue({
      presentValue: 50000,
      annualRate: 0,
      tenureYears: 5,
    })
    expect(parseFloat(result.futureValue)).toBe(50000)
    expect(parseFloat(result.totalInterest)).toBe(0)
  })

  it('reports total interest as FV − PV', () => {
    const r = calculateFutureValue({
      presentValue: 100000,
      annualRate: 8,
      tenureYears: 5,
    })
    const fv = parseFloat(r.futureValue)
    const interest = parseFloat(r.totalInterest)
    expect(interest).toBeCloseTo(fv - 100000, 1)
  })

  it('outputs strings with at most 2 decimal places', () => {
    const r = calculateFutureValue({
      presentValue: 12345.67,
      annualRate: 7.5,
      tenureYears: 8,
    })
    expect(r.futureValue.split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2)
    expect(r.totalInterest.split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2)
  })
})
