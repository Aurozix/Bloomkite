import { GET } from '@/app/api/auth/session/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  })),
}))

describe('Session Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/auth/session', () => {
    it('should return null user when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.user).toBeNull()
    })

    it('should handle missing environment variables gracefully', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'mock-token' }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    })

    it('should handle errors gracefully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
      })

      const response = await GET(request)

      expect([200, 401]).toContain(response.status)
    })
  })

  describe('Session validation', () => {
    it('should handle request without cookie store', async () => {
      ;(cookies as jest.Mock).mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      })

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.user).toBeNull()
    })

    it('should return JSON response', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})
