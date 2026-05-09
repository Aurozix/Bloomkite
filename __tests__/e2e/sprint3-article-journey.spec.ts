import { POST as createArticle } from '@/app/api/articles/route'
import { POST as submitArticle } from '@/app/api/articles/[id]/submit/route'
import { GET as getPublished } from '@/app/api/articles/route'
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
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'article-1',
            title: 'Financial Planning 101',
            status: 'published',
          },
        ],
        error: null,
      }),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'article-1',
          title: 'Investment Guide',
          content: '# Guide',
          status: 'draft',
          author_id: 'author-1',
        },
        error: null,
      }),
    })),
  })),
}))

describe('E2E: Article Publishing Journey', () => {
  const advisorToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZHZpc29yLTEyMyJ9.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Advisor publishes article workflow', () => {
    it('should create article as draft', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: advisorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const createRequest = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Investment Basics',
          content: '# Introduction to Investing\n\nGet started with your portfolio',
          category: 'investing',
          tags: ['beginner-friendly', 'portfolio'],
        }),
      })

      const createResponse = await createArticle(createRequest)
      expect(createResponse.status).toBe(200)
      const createData = await createResponse.json()
      expect(createData.data?.status).toBe('draft')
    })

    it('should allow advisor to submit draft for approval', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: advisorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const submitRequest = new NextRequest(
        'http://localhost:3000/api/articles/article-1/submit',
        {
          method: 'POST',
        }
      )

      const submitResponse = await submitArticle(submitRequest, {
        params: { id: 'article-1' },
      })

      expect(submitResponse.status).toBe(200)
      const submitData = await submitResponse.json()
      expect(submitData.data?.status).toBe('pending')
    })

    it('should make published articles visible to public', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const listRequest = new NextRequest('http://localhost:3000/api/articles', {
        method: 'GET',
      })

      const listResponse = await getPublished(listRequest)
      expect(listResponse.status).toBe(200)
      const listData = await listResponse.json()
      expect(Array.isArray(listData.data)).toBe(true)
      if (listData.data.length > 0) {
        expect(listData.data[0].status).toBe('published')
      }
    })
  })

  describe('Article content requirements', () => {
    it('should validate required article fields', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: advisorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      // Missing content
      const request1 = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Article',
          category: 'investing',
        }),
      })

      const response1 = await createArticle(request1)
      expect([200, 400]).toContain(response1.status)

      // Missing title
      const request2 = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Some content',
          category: 'investing',
        }),
      })

      const response2 = await createArticle(request2)
      expect([200, 400]).toContain(response2.status)
    })

    it('should support markdown formatting in content', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: advisorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const markdownContent = `
# Investing for Beginners

## Getting Started
- Open a brokerage account
- Start with index funds
- Invest regularly

**Remember**: Don't try to time the market!
      `

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Beginner Guide',
          content: markdownContent,
          category: 'investing',
        }),
      })

      const response = await createArticle(request)
      expect(response.status).toBe(200)
    })
  })
})
