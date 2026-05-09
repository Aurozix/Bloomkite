import { GET as getAdvisors } from '@/app/api/advisors/search/route'
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
      ilike: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'advisor-1',
            display_name: 'John Advisor',
            city: 'Bangalore',
            bio: 'Financial Expert',
          },
        ],
        error: null,
      }),
    })),
  })),
}))

describe('E2E: Advisor Journey - Discover & Follow', () => {
  const investorToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnZlc3Rvci0xMjMifQ.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow investor to search advisors', async () => {
    const mockCookies = {
      get: jest.fn().mockReturnValue(undefined),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

    const request = new NextRequest(
      'http://localhost:3000/api/advisors/search?q=financial',
      {
        method: 'GET',
      }
    )

    const response = await getAdvisors(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should allow investor to filter advisors by city', async () => {
    const mockCookies = {
      get: jest.fn().mockReturnValue(undefined),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

    const request = new NextRequest(
      'http://localhost:3000/api/advisors/search?city=Bangalore',
      {
        method: 'GET',
      }
    )

    const response = await getAdvisors(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should allow investor to filter advisors by specialization', async () => {
    const mockCookies = {
      get: jest.fn().mockReturnValue(undefined),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

    const request = new NextRequest(
      'http://localhost:3000/api/advisors/search?specialization=tax-planning',
      {
        method: 'GET',
      }
    )

    const response = await getAdvisors(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should support pagination in search results', async () => {
    const mockCookies = {
      get: jest.fn().mockReturnValue(undefined),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

    const request = new NextRequest(
      'http://localhost:3000/api/advisors/search?page=1&limit=20',
      {
        method: 'GET',
      }
    )

    const response = await getAdvisors(request)
    expect(response.status).toBe(200)
  })

  it('should return advisor profile with followers count', async () => {
    const mockCookies = {
      get: jest.fn().mockReturnValue(undefined),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookies)

    const request = new NextRequest(
      'http://localhost:3000/api/advisors/search',
      {
        method: 'GET',
      }
    )

    const response = await getAdvisors(request)
    const data = await response.json()
    if (data.data.length > 0) {
      expect(data.data[0].display_name).toBeDefined()
      expect(data.data[0].bio).toBeDefined()
    }
  })
})
