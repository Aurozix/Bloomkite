import { NextRequest } from 'next/server'

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      updateMany: jest.fn(),
    },
    emailVerificationOtp: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => {
  const actual = jest.requireActual('@/lib/email')
  return {
    ...actual,
    sendVerificationOtpEmail: jest.fn(),
    findActiveEmailOtp: jest.fn(),
    consumeEmailOtp: jest.fn(),
  }
})

import { POST, GET } from '@/app/api/auth/verify-email/route'
import { findActiveEmailOtp, consumeEmailOtp, OTP_MAX_ATTEMPTS } from '@/lib/email'

const mockedFind = findActiveEmailOtp as jest.MockedFunction<typeof findActiveEmailOtp>
const mockedConsume = consumeEmailOtp as jest.MockedFunction<typeof consumeEmailOtp>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/verify-email (OTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('input validation', () => {
    it('rejects missing email', async () => {
      const res = await POST(makeRequest({ code: '123456' }))
      expect(res.status).toBe(400)
    })

    it('rejects missing code', async () => {
      const res = await POST(makeRequest({ email: 'a@b.com' }))
      expect(res.status).toBe(400)
    })

    it('rejects non-6-digit codes', async () => {
      const r1 = await POST(makeRequest({ email: 'a@b.com', code: '12345' }))
      const r2 = await POST(makeRequest({ email: 'a@b.com', code: 'abcdef' }))
      const r3 = await POST(makeRequest({ email: 'a@b.com', code: '1234567' }))
      expect(r1.status).toBe(400)
      expect(r2.status).toBe(400)
      expect(r3.status).toBe(400)
    })

    it('rejects malformed email', async () => {
      const res = await POST(makeRequest({ email: 'not-an-email', code: '123456' }))
      expect(res.status).toBe(400)
    })
  })

  describe('verification flow', () => {
    it('returns no_active_otp when no row exists', async () => {
      mockedFind.mockResolvedValue(null)
      const res = await POST(makeRequest({ email: 'a@b.com', code: '123456' }))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.code).toBe('no_active_otp')
      expect(mockedConsume).not.toHaveBeenCalled()
    })

    it('returns wrong_code with attemptsRemaining when code mismatch', async () => {
      mockedFind
        .mockResolvedValueOnce({
          id: '1',
          email: 'a@b.com',
          codeHash: 'h',
          attempts: 0,
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
        } as never)
        .mockResolvedValueOnce({
          id: '1',
          email: 'a@b.com',
          codeHash: 'h',
          attempts: 2,
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
        } as never)
      mockedConsume.mockResolvedValue(false)
      const res = await POST(makeRequest({ email: 'a@b.com', code: '999999' }))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.code).toBe('wrong_code')
      expect(data.attemptsRemaining).toBe(OTP_MAX_ATTEMPTS - 2)
    })

    it('returns success on correct code', async () => {
      mockedFind.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        codeHash: 'h',
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      } as never)
      mockedConsume.mockResolvedValue(true)
      const res = await POST(makeRequest({ email: 'a@b.com', code: '123456' }))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('uppercases-and-lowercases email consistently', async () => {
      mockedFind.mockResolvedValue(null)
      await POST(makeRequest({ email: 'TEST@B.com', code: '123456' }))
      expect(mockedFind).toHaveBeenCalledWith('test@b.com')
    })
  })

  describe('GET handler', () => {
    it('redirects pre-OTP-rollout link clicks to the new code-entry page', () => {
      const req = new NextRequest('http://localhost:3000/api/auth/verify-email?token=x&email=a@b.com')
      const res = GET(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/auth/verify-email')
      expect(res.headers.get('location')).toContain('error=link_no_longer_supported')
    })
  })
})
