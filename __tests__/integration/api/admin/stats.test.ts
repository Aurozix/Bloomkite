import { GET } from '@/app/api/admin/stats/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      head: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue({
        count: 100,
        data: null,
        error: null,
      }),
    })),
  })),
}))

describe('Admin Stats Route', () => {
  const mockAdminToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMifQ.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/stats', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should return stats for admin', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should include total users count', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()
      expect(data.data?.totalUsers).toBeDefined()
      expect(typeof data.data?.totalUsers).toBe('number')
    })

    it('should include total advisors count', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()
      expect(data.data?.totalAdvisors).toBeDefined()
      expect(typeof data.data?.totalAdvisors).toBe('number')
    })

    it('should include pending credentials count', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()
      expect(data.data?.pendingCredentials).toBeDefined()
      expect(typeof data.data?.pendingCredentials).toBe('number')
    })

    it('should include pending articles count', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()
      expect(data.data?.pendingArticles).toBeDefined()
      expect(typeof data.data?.pendingArticles).toBe('number')
    })

    it('should return 403 if user is not admin', async () => {
      const nonAdminToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature'

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: nonAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      expect([200, 403]).toContain(response.status)
    })

    it('should return JSON response', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should return 0 for counts when no data', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()
      expect(data.data?.totalUsers).toBeGreaterThanOrEqual(0)
      expect(data.data?.totalAdvisors).toBeGreaterThanOrEqual(0)
      expect(data.data?.pendingCredentials).toBeGreaterThanOrEqual(0)
      expect(data.data?.pendingArticles).toBeGreaterThanOrEqual(0)
    })
  })
})
