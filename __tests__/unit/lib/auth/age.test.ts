import { isAtLeast18, parseISODate } from '@/lib/auth/age'

describe('isAtLeast18', () => {
  it('returns true for a clear adult', () => {
    const dob = new Date(1990, 0, 1)
    expect(isAtLeast18(dob, new Date(2026, 5, 13))).toBe(true)
  })

  it('returns false for someone clearly under 18', () => {
    const dob = new Date(2020, 0, 1)
    expect(isAtLeast18(dob, new Date(2026, 5, 13))).toBe(false)
  })

  it('returns true on the 18th birthday', () => {
    const dob = new Date(2008, 5, 13)
    expect(isAtLeast18(dob, new Date(2026, 5, 13))).toBe(true)
  })

  it('returns false the day before the 18th birthday', () => {
    const dob = new Date(2008, 5, 14)
    expect(isAtLeast18(dob, new Date(2026, 5, 13))).toBe(false)
  })

  it('returns true the day after the 18th birthday', () => {
    const dob = new Date(2008, 5, 12)
    expect(isAtLeast18(dob, new Date(2026, 5, 13))).toBe(true)
  })

  it('handles leap-year birthdays', () => {
    const dob = new Date(2008, 1, 29)
    // On Feb 28, 2026 they're still 17 (not yet had birthday this non-leap year).
    expect(isAtLeast18(dob, new Date(2026, 1, 28))).toBe(false)
    // On Mar 1, 2026 they're 18.
    expect(isAtLeast18(dob, new Date(2026, 2, 1))).toBe(true)
  })

  it('rejects invalid dates', () => {
    expect(isAtLeast18(new Date('not-a-date'))).toBe(false)
    expect(isAtLeast18(null as unknown as Date)).toBe(false)
    expect(isAtLeast18(undefined as unknown as Date)).toBe(false)
  })
})

describe('parseISODate', () => {
  it('parses a valid YYYY-MM-DD string', () => {
    const d = parseISODate('1990-06-15')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(1990)
    expect(d!.getMonth()).toBe(5)
    expect(d!.getDate()).toBe(15)
  })

  it('rejects non-string inputs', () => {
    expect(parseISODate(null)).toBeNull()
    expect(parseISODate(undefined)).toBeNull()
    expect(parseISODate(123 as unknown as string)).toBeNull()
    expect(parseISODate({} as unknown as string)).toBeNull()
  })

  it('rejects malformed strings', () => {
    expect(parseISODate('1990/06/15')).toBeNull()
    expect(parseISODate('1990-6-15')).toBeNull()
    expect(parseISODate('1990-06-15T12:00:00Z')).toBeNull()
    expect(parseISODate('')).toBeNull()
  })

  it('rejects obviously absurd years', () => {
    expect(parseISODate('1800-01-01')).toBeNull()
    expect(parseISODate('2200-01-01')).toBeNull()
  })

  it('rejects invalid month/day', () => {
    expect(parseISODate('1990-13-01')).toBeNull()
    expect(parseISODate('1990-00-01')).toBeNull()
    expect(parseISODate('1990-01-32')).toBeNull()
    expect(parseISODate('1990-01-00')).toBeNull()
  })

  it('rejects month/day combinations that roll over (e.g., Feb 31)', () => {
    expect(parseISODate('2024-02-31')).toBeNull()
    expect(parseISODate('2023-02-29')).toBeNull() // 2023 isn't a leap year
  })

  it('accepts valid leap day', () => {
    expect(parseISODate('2024-02-29')).not.toBeNull()
  })
})
