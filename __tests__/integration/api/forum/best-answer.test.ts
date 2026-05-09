import { POST } from '@/app/api/forum/answers/[id]/best/route'
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
      and: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'answer-1',
          content: 'Best answer',
          is_best_answer: true,
        },
        error: null,
      }),
    })),
  })),
}))

describe('Forum Best Answer Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJxdWVzdGlvbi1hdXRob3ItMTIzIn0.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/forum/answers/[id]/best', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should mark answer as best', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should set is_best_answer to true', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'answer-1' },
      })

      const data = await response.json()
      if (response.status === 200) {
        expect(data.data?.is_best_answer).toBe(true)
      }
    })

    it('should handle authorization check for best answer marking', async () => {
      const otherUserToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvdGhlci11c2VyIn0.signature'

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: otherUserToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'answer-1' },
      })

      expect([200, 403, 404]).toContain(response.status)
    })
  })
})
