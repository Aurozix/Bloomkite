import { normalisePhone } from '@/lib/auth/phone-otp'

describe('normalisePhone', () => {
  it('returns E.164 unchanged when valid', () => {
    expect(normalisePhone('+919876543210')).toBe('+919876543210')
    expect(normalisePhone('+14155552671')).toBe('+14155552671')
  })

  it('strips formatting whitespace, dashes, parens', () => {
    expect(normalisePhone('+91 98765 43210')).toBe('+919876543210')
    expect(normalisePhone('+91-98765-43210')).toBe('+919876543210')
    expect(normalisePhone('(+91) 9876543210')).toBe('+919876543210')
  })

  it('prepends +91 to bare 10-digit Indian mobiles', () => {
    expect(normalisePhone('9876543210')).toBe('+919876543210')
    expect(normalisePhone('8123456789')).toBe('+918123456789')
    expect(normalisePhone('7000000000')).toBe('+917000000000')
    expect(normalisePhone('6000000000')).toBe('+916000000000')
  })

  it('converts 00-prefixed international format to +', () => {
    expect(normalisePhone('00919876543210')).toBe('+919876543210')
  })

  it('rejects 10-digit numbers not starting 6-9 (not an Indian mobile)', () => {
    expect(normalisePhone('5876543210')).toBeNull()
    expect(normalisePhone('1234567890')).toBeNull()
  })

  it('rejects too-short and too-long strings', () => {
    expect(normalisePhone('+91123')).toBeNull()
    expect(normalisePhone('+91123456789012345678')).toBeNull()
    expect(normalisePhone('987654321')).toBeNull() // 9 digits
    expect(normalisePhone('98765432101')).toBeNull() // 11 digits
  })

  it('rejects non-numeric content', () => {
    expect(normalisePhone('not-a-phone')).toBeNull()
    expect(normalisePhone('+91 abc def ghij')).toBeNull()
  })

  it('rejects non-string inputs', () => {
    expect(normalisePhone(null as unknown as string)).toBeNull()
    expect(normalisePhone(undefined as unknown as string)).toBeNull()
    expect(normalisePhone(9876543210 as unknown as string)).toBeNull()
  })
})
