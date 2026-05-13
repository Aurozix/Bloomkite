import { calculateRequiredTenure } from '@/lib/calculators/tenureFinder'

describe('calculateRequiredTenure', () => {
  it('matches RAD example: ₹10L → ₹50L at 10% takes ~16.9 years', () => {
    const r = calculateRequiredTenure({
      presentValue: 1000000,
      futureValue: 5000000,
      annualRate: 10,
    })
    // ln(5) / ln(1.10) = 16.8881
    expect(parseFloat(r.requiredYears)).toBeCloseTo(16.89, 1)
  })

  it('reports months as years × 12 (rounded)', () => {
    const r = calculateRequiredTenure({
      presentValue: 1000000,
      futureValue: 2000000,
      annualRate: 10,
    })
    const years = parseFloat(r.requiredYears)
    const months = parseInt(r.requiredMonths, 10)
    expect(months).toBe(Math.round(years * 12))
  })

  it('returns 0 when rate is non-positive (unreachable)', () => {
    const r = calculateRequiredTenure({
      presentValue: 100000,
      futureValue: 1000000,
      annualRate: 0,
    })
    expect(parseFloat(r.requiredYears)).toBe(0)
  })

  it('returns 0 for invalid PV', () => {
    const r = calculateRequiredTenure({
      presentValue: 0,
      futureValue: 100000,
      annualRate: 10,
    })
    expect(parseFloat(r.requiredYears)).toBe(0)
  })

  it('a higher rate cuts the required tenure', () => {
    const slow = calculateRequiredTenure({
      presentValue: 100000,
      futureValue: 200000,
      annualRate: 5,
    })
    const fast = calculateRequiredTenure({
      presentValue: 100000,
      futureValue: 200000,
      annualRate: 15,
    })
    expect(parseFloat(fast.requiredYears)).toBeLessThan(
      parseFloat(slow.requiredYears)
    )
  })
})
