import { calculateRequiredRate } from '@/lib/calculators/rateFinder'

describe('calculateRequiredRate', () => {
  it('matches RAD example: ₹10L → ₹50L in 10 years needs ~17.46% (close to 17.5%)', () => {
    const r = calculateRequiredRate({
      presentValue: 1000000,
      futureValue: 5000000,
      tenureYears: 10,
    })
    // (5)^(1/10) - 1 = 0.17462 → 17.46%
    expect(parseFloat(r.requiredAnnualRate)).toBeCloseTo(17.46, 1)
  })

  it('handles equal PV and FV as zero growth', () => {
    const r = calculateRequiredRate({
      presentValue: 100000,
      futureValue: 100000,
      tenureYears: 5,
    })
    expect(parseFloat(r.requiredAnnualRate)).toBe(0)
  })

  it('returns 0 for invalid PV/n inputs', () => {
    expect(
      parseFloat(
        calculateRequiredRate({
          presentValue: 0,
          futureValue: 100000,
          tenureYears: 10,
        }).requiredAnnualRate
      )
    ).toBe(0)
    expect(
      parseFloat(
        calculateRequiredRate({
          presentValue: 100000,
          futureValue: 100000,
          tenureYears: 0,
        }).requiredAnnualRate
      )
    ).toBe(0)
  })

  it('reports the FV/PV multiplier', () => {
    const r = calculateRequiredRate({
      presentValue: 1000000,
      futureValue: 5000000,
      tenureYears: 10,
    })
    expect(parseFloat(r.multiplier)).toBe(5)
  })

  it('produces a higher rate when the tenure shortens', () => {
    const slow = calculateRequiredRate({
      presentValue: 100000,
      futureValue: 200000,
      tenureYears: 20,
    })
    const fast = calculateRequiredRate({
      presentValue: 100000,
      futureValue: 200000,
      tenureYears: 5,
    })
    expect(parseFloat(fast.requiredAnnualRate)).toBeGreaterThan(
      parseFloat(slow.requiredAnnualRate)
    )
  })
})
