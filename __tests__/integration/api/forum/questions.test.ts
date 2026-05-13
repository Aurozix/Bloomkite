import { GET, POST } from '@/app/api/forum/questions/route'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { applySupabaseMock } from '../../../helpers/supabase-mock'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/supabase-js')

describe('Forum Questions Route', () => {
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnZlc3Rvci0xMjMifQ.signature'

  beforeEach(() => {
    jest.clearAllMocks()
    applySupabaseMock(createClient as jest.Mock, {
      tableResults: {
        forum_questions: {
          data: [
            {
              id: 'q-1',
              title: 'How to start investing?',
              author_id: 'investor-1',
              status: 'open',
              answer_count: 2,
              created_at: '2026-05-08',
            },
          ],
          count: 1,
        },
      },
    })
  })

  describe('GET /api/forum/questions', () => {
    it('should return questions list without authentication', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'GET',
      })
      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should support pagination', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions?page=1&limit=10',
        { method: 'GET' }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should support keyword search', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest(
        'http://localhost:3000/api/forum/questions?search=investing',
        { method: 'GET' }
      )
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should include answer count in results', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'GET',
      })
      const response = await GET(request)
      const data = await response.json()
      if (data.data.length > 0) {
        expect(typeof data.data[0].answer_count).toBe('number')
      }
    })
  })

  describe('POST /api/forum/questions', () => {
    it('should return 401 when no access token', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue(undefined) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'How to invest?',
          content: 'I want to start investing...',
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should create question with valid data', async () => {
      applySupabaseMock(createClient as jest.Mock, {
        tableResults: {
          forum_questions: {
            data: {
              id: 'q-new',
              title: 'How to start investing?',
              status: 'open',
              answer_count: 0,
            },
          },
        },
      })

      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'How to start investing?',
          content: 'I have some savings and want to learn about investing.',
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should validate required question fields', async () => {
      const mockCookies = { get: jest.fn().mockReturnValue({ value: mockToken }) }
      ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

      // Missing title
      const request1 = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({ content: 'Content here' }),
      })
      const response1 = await POST(request1)
      expect(response1.status).toBe(400)

      // Missing content
      const request2 = new NextRequest('http://localhost:3000/api/forum/questions', {
        method: 'POST',
        body: JSON.stringify({ title: 'My Question' }),
      })
      const response2 = await POST(request2)
      expect(response2.status).toBe(400)
    })
  })
})
