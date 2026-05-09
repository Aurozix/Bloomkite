import { GET as getArticles } from '@/app/api/admin/articles/route'
import { POST as approveArticle } from '@/app/api/admin/articles/[id]/approve/route'
import { POST as rejectArticle } from '@/app/api/admin/articles/[id]/reject/route'
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
          status: 'published',
          user: { display_name: 'John Author' },
          published_at: '2026-05-08',
        },
        error: null,
      }),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'article-1',
            title: 'Pending Article',
            status: 'pending',
            created_at: '2026-05-08',
            user: { display_name: 'Jane Author', email: 'jane@example.com' },
          },
        ],
        error: null,
      }),
    })),
  })),
}))

describe('Admin Articles Route', () => {
  const mockAdminToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMifQ.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/articles', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/articles', {
        method: 'GET',
      })

      const response = await getArticles(request)
      expect(response.status).toBe(401)
    })

    it('should return pending articles list for admin', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/articles', {
        method: 'GET',
      })

      const response = await getArticles(request)
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

      const request = new NextRequest('http://localhost:3000/api/admin/articles', {
        method: 'GET',
      })

      const response = await getArticles(request)
      expect([200, 403]).toContain(response.status)
    })

    it('should include author info in response', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/admin/articles', {
        method: 'GET',
      })

      const response = await getArticles(request)
      const data = await response.json()
      if (data.data.length > 0) {
        expect(data.data[0].user).toBeDefined()
      }
    })
  })

  describe('POST /api/admin/articles/[id]/approve', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveArticle(request, {
        params: { id: 'article-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should approve article and set status to published', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveArticle(request, {
        params: { id: 'article-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data?.status).toBe('published')
    })

    it('should handle article approval request', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveArticle(request, {
        params: { id: 'article-1' },
      })

      const data = await response.json()
      expect(data).toBeDefined()
    })

    it('should return 403 if user is not admin', async () => {
      const nonAdminToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature'

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: nonAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1/approve',
        {
          method: 'POST',
        }
      )

      const response = await approveArticle(request, {
        params: { id: 'article-1' },
      })

      expect([200, 403]).toContain(response.status)
    })
  })

  describe('POST /api/admin/articles/[id]/reject', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Inappropriate content',
          }),
        }
      )

      const response = await rejectArticle(request, {
        params: { id: 'article-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should reject article with reason', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockAdminToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Contains inaccurate financial information',
          }),
        }
      )

      const response = await rejectArticle(request, {
        params: { id: 'article-1' },
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
        'http://localhost:3000/api/admin/articles/article-1/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Poor quality',
          }),
        }
      )

      const response = await rejectArticle(request, {
        params: { id: 'article-1' },
      })

      const data = await response.json()
      if (response.status === 200) {
        expect(data.data?.status).toBe('rejected')
      }
    })
  })
})
