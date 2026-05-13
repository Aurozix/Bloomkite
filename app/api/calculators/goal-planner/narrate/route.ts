import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { isAIFeatureEnabled } from '@/lib/ai-features'
import { calculateGoalPlan } from '@/lib/calculators/goalPlanner'
import { GoalPlannerInput, GoalPlannerTenureType } from '@/lib/calculators/types'
import { AINarratorUnavailableError, narrate } from '@/lib/ai/client'

const FEATURE_SLUG = 'calc-narration-goal-planner'

interface NarrateRequestBody {
  inputs: {
    goalAmount: number
    currentAmount: number
    tenure: number
    tenureType: string
    inflationRate: number
    growthRate: number
    annualInvestmentRate: number
  }
}

// Validates the client-supplied inputs to (a) reject malformed payloads early
// and (b) prevent prompt injection via out-of-range / non-numeric fields.
// Range bounds mirror Calculators_Requirements.md §1.2 / §1.5.
function validateInputs(raw: NarrateRequestBody['inputs']): GoalPlannerInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'inputs missing' }

  const num = (v: unknown, name: string, min: number, max: number) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return `${name} must be a number`
    if (v < min || v > max) return `${name} must be between ${min} and ${max}`
    return null
  }

  const tenureType: GoalPlannerTenureType =
    raw.tenureType === 'MONTH' ? 'MONTH' : raw.tenureType === 'YEAR' ? 'YEAR' : ('INVALID' as never)
  if (tenureType === ('INVALID' as never)) return { error: 'tenureType must be MONTH or YEAR' }

  const maxTenure = tenureType === 'YEAR' ? 60 : 720

  const errors = [
    num(raw.goalAmount, 'goalAmount', 1, 1e12),
    num(raw.currentAmount, 'currentAmount', 0, 1e12),
    num(raw.tenure, 'tenure', 1, maxTenure),
    num(raw.inflationRate, 'inflationRate', 0, 20),
    num(raw.growthRate, 'growthRate', 0, 30),
    num(raw.annualInvestmentRate, 'annualInvestmentRate', 0, 30),
  ].filter(Boolean)

  if (errors.length > 0) return { error: errors.join('; ') }

  return {
    goalAmount: raw.goalAmount,
    currentAmount: raw.currentAmount,
    tenure: raw.tenure,
    tenureType,
    inflationRate: raw.inflationRate,
    growthRate: raw.growthRate,
    annualInvestmentRate: raw.annualInvestmentRate,
  }
}

// Builds a structured-text user prompt for the narrator. All numbers come
// from the server-side recompute, not the client — the client never gets to
// poison the prompt with arbitrary "result" strings.
function buildUserPrompt(inp: GoalPlannerInput, result: ReturnType<typeof calculateGoalPlan>) {
  const tenureUnit = inp.tenureType === 'YEAR' ? 'years' : 'months'
  const monthlyPct = (parseFloat(result.rateOfReturn) * 100).toFixed(3)

  return [
    `Calculator: Goal Planner`,
    ``,
    `Investor inputs:`,
    `- Goal amount today: ₹${inp.goalAmount.toLocaleString('en-IN')}`,
    `- Current savings: ₹${inp.currentAmount.toLocaleString('en-IN')}`,
    `- Tenure: ${inp.tenure} ${tenureUnit}`,
    `- Assumed inflation on the goal: ${inp.inflationRate}% per year`,
    `- Assumed growth on current savings: ${inp.growthRate}% per year`,
    `- Assumed return on new monthly investments: ${inp.annualInvestmentRate}% per year`,
    ``,
    `Calculator output (use these numbers verbatim — do not compute new ones):`,
    `- Future cost of the goal after the tenure: ₹${result.futureCost}`,
    `- Current savings grown over the tenure: ₹${result.futureValue}`,
    `- Gap to fill with new monthly investments: ₹${result.finalCorpus}`,
    `- Required monthly investment: ₹${result.monthlyInv}`,
    `- Required annual investment equivalent: ₹${result.annualInv}`,
    `- Monthly rate used in the calculation: ${monthlyPct}%`,
    ``,
    `Write the 2-3 sentence summary now.`,
  ].join('\n')
}

export async function POST(request: NextRequest) {
  // Order: auth → flag → key → validate. Each layer fails closed without
  // revealing more than it has to.

  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const flagOn = await isAIFeatureEnabled(FEATURE_SLUG)
  if (!flagOn) {
    // 404 not 403 — when the feature is off, the route should appear absent
    // to clients. Surface admins flip it in /admin/ai-features.
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: NarrateRequestBody
  try {
    body = (await request.json()) as NarrateRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validated = validateInputs(body.inputs)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  // Re-compute server-side. Defense against prompt injection via crafted
  // "result" strings, and a free correctness check on the client's compute.
  const result = calculateGoalPlan(validated)

  // Don't narrate degenerate cases — when the gap is zero (goal already met
  // by current savings) or monthly investment is zero, the deterministic UI
  // is sufficient and the LLM has nothing useful to add.
  if (parseFloat(result.finalCorpus) <= 0 || parseFloat(result.monthlyInv) <= 0) {
    return NextResponse.json({
      narration:
        'Your current savings already cover the inflation-adjusted goal at the rates you supplied. No new monthly investment is required.',
      degenerate: true,
    })
  }

  const userPrompt = buildUserPrompt(validated, result)

  try {
    const out = await narrate({ userPrompt })
    return NextResponse.json({
      narration: out.narration,
      model: out.model,
      usage: out.usage,
    })
  } catch (err) {
    if (err instanceof AINarratorUnavailableError) {
      if (err.code === 'no_api_key') {
        console.warn(`[narrate] ${FEATURE_SLUG}: ANTHROPIC_API_KEY missing`)
        return NextResponse.json({ error: 'Narrator unavailable' }, { status: 503 })
      }
      console.error(`[narrate] ${FEATURE_SLUG}: ${err.code}: ${err.message}`)
      return NextResponse.json({ error: 'Narrator unavailable' }, { status: 502 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[narrate] ${FEATURE_SLUG}: unexpected error: ${message}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
