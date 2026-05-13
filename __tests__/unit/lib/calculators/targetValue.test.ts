import { calculateTargetValue } from '@/lib/calculators/targetValue'

describe('calculateTargetValue', () => {
  it('handles zero rate as a linear distribution', () => {
    const r = calculateTargetValue({
      targetAmount: 120000,
      annualRate: 0,
      tenureYears: 10,
    })
    // 120000 / (10*12) = 1000 per month
    expect(parseFloat(r.requiredMonthlyInvestment)).toBeCloseTo(1000, 2)
    expect(parseFloat(r.totalContribution)).toBeCloseTo(120000, 2)
    expect(parseFloat(r.expectedReturns)).toBe(0)
  })

  it('produces a smaller PMT when rate goes up', () => {
    const low = calculateTargetValue({
      targetAmount: 5000000,
      annualRate: 6,
      tenureYears: 10,
    })
    const high = calculateTargetValue({
      targetAmount: 5000000,
      annualRate: 12,
      tenureYears: 10,
    })
    expect(parseFloat(high.requiredMonthlyInvestment)).toBeLessThan(
      parseFloat(low.requiredMonthlyInvestment)
    )
  })

  it('produces a smaller PMT when tenure goes up', () => {
    const short = calculateTargetValue({
      targetAmount: 5000000,
      annualRate: 10,
      tenureYears: 5,
    })
    const long = calculateTargetValue({
      targetAmount: 5000000,
      annualRate: 10,
      tenureYears: 20,
    })
    expect(parseFloat(long.requiredMonthlyInvestment)).toBeLessThan(
      parseFloat(short.requiredMonthlyInvestment)
    )
  })

  it('total contribution × N = monthly × months (positive rates)', () => {
    const r = calculateTargetValue({
      targetAmount: 1000000,
      annualRate: 10,
      tenureYears: 10,
    })
    const monthly = parseFloat(r.requiredMonthlyInvestment)
    const total = parseFloat(r.totalContribution)
    // Decimal rounds each output to 2dp, so a tiny rebuild gap is expected;
    // tolerance accommodates the rounding error scaled by N (120 months).
    expect(Math.abs(total - monthly * 120)).toBeLessThan(1)
  })

  it('expectedReturns is non-negative', () => {
    const r = calculateTargetValue({
      targetAmount: 1000000,
      annualRate: 8,
      tenureYears: 5,
    })
    expect(parseFloat(r.expectedReturns)).toBeGreaterThanOrEqual(0)
  })
})
