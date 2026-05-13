import { GET } from '@/app/api/admin/stats/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { applySupabaseMock } from '../../../helpers/supabase-mock'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js')

describe('Admin Stats Route', () => {
  const mockAdminToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMifQ.signature'

  beforeEach(() => {
    jest.clearAllMocks()
    applySupabaseMock(createClient as jest.Mock, {
      tableResults: {
        user_roles: { data: [{ role: { name: 'admin' } }] },
        users: { count: 100, data: null },
        advisor_profiles: { count: 50, data: null },
        advisor_credentials: { count: 5, data: null },
        articles: { count: 2, data: null },
      },
    })
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

      // Override user_roles to be non-admin for this test
      applySupabaseMock(createClient as jest.Mock, {
        tableResults: {
          user_roles: { data: [{ role: { name: 'investor' } }] },
        },
      })

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: nonAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(403)
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
      applySupabaseMock(createClient as jest.Mock, {
        tableResults: {
          user_roles: { data: [{ role: { name: 'admin' } }] },
          users: { count: 0, data: null },
          advisor_profiles: { count: 0, data: null },
          advisor_credentials: { count: 0, data: null },
          articles: { count: 0, data: null },
        },
      })

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
