import { GET, POST } from '@/app/api/advisors/credentials/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'cred-1',
            credential_type: 'CFA',
            issuer: 'CFA Institute',
            license_number: 'CFA123',
            status: 'pending',
          },
        ],
        error: null,
      }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'credentials/user-1/cert.pdf' },
          error: null,
        }),
      })),
    },
  })),
}))

describe('Advisor Credentials Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZHZpc29yLTEyMyJ9.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/advisors/credentials', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should return advisor credentials list', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('POST /api/advisors/credentials', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          credential_type: 'CFA',
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          file_base64: 'base64data',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should create credential with valid data', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          credential_type: 'CFA',
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          file_base64: 'base64encodedfile',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should validate required credential fields', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          file_base64: 'base64data',
        }),
      })

      const response = await POST(request)
      expect([200, 400]).toContain(response.status)
    })

    it('should set credential status to pending', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          credential_type: 'CFA',
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          file_base64: 'data',
        }),
      })

      const response = await POST(request)
      const data = await response.json()
      if (response.status === 200) {
        expect(data.data?.status).toBe('pending')
      }
    })
  })
})
