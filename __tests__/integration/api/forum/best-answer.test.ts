import { POST } from '@/app/api/forum/answers/[id]/best/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { applySupabaseMock } from '../../../helpers/supabase-mock'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js')

describe('Forum Best Answer Route', () => {
  // sub = "question-author-123"
  const questionAuthorToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJxdWVzdGlvbi1hdXRob3ItMTIzIn0.signature'

  beforeEach(() => {
    jest.clearAllMocks()
    applySupabaseMock(createClient as jest.Mock, {
      tableResults: {
        forum_answers: { data: { question_id: 'q-1', id: 'answer-1' } },
        forum_questions: {
          data: { author_id: 'question-author-123', id: 'q-1' },
        },
      },
    })
  })

  describe('POST /api/forum/answers/[id]/best', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        { method: 'POST' }
      )
      const response = await POST(request, { params: { id: 'answer-1' } })
      expect(response.status).toBe(401)
    })

    it('should mark answer as best when caller is question author', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: questionAuthorToken }),
      }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        { method: 'POST' }
      )
      const response = await POST(request, { params: { id: 'answer-1' } })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should return 403 when caller is not question author', async () => {
      applySupabaseMock(createClient as jest.Mock, {
        tableResults: {
          forum_answers: { data: { question_id: 'q-1', id: 'answer-1' } },
          forum_questions: {
            data: { author_id: 'some-other-author', id: 'q-1' },
          },
        },
      })

      const otherUserToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvdGhlci11c2VyIn0.signature'
      const mockCookies = { get: jest.fn().mockReturnValue({ value: otherUserToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/answers/answer-1/best',
        { method: 'POST' }
      )
      const response = await POST(request, { params: { id: 'answer-1' } })
      expect(response.status).toBe(403)
    })
  })
})
