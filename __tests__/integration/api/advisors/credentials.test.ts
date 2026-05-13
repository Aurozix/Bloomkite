import { GET, POST } from '@/app/api/advisors/credentials/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { applySupabaseMock } from '../../../helpers/supabase-mock'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js')

describe('Advisor Credentials Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZHZpc29yLTEyMyJ9.signature'

  const credList = [
    {
      id: 'cred-1',
      credential_type: 'CFA',
      issuer: 'CFA Institute',
      license_number: 'CFA123',
      status: 'pending',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    applySupabaseMock(createClient as jest.Mock, {
      user: { id: 'advisor-123', email: 'advisor@example.com' },
      tableResults: {
        advisor_credentials: { data: credList },
      },
    })
  })

  describe('GET /api/advisors/credentials', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'GET',
      })
      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should return advisor credentials list', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
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
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          credential_type: 'CFA',
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          expiry_date: '2030-01-01',
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should create credential with valid data', async () => {
      applySupabaseMock(createClient as jest.Mock, {
        user: { id: 'advisor-123' },
        tableResults: {
          advisor_credentials: {
            data: {
              id: 'cred-2',
              credential_type: 'CFA',
              issuer: 'CFA Institute',
              license_number: 'CFA123',
              status: 'pending',
            },
          },
        },
      })

      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          credential_type: 'CFA',
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          expiry_date: '2030-01-01',
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data?.status).toBe('pending')
    })

    it('should validate required credential fields', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/credentials', {
        method: 'POST',
        body: JSON.stringify({
          issuer: 'CFA Institute',
          license_number: 'CFA123',
          expiry_date: '2030-01-01',
          // missing credential_type
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
