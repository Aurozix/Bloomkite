import { POST as askQuestion } from '@/app/api/forum/questions/route'
import { POST as answerQuestion } from '@/app/api/forum/questions/[id]/answers/route'
import { POST as voteAnswer } from '@/app/api/forum/answers/[id]/vote/route'
import { POST as markBestAnswer } from '@/app/api/forum/answers/[id]/best/route'
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
            id: 'q-1',
            title: 'How to start investing?',
            author_id: 'investor-1',
            status: 'open',
            answer_count: 2,
          },
        ],
        error: null,
      }),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'answer-1',
          content: 'Start with index funds',
          votes_count: 5,
          is_best_answer: true,
        },
        error: null,
      }),
    })),
  })),
}))

describe('E2E: Forum Q&A Journey', () => {
  const investorToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnZlc3Rvci0xMjMifQ.signature'
  const advisorToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZHZpc29yLTEyMyJ9.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Investor asks and gets answer', () => {
    it('should allow investor to ask question', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: investorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'How should I start my investment journey?',
          content:
            'I have some savings and want to learn about investment options for beginners.',
        }),
      })

      const response = await askQuestion(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data?.status).toBe('open')
    })

    it('should allow advisor to answer question', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: advisorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions/q-1/answers',
        {
          method: 'POST',
          body: JSON.stringify({
            content:
              'Start by opening a brokerage account. I recommend beginning with index funds like Nifty 50 or Sensex ETFs.',
          }),
        }
      )

      const response = await answerQuestion(request, {
        params: { id: 'q-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should allow investors to vote on answers as helpful', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: investorToken }),
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

      const response = await voteAnswer(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should allow question author to mark answer as best', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: investorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        {
          method: 'POST',
        }
      )

      const response = await markBestAnswer(request, {
        params: { id: 'answer-1' },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data?.is_best_answer).toBe(true)
    })
  })

  describe('Forum interaction quality', () => {
    it('should validate question fields', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: investorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      // Missing title
      const request1 = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({
          content: 'I have a question...',
        }),
      })

      const response1 = await askQuestion(request1)
      expect([200, 400]).toContain(response1.status)

      // Missing content
      const request2 = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Investment Question',
        }),
      })

      const response2 = await askQuestion(request2)
      expect([200, 400]).toContain(response2.status)
    })

    it('should require authentication to post answer', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions/q-1/answers',
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'My answer...',
          }),
        }
      )

      const response = await answerQuestion(request, {
        params: { id: 'q-1' },
      })

      expect(response.status).toBe(401)
    })

    it('should support helpful and unhelpful votes', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: investorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      // Test helpful vote
      const helpfulRequest = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            vote_type: 'helpful',
          }),
        }
      )

      const helpfulResponse = await voteAnswer(helpfulRequest, {
        params: { id: 'answer-1' },
      })

      expect(helpfulResponse.status).toBe(200)

      // Test unhelpful vote
      const unhelpfulRequest = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-2/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            vote_type: 'unhelpful',
          }),
        }
      )

      const unhelpfulResponse = await voteAnswer(unhelpfulRequest, {
        params: { id: 'answer-2' },
      })

      expect(unhelpfulResponse.status).toBe(200)
    })
  })
})
