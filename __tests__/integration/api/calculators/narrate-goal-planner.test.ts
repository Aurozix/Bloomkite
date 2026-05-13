import { NextRequest } from 'next/server'

// All mocks must be registered before the route imports them, hence the
// imports below the jest.mock calls.

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/ai-features', () => ({
  isAIFeatureEnabled: jest.fn(),
}))

jest.mock('@/lib/ai/client', () => {
  const actual = jest.requireActual('@/lib/ai/client')
  return {
    ...actual,
    narrate: jest.fn(),
  }
})

import { POST } from '@/app/api/calculators/goal-planner/narrate/route'
import { requireAuth } from '@/lib/auth-helpers'
import { isAIFeatureEnabled } from '@/lib/ai-features'
import { narrate, AINarratorUnavailableError } from '@/lib/ai/client'

const mockedRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockedIsEnabled = isAIFeatureEnabled as jest.MockedFunction<typeof isAIFeatureEnabled>
const mockedNarrate = narrate as jest.MockedFunction<typeof narrate>

const goodAuth = { user: { id: 'u-1', email: 'u@example.com', roles: ['investor'] } }

const goodInputs = {
  goalAmount: 5_000_000,
  currentAmount: 1_000_000,
  tenure: 10,
  tenureType: 'YEAR',
  inflationRate: 5,
  growthRate: 8,
  annualInvestmentRate: 10,
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/calculators/goal-planner/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/calculators/goal-planner/narrate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedRequireAuth.mockResolvedValue(goodAuth)
  })

  describe('gate ordering', () => {
    it('returns 401 when unauthenticated (and never checks the flag)', async () => {
      mockedRequireAuth.mockResolvedValue({
        // requireAuth returns { error: NextResponse } — we don't exercise the
        // exact body here, just confirm the route short-circuits.
        error: new Response('Unauthorized', { status: 401 }) as never,
      })
      const res = await POST(makeRequest({ inputs: goodInputs }))
      expect(res.status).toBe(401)
      expect(mockedIsEnabled).not.toHaveBeenCalled()
    })

    it('returns 404 when the feature flag is off (route appears absent)', async () => {
      mockedIsEnabled.mockResolvedValue(false)
      const res = await POST(makeRequest({ inputs: goodInputs }))
      expect(res.status).toBe(404)
      expect(mockedNarrate).not.toHaveBeenCalled()
    })

    it('returns 400 on invalid JSON body when flag is on', async () => {
      mockedIsEnabled.mockResolvedValue(true)
      const req = new NextRequest('http://localhost:3000/api/calculators/goal-planner/narrate', {
        method: 'POST',
        body: 'not-json',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(mockedNarrate).not.toHaveBeenCalled()
    })

    it('returns 400 on missing inputs object', async () => {
      mockedIsEnabled.mockResolvedValue(true)
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
    })

    it('returns 400 when a numeric input is out of range', async () => {
      mockedIsEnabled.mockResolvedValue(true)
      const res = await POST(makeRequest({ inputs: { ...goodInputs, inflationRate: 99 } }))
      expect(res.status).toBe(400)
      expect(mockedNarrate).not.toHaveBeenCalled()
    })

    it('returns 400 when tenureType is invalid', async () => {
      mockedIsEnabled.mockResolvedValue(true)
      const res = await POST(makeRequest({ inputs: { ...goodInputs, tenureType: 'WEEK' } }))
      expect(res.status).toBe(400)
    })
  })

  describe('LLM call path', () => {
    beforeEach(() => {
      mockedIsEnabled.mockResolvedValue(true)
    })

    it('returns 503 when the narrator reports no API key', async () => {
      mockedNarrate.mockRejectedValue(new AINarratorUnavailableError('no_api_key', 'missing'))
      const res = await POST(makeRequest({ inputs: goodInputs }))
      expect(res.status).toBe(503)
    })

    it('returns 502 when the upstream Anthropic call fails', async () => {
      mockedNarrate.mockRejectedValue(
        new AINarratorUnavailableError('upstream_error', 'boom'),
      )
      const res = await POST(makeRequest({ inputs: goodInputs }))
      expect(res.status).toBe(502)
    })

    it('returns 200 with the narration string on success', async () => {
      mockedNarrate.mockResolvedValue({
        narration: 'A compliant three-sentence summary.',
        model: 'claude-haiku-4-5-20251001',
        usage: { input_tokens: 50, output_tokens: 30 },
      })
      const res = await POST(makeRequest({ inputs: goodInputs }))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.narration).toBe('A compliant three-sentence summary.')
    })

    it('passes a prompt that includes the verbatim calculator-output numbers', async () => {
      mockedNarrate.mockResolvedValue({
        narration: 'ok',
        model: 'claude-haiku-4-5-20251001',
        usage: { input_tokens: 1, output_tokens: 1 },
      })
      await POST(makeRequest({ inputs: goodInputs }))
      expect(mockedNarrate).toHaveBeenCalledTimes(1)
      const promptArg = mockedNarrate.mock.calls[0][0].userPrompt
      // Server re-computes the result; the verbatim numbers must appear in
      // the prompt so the LLM can't accidentally derive them.
      expect(promptArg).toMatch(/Future cost.*₹/)
      expect(promptArg).toMatch(/Required monthly investment.*₹/)
      // Inputs echoed too — gives the LLM context for "why" each number.
      expect(promptArg).toMatch(/Goal amount today.*5,?0?0?,?0?0?,?000/)
    })

    it('short-circuits the LLM for degenerate inputs (goal already met)', async () => {
      // Huge current savings → server computes finalCorpus = 0; the route
      // returns a canned compliant message without invoking the LLM at all.
      const res = await POST(
        makeRequest({
          inputs: {
            ...goodInputs,
            goalAmount: 1000,
            currentAmount: 10_000_000,
          },
        }),
      )
      expect(res.status).toBe(200)
      expect(mockedNarrate).not.toHaveBeenCalled()
      const data = await res.json()
      expect(data.degenerate).toBe(true)
      expect(data.narration).toContain('already cover')
    })
  })
})
