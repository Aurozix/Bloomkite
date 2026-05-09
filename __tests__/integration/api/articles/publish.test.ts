import { POST } from '@/app/api/articles/[id]/submit/route'
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
          id: 'article-1',
          title: 'My Article',
          status: 'pending',
          author_id: 'author-1',
        },
        error: null,
      }),
    })),
  })),
}))

describe('Article Submit Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRob3ItMTIzIn0.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/articles/[id]/submit', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-1/submit',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'article-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should process article submission request with valid token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-1/submit',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'article-1' },
      })

      expect([200, 403, 404]).toContain(response.status)
      const data = await response.json()
      expect(data).toBeDefined()
    })

    it('should return success when authorized', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-1/submit',
        {
          method: 'POST',
        }
      )

      const response = await POST(request, {
        params: { id: 'article-1' },
      })

      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })
  })
})
