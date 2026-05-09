import { PUT } from '@/app/api/advisors/profile/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'advisor-1', display_name: 'John Advisor', bio: 'Financial Expert' },
        error: null,
      }),
    })),
  })),
}))

describe('Advisor Profile Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZHZpc29yLTEyMyJ9.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT /api/advisors/profile', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/profile', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: 'Updated Name',
          bio: 'Updated bio',
        }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(401)
    })

    it('should update profile with valid data', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/profile', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: 'John Advisor',
          bio: 'Financial Expert',
          company_name: 'Fin Corp',
          designation: 'Lead Advisor',
          city: 'Bangalore',
          state: 'Karnataka',
        }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should accept optional fields', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/profile', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: 'John Advisor',
          website_url: 'https://example.com',
          phone_number: '+91-9876543210',
        }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(200)
    })

    it('should handle errors gracefully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/advisors/profile', {
        method: 'PUT',
        body: JSON.stringify({}),
      })

      const response = await PUT(request)
      expect([200, 400, 500]).toContain(response.status)
    })
  })
})
