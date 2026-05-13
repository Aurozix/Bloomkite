// Anthropic Claude client + shared narrator helper.
//
// All calculator narrators route through `narrate()` here so the brand-voice
// guardrails (no "AI-powered" copy, no advice, no number derivation) live in
// one place. Per-calculator routes only contribute the structured inputs and
// the calculator-specific user prompt; the system prompt is a constant.
//
// Defaults to Haiku (cheapest, fastest, sufficient for ≤3-sentence narration)
// per Bloomkite's model-selection guidance in CLAUDE.md.

import Anthropic from '@anthropic-ai/sdk'

// The hard-rule system prompt — same for every calculator-narration call. If
// you find yourself wanting to relax any of these in a per-call override,
// don't. Open a compliance ticket instead.
const SYSTEM_PROMPT = `You are a financial educator writing for Bloomkite, an Indian advisor-discovery platform. Your job: take the structured output of a financial calculator and write a short plain-English summary so a user understands what the numbers mean.

Voice rules (strict):
- Three words: Authoritative, Plain, Considered.
- Forbidden words and phrases: "AI-powered", "revolutionary", "unlock", "potential", "transform", "journey", "dreams", "harness", "leverage".
- No exclamation points.
- Second person ("you"), present tense.

Compliance rules (strict — violations are unsafe):
- Bloomkite is not a SEBI-registered investment advisor and neither are you.
- Never recommend a specific action, product, asset class, fund, broker, or strategy.
- Never predict outcomes, probabilities, or returns.
- Never describe a figure as "good", "bad", "high", "low", "safe", or "risky".
- The numbers provided in the user message are the only numbers you may use. Do not compute, derive, average, round, or estimate any new number.

Format rules:
- Two or three sentences. No more.
- Plain prose. No headers, no bullets, no markdown.
- Highlight the figure most likely to surprise the user — typically the inflation gap, the size of the monthly commitment, or how little the current balance contributes.

If you cannot write a compliant summary for any reason, respond with exactly: "No summary available."`

interface NarrateOptions {
  // Calculator-specific user prompt. Should contain the structured inputs +
  // results in plain text. The system prompt above is added automatically.
  userPrompt: string
  // Tight cap. Three sentences fit comfortably in ~120 tokens.
  maxTokens?: number
}

export interface NarrateResult {
  narration: string
  // Wire trace for observability — caller decides whether to log.
  model: string
  usage: { input_tokens: number; output_tokens: number }
}

export class AINarratorUnavailableError extends Error {
  readonly code: 'no_api_key' | 'upstream_error' | 'empty_response'
  constructor(code: 'no_api_key' | 'upstream_error' | 'empty_response', message: string) {
    super(message)
    this.name = 'AINarratorUnavailableError'
    this.code = code
  }
}

const MODEL_ID = 'claude-haiku-4-5-20251001'

export async function narrate(options: NarrateOptions): Promise<NarrateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new AINarratorUnavailableError(
      'no_api_key',
      'ANTHROPIC_API_KEY is not set; narration is unavailable.',
    )
  }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: options.maxTokens ?? 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: options.userPrompt }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    throw new AINarratorUnavailableError('upstream_error', `Anthropic call failed: ${message}`)
  }

  // Concatenate text blocks (current API returns a list of typed content
  // blocks; we only requested text and didn't supply tools).
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => ('text' in block ? block.text : ''))
    .join('')
    .trim()

  if (!text) {
    throw new AINarratorUnavailableError('empty_response', 'Narrator returned no text.')
  }

  return {
    narration: text,
    model: response.model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  }
}
