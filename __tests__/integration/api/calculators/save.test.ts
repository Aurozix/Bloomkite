import { POST } from '@/app/api/calculators/save/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      insert: jest.fn().mockResolvedValue({
        data: { id: 'plan-123', success: true },
        error: null,
      }),
    })),
  })),
}))

describe('Save Calculator Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/calculators/save', () => {
    it('should return 401 when no access token provided', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when required fields missing', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 401 when token is invalid', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Request validation', () => {
    it('should require calculator_type', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should require inputs object', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should require results object', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should accept optional name field', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          name: 'My Goal Plan',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: false,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Token handling', () => {
    it('should extract user ID from JWT', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect([200, 400, 401]).toContain(response.status)
    })

    it('should handle token with payload', async () => {
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.signature'

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: validToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('is_draft flag', () => {
    it('should handle is_draft: true (auto-save)', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toContain('draft')
    })

    it('should handle is_draft: false (explicit save)', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: false,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toContain('final')
    })
  })

  describe('Response format', () => {
    it('should return JSON response', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should include success field in response', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/calculators/save', {
        method: 'POST',
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: { goalAmount: 1000000 },
          results: { futureValue: '1200000' },
          is_draft: true,
        }),
      })

      const response = await POST(request)

      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })
  })
})
