import { GET, POST } from '@/app/api/articles/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { applySupabaseMock } from '../../../helpers/supabase-mock'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js')

describe('Articles Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRob3ItMTIzIn0.signature'

  beforeEach(() => {
    jest.clearAllMocks()
    applySupabaseMock(createClient as jest.Mock, {
      tableResults: {
        articles: {
          data: [
            {
              id: 'article-1',
              title: 'Financial Planning 101',
              author_id: 'author-1',
              status: 'published',
              created_at: '2026-05-08',
            },
          ],
          count: 1,
        },
      },
    })
  })

  describe('GET /api/articles', () => {
    it('should return published articles list without auth', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'GET',
      })
      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should support pagination with page and limit', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/articles?page=1&limit=10',
        { method: 'GET' }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should filter by category', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/articles?category=investing',
        { method: 'GET' }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/articles', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Article',
          content: '# Article content',
          category: 'investing',
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should create draft article with valid data', async () => {
      applySupabaseMock(createClient as jest.Mock, {
        tableResults: {
          articles: {
            data: {
              id: 'article-new',
              title: 'Financial Planning Guide',
              status: 'draft',
            },
          },
        },
      })

      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Financial Planning Guide',
          content: '# Planning Your Future\n\nThis is important...',
          category: 'planning',
          tags: ['investing', 'planning'],
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data?.status).toBe('draft')
    })

    it('should validate required article fields', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      // Missing content
      const request1 = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({ title: 'My Article', category: 'investing' }),
      })
      const response1 = await POST(request1)
      expect(response1.status).toBe(400)

      // Missing title
      const request2 = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({ content: 'Content here', category: 'investing' }),
      })
      const response2 = await POST(request2)
      expect(response2.status).toBe(400)
    })
  })
})
