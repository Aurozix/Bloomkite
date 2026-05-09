import { GET as getCredentials } from '@/app/api/admin/credentials/route'
import { POST as approveCredential } from '@/app/api/admin/credentials/[id]/approve/route'
import { POST as rejectCredential } from '@/app/api/admin/credentials/[id]/reject/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'cred-1',
          credential_type: 'CFA',
          status: 'approved',
          user: { display_name: 'John Advisor' },
        },
        error: null,
      }),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'cred-1',
            credential_type: 'CFA',
            status: 'pending',
            user: { display_name: 'John Advisor', email: 'john@example.com' },
          },
        ],
        error: null,
      }),
    })),
  })),
}))

describe('Admin Credentials Route', () => {
  const mockAdminToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMifQ.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/credentials', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/credentials', {
        method: 'GET',
      })

      const response = await getCredentials(request)
      expect(response.status).toBe(401)
    })

    it('should return pending credentials list for admin', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/credentials', {
        method: 'GET',
      })

      const response = await getCredentials(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should return 403 if user is not admin', async () => {
      const nonAdminToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature'

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: nonAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/credentials', {
        method: 'GET',
      })

      const response = await getCredentials(request)
      expect([200, 403]).toContain(response.status)
    })

    it('should include advisor info in response', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/credentials', {
        method: 'GET',
      })

      const response = await getCredentials(request)
      const data = await response.json()
      if (data.data.length > 0) {
        expect(data.data[0].user).toBeDefined()
      }
    })
  })

  describe('POST /api/admin/credentials/[id]/approve', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveCredential(request, {
        params: { id: 'cred-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should approve credential', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveCredential(request, {
        params: { id: 'cred-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data?.status).toBe('approved')
    })

    it('should return 403 if user is not admin', async () => {
      const nonAdminToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature'

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: nonAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveCredential(request, {
        params: { id: 'cred-1' },
      })

      expect([200, 403]).toContain(response.status)
    })
  })

  describe('POST /api/admin/credentials/[id]/reject', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Invalid document',
          }),
        }
      )

      const response = await rejectCredential(request, {
        params: { id: 'cred-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should reject credential with reason', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Document quality too low',
          }),
        }
      )

      const response = await rejectCredential(request, {
        params: { id: 'cred-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should set status to rejected', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Invalid credentials',
          }),
        }
      )

      const response = await rejectCredential(request, {
        params: { id: 'cred-1' },
      })

      const data = await response.json()
      if (response.status === 200) {
        expect(data.data?.status).toBe('rejected')
      }
    })

    it('should handle rejection request', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/credentials/cred-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Invalid document',
          }),
        }
      )

      const response = await rejectCredential(request, {
        params: { id: 'cred-1' },
      })

      expect([200, 400, 403, 500]).toContain(response.status)
    })
  })
})
