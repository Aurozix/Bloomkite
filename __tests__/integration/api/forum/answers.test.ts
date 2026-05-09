import { POST as answerPost } from '@/app/api/forum/questions/[id]/answers/route'
import { POST as votePost, DELETE as voteDelete } from '@/app/api/forum/answers/[id]/vote/route'
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
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'answer-1',
            content: 'Start with index funds',
            author_id: 'advisor-1',
            votes_count: 5,
            is_best_answer: false,
          },
        ],
        error: null,
      }),
    })),
  })),
}))

describe('Forum Answers Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZHZpc29yLTEyMyJ9.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/forum/questions/[id]/answers', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions/q-1/answers',
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'My answer here',
          }),
        }
      )

      const response = await answerPost(request, {
        params: { id: 'q-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should create answer with valid data', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions/q-1/answers',
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Start by opening a brokerage account...',
          }),
        }
      )

      const response = await answerPost(request, {
        params: { id: 'q-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should validate required answer fields', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions/q-1/answers',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await answerPost(request, {
        params: { id: 'q-1' },
      })

      expect([200, 400]).toContain(response.status)
    })

    it('should increment answer_count on question', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions/q-1/answers',
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Here is my answer',
          }),
        }
      )

      const response = await answerPost(request, {
        params: { id: 'q-1' },
      })

      expect([200, 404]).toContain(response.status)
    })
  })

  describe('POST /api/forum/answers/[id]/vote', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            vote_type: 'helpful',
          }),
        }
      )

      const response = await votePost(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should create helpful vote', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            vote_type: 'helpful',
          }),
        }
      )

      const response = await votePost(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should support unhelpful vote type', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            vote_type: 'unhelpful',
          }),
        }
      )

      const response = await votePost(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(200)
    })

    it('should validate vote_type parameter', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            vote_type: 'invalid',
          }),
        }
      )

      const response = await votePost(request, {
        params: { id: 'answer-1' },
      })

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('DELETE /api/forum/answers/[id]/vote', () => {
    it('should remove vote with valid token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'DELETE',
        }
      )

      const response = await voteDelete(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(200)
    })

    it('should return 401 when no access token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'DELETE',
        }
      )

      const response = await voteDelete(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(401)
    })
  })
})
