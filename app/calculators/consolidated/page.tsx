'use client'

// Consolidated investment calculator.
//
// One canvas; five variables {PV, PMT, r, n, FV}. The user picks which to
// solve for and the page reads as a Future Value / Target Value / Rate Finder
// / Tenure Finder by switching the "I want to know my…" selector. The math
// lives in lib/calculators/consolidated.ts. This file owns inputs, layout,
// micro-explanations, charts, URL state, and the save flow.
//
// Designed as the example surface for future calculator rebuilds — patterns
// here (paired slider+numeric, right-rail micro-explanations, sensitivity
// bar, nominal/real toggle) are candidates to extract into a CalculatorShell
// once a second calculator adopts them.

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PaywallGate } from '@/app/components/PaywallGate'
import { CurrencySlider } from '@/app/components/inputs/CurrencySlider'
import { RateSlider } from '@/app/components/inputs/RateSlider'
import { TenureChips } from '@/app/components/inputs/TenureChips'
import { useToast } from '@/app/components/toast-context'
import { formatINR, formatINRCompact } from '@/lib/format-currency'
import { solve, SolveFor } from '@/lib/calculators/consolidated'

// Brand tokens (kept inline because Recharts wants raw colors, not classes).
const FOREST_700 = '#0B3D2E'
const FOREST_400 = '#1D9E75'
const FOREST_200 = '#9DD4BB'
const SAFFRON = '#D4A437'
const INK_400 = '#7A786E'
const INK_100 = '#E8E5DC'

// Investor-friendly framing of the four solve modes. Each card is a full
// sentence the investor would say in their head — not the math name. The
// jargon-y labels ("Future value", "Required SIP") stay only in the math
// library; the UI never says them.
const QUESTION_CARDS: ReadonlyArray<{
  value: SolveFor
  question: string
  blurb: string
  example: string
}> = [
  {
    value: 'futureValue',
    question: 'How much will my money grow to?',
    blurb: 'I know what I can save. Show me the corpus I\'ll end up with.',
    example: 'e.g. "If I save ₹10,000/month for 20 years, what will I have?"',
  },
  {
    value: 'monthlyInvestment',
    question: 'How much should I save each month?',
    blurb: 'I have a goal in mind. Tell me what I need to put away monthly.',
    example: 'e.g. "I want ₹1 crore for retirement in 25 years."',
  },
  {
    value: 'annualRate',
    question: 'What return do I need to reach my goal?',
    blurb: 'I know what I can save and what I want. What return does that need?',
    example: 'e.g. "I save ₹15,000/month. Is 10% enough for ₹2cr in 20 years?"',
  },
  {
    value: 'tenureYears',
    question: 'How long until I reach my goal?',
    blurb: 'I know what I can save and the return I expect. How many years?',
    example: 'e.g. "At ₹20,000/month and 12% returns, when will I have ₹1cr?"',
  },
]

// Quick-pick rate presets grounded in historical returns. These are not
// guarantees — Indian equity has returned ~12-14% CAGR over rolling 15-20
// year windows, but with significant volatility. Debt funds have averaged
// 7-8%, FDs 6-7% (taxable). Labels are deliberately vague ("around 12%") so
// nobody mistakes them for promises.
const RATE_PRESETS: ReadonlyArray<{ label: string; value: number; hint: string }> = [
  { label: 'FD', value: 7, hint: 'Bank fixed deposits, ~6-7%, taxable' },
  { label: 'Debt fund', value: 8, hint: 'Debt mutual funds, ~7-8%' },
  { label: 'Balanced', value: 10, hint: 'Hybrid/balanced funds, ~9-11%' },
  { label: 'Equity index', value: 12, hint: 'Nifty/Sensex long-run, ~11-13%' },
  { label: 'Equity active', value: 13, hint: 'Active equity funds, ~12-14% (historic)' },
]

interface State {
  solveFor: SolveFor
  presentValue: number
  monthlyInvestment: number
  annualRate: number
  tenureYears: number
  targetValue: number
  stepUpPercent: number
  inflationPercent: number
  inflationOn: boolean
  stepUpOn: boolean
}

const DEFAULTS: State = {
  solveFor: 'futureValue',
  presentValue: 100000,
  monthlyInvestment: 10000,
  annualRate: 12,
  tenureYears: 20,
  targetValue: 10000000,
  stepUpPercent: 10,
  inflationPercent: 6,
  inflationOn: false,
  stepUpOn: false,
}

export default function ConsolidatedCalculatorPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConsolidatedInner />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-ink-100 border-t-forest-400 rounded-full" />
    </div>
  )
}

function ConsolidatedInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [state, setState] = useState<State>(() => hydrateFromUrl(searchParams, DEFAULTS))
  const [authChecked, setAuthChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  // Auth check matches the pattern in the other calculator pages.
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) router.push('/auth/signin')
        else setAuthChecked(true)
      })
      .catch(() => router.push('/auth/signin'))
  }, [router])

  // URL sync — replaceState so the back button doesn't fill with input keystrokes.
  useEffect(() => {
    const qs = serializeToUrl(state)
    const url = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [state])

  const result = useMemo(() => {
    return solve({
      solveFor: state.solveFor,
      presentValue: state.presentValue,
      monthlyInvestment: state.monthlyInvestment,
      annualRate: state.annualRate,
      tenureYears: state.tenureYears,
      targetValue: state.targetValue,
      stepUpPercent: state.stepUpOn ? state.stepUpPercent : 0,
      inflationPercent: state.inflationOn ? state.inflationPercent : 0,
    })
  }, [state])

  const handleSave = async () => {
    setSaving(true)
    try {
      const resp = await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'consolidated',
          inputs: { ...state },
          results: result,
          is_draft: false,
        }),
      })
      if (resp.ok) addToast('Saved', 'success')
      else addToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!authChecked) return <PageSkeleton />

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <a
          href="/calculators"
          className="text-forest-600 hover:text-forest-700 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="text-4xl font-serif text-ink-900 mb-3">Plan your money</h1>
        <p className="text-ink-600 mb-8 max-w-2xl">
          A friendly calculator that answers the four questions every investor really has —
          without you having to know the difference between them.
        </p>

        <PaywallGate
          requires="silver"
          reason="This calculator is part of the advanced suite. Upgrade to Silver to unlock all 15 calculators."
        >
          {/* QUESTION CARDS ------------------------------------------------- */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-ink-900 mb-1">Start here.</p>
            <p className="text-sm text-ink-600 mb-4">Which of these sounds like your question?</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUESTION_CARDS.map((q) => {
                const active = state.solveFor === q.value
                return (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, solveFor: q.value }))}
                    className={`text-left p-4 rounded-bk-md border-2 transition-all ${
                      active
                        ? 'border-forest-400 bg-forest-50 shadow-bk-sm'
                        : 'border-ink-100 bg-paper hover:border-forest-200 hover:bg-forest-50/40'
                    }`}
                  >
                    <p className={`text-sm font-semibold mb-2 ${active ? 'text-forest-700' : 'text-ink-900'}`}>
                      {q.question}
                    </p>
                    <p className="text-xs text-ink-600 mb-2">{q.blurb}</p>
                    <p className="text-xs text-ink-400 italic">{q.example}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* INPUTS — 2-column grid, no side rail. The "unknown" field for */}
          {/* the chosen question is hidden entirely (the headline below    */}
          {/* shows the answer), so the form never greys out and never      */}
          {/* feels broken. Each input has an inline "Why this matters"    */}
          {/* expander for investors who want the deeper explanation.      */}
          <div className="card p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              {state.solveFor !== 'presentValue' && (
                <InputBlock
                  label="Money you have today to invest"
                  currentValue={`₹${formatINR(state.presentValue)}`}
                  helper="A one-time amount you can invest right now. Leave at zero if you have none."
                  learnMore="A one-time amount — savings, a bonus, an inheritance, or money rolling over from a maturing FD. No lumpsum is fine; leave it at zero and the monthly SIP alone drives the plan."
                >
                  <CurrencySlider
                    value={state.presentValue}
                    onChange={(v) => setState((s) => ({ ...s, presentValue: v }))}
                    min={0}
                    max={50_000_000}
                    step={10_000}
                    ariaLabel="Money you have today to invest"
                  />
                </InputBlock>
              )}

              {state.solveFor !== 'monthlyInvestment' && (
                <InputBlock
                  label="Money you'll add every month"
                  currentValue={`₹${formatINR(state.monthlyInvestment)}`}
                  helper="Your monthly SIP — what you can comfortably put away after expenses."
                  learnMore="A SIP (Systematic Investment Plan) is a fixed amount transferred every month on auto-debit into mutual funds or similar. The biggest mistake is being too optimistic — pick what you can sustain through a bad month, not your best month."
                >
                  <CurrencySlider
                    value={state.monthlyInvestment}
                    onChange={(v) => setState((s) => ({ ...s, monthlyInvestment: v }))}
                    min={0}
                    max={500_000}
                    step={500}
                    ariaLabel="Money you will add every month"
                  />
                </InputBlock>
              )}

              {state.solveFor !== 'annualRate' && (
                <InputBlock
                  label="Expected return per year"
                  currentValue={`${state.annualRate.toFixed(1)}%`}
                  helper="Pick what your money is invested in — or fine-tune below."
                  learnMore="How much your money is expected to grow per year, on average. Historical ranges: FD 6-7%, Debt funds 7-8%, Balanced funds 9-11%, Equity index 11-13%, Active equity 12-14%. These are before tax and expenses. Past performance is not a promise of future results."
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {RATE_PRESETS.map((p) => {
                      const active = Math.abs(state.annualRate - p.value) < 0.05
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setState((s) => ({ ...s, annualRate: p.value }))}
                          title={p.hint}
                          className={`px-3 py-1.5 rounded-bk-md text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-forest-400 text-paper'
                              : 'bg-paper border border-ink-200 text-ink-600 hover:border-forest-200 hover:bg-forest-50'
                          }`}
                        >
                          {p.label}
                          <span className="ml-1 font-data tabular-nums opacity-70">{p.value}%</span>
                        </button>
                      )
                    })}
                  </div>
                  <RateSlider
                    value={state.annualRate}
                    onChange={(v) => setState((s) => ({ ...s, annualRate: v }))}
                    min={0}
                    max={30}
                    step={0.1}
                    ariaLabel="Expected return per year"
                  />
                  <RiskHorizonInsight
                    rate={state.annualRate}
                    tenureYears={state.tenureYears}
                  />
                </InputBlock>
              )}

              {state.solveFor !== 'tenureYears' && (
                <InputBlock
                  label="How long you'll let it grow"
                  currentValue={`${state.tenureYears} years`}
                  helper="In years. Longer is usually better — compounding rewards patience."
                  learnMore="Time is the most powerful lever in investing, more powerful than picking the perfect rate or fund. Adding 5 years to a plan often does more for the corpus than chasing 2% extra return."
                >
                  <TenureChips
                    value={Math.round(state.tenureYears)}
                    onChange={(v) => setState((s) => ({ ...s, tenureYears: v }))}
                    min={1}
                    max={50}
                  />
                </InputBlock>
              )}

              {state.solveFor !== 'futureValue' && (
                <InputBlock
                  label="Your goal amount"
                  currentValue={`₹${formatINR(state.targetValue)}`}
                  helper="The corpus you want to end up with — in future rupees."
                  learnMore="The amount you want at the end, in the rupees of that future year — not today's rupees. ₹1 crore in 25 years will only buy what ~₹25 lakh buys today (at 6% inflation). Toggle 'Show what my money will actually buy' below to see the real picture."
                >
                  <CurrencySlider
                    value={state.targetValue}
                    onChange={(v) => setState((s) => ({ ...s, targetValue: v }))}
                    min={0}
                    max={500_000_000}
                    step={1_00_000}
                    ariaLabel="Your goal amount"
                  />
                </InputBlock>
              )}
            </div>

            {/* TOGGLES — opt-in extras for investors ready for them. */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 mt-6 border-t border-ink-100">
              <ToggleRow
                label="Increase my monthly amount each year"
                description="Most salaried investors raise their SIP with their salary — it helps a lot."
                checked={state.stepUpOn}
                onChange={(b) => setState((s) => ({ ...s, stepUpOn: b }))}
              >
                {state.stepUpOn && (
                  <div className="mt-3 max-w-xs">
                    <RateSlider
                      value={state.stepUpPercent}
                      onChange={(v) => setState((s) => ({ ...s, stepUpPercent: v }))}
                      min={0}
                      max={25}
                      step={1}
                      label="Yearly increase"
                      ariaLabel="Yearly increase percentage"
                    />
                  </div>
                )}
              </ToggleRow>

              <ToggleRow
                label="Show what my money will actually buy"
                description="₹1 crore in 25 years won't buy what ₹1 crore buys today. Toggle on to see real value."
                checked={state.inflationOn}
                onChange={(b) => setState((s) => ({ ...s, inflationOn: b }))}
              >
                {state.inflationOn && (
                  <div className="mt-3 max-w-xs">
                    <RateSlider
                      value={state.inflationPercent}
                      onChange={(v) => setState((s) => ({ ...s, inflationPercent: v }))}
                      min={0}
                      max={15}
                      step={0.1}
                      label="Inflation rate"
                      ariaLabel="Inflation rate"
                    />
                  </div>
                )}
              </ToggleRow>
            </div>
          </div>

          {/* HEADLINE — written as a complete sentence the investor can */}
          {/* read aloud. The number itself is the loud part; the framing  */}
          {/* prose around it adds the "so what". */}
          <div className="card p-8 mb-6 bg-forest-700 text-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-200 mb-3">
              Here&apos;s what your plan looks like
            </p>
            <SentenceHeadline state={state} result={result} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-forest-400/40">
              <Stat
                label="What you'll put in"
                value={`₹${formatINR(result.totalContributions)}`}
              />
              <Stat
                label="What it'll earn for you"
                value={`₹${formatINR(result.totalReturns)}`}
              />
              <Stat
                label={state.inflationOn ? 'In today\'s prices' : 'Money earned for every ₹1 saved'}
                value={
                  state.inflationOn
                    ? `₹${formatINR(result.realFutureValue)}`
                    : result.totalContributions > 0
                      ? `₹${(result.totalReturns / result.totalContributions).toFixed(2)}`
                      : '—'
                }
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 px-5 py-2.5 bg-paper text-forest-700 font-semibold rounded-bk-md hover:bg-forest-50 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save this plan'}
            </button>
          </div>

          {/* CHARTS GRID — 2x2 dashboard view. Each card now leads with a */}
          {/* clear title, the visual, and a single-sentence takeaway that  */}
          {/* tells the investor what to remember from the chart. */}
          <p className="text-sm font-semibold text-ink-900 mb-3 mt-2">See it four ways</p>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <ChartCard
              title="How your money grows"
              takeaway="The dark band is what you put in. The bright band on top is what compounding earned for you — and it gets steeper every year."
            >
              <GrowthAreaChart yearly={result.yearly} />
            </ChartCard>

            <ChartCard
              title="What time does for your money"
              takeaway="Every extra year compounds. Starting 5 years earlier almost always matters more than chasing 2% extra return."
            >
              <TimeImpactChart state={state} result={result} />
            </ChartCard>

            <ChartCard
              title={state.inflationOn ? 'What your money will really be worth' : 'Your money\'s journey'}
              takeaway={
                state.inflationOn
                  ? 'The dashed line is what your corpus actually buys, in today\'s prices. Inflation quietly eats the rest.'
                  : 'Turn on "Show what my money will actually buy" above to see your corpus in today\'s purchasing power.'
              }
            >
              <NominalVsRealChart yearly={result.yearly} inflationOn={state.inflationOn} />
            </ChartCard>

            <ChartCard
              title="Year-by-year breakdown"
              takeaway="Scroll through to spot milestones: when your corpus crosses ₹10L, ₹50L, ₹1Cr."
            >
              <YearByYearTable yearly={result.yearly} inflationOn={state.inflationOn} />
            </ChartCard>
          </div>

          {/* THREE THINGS I LEARNED TODAY — the educational pay-off. Each */}
          {/* lesson uses the investor's actual numbers, and has a "Try   */}
          {/* this" button that toggles the relevant input so they        */}
          {/* experience the principle, not just read it. */}
          <ThreeLessons state={state} result={result} setState={setState} />

          {/* RESET ---------------------------------------------------------- */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setState(DEFAULTS)}
              className="text-sm text-ink-400 hover:text-ink-600 underline underline-offset-2"
            >
              Reset to defaults
            </button>
          </div>
        </PaywallGate>
      </div>
    </div>
  )
}

// ---- Subcomponents ----------------------------------------------------------

function InputBlock({
  label,
  currentValue,
  helper,
  learnMore,
  children,
}: {
  label: string
  /** Live current value, shown next to the label so the investor always
   *  sees the input's state at a glance even if the slider is mid-drag. */
  currentValue: string
  /** One-line plain-language hint, always visible below the label. */
  helper: string
  /** Longer explanation revealed by clicking "Why this matters". */
  learnMore: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="text-sm font-data tabular-nums font-semibold text-forest-700 whitespace-nowrap">
          {currentValue}
        </p>
      </div>
      <p className="text-xs text-ink-600 mb-3">{helper}</p>
      {children}
      <details className="mt-2 group">
        <summary className="text-xs text-forest-600 cursor-pointer hover:text-forest-700 select-none list-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
            Why this matters
          </span>
        </summary>
        <p className="text-xs text-ink-600 mt-2 pl-3 border-l-2 border-forest-200 leading-relaxed">
          {learnMore}
        </p>
      </details>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  children,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (b: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex-1 min-w-[260px]">
      <label className="inline-flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-200 text-forest-400 focus:ring-forest-400/40"
        />
        <span>
          <span className="block text-sm font-semibold text-ink-900">{label}</span>
          {description && (
            <span className="block text-xs text-ink-600 mt-0.5">{description}</span>
          )}
        </span>
      </label>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-forest-200">{label}</p>
      <p className="text-lg font-data tabular-nums font-semibold mt-1">{value}</p>
    </div>
  )
}

// SentenceHeadline turns the four solve modes into a complete, readable
// sentence. The number is loud (large font, tabular nums); the prose around
// it provides "so what" without the investor needing to interpret a label.
function SentenceHeadline({
  state,
  result,
}: {
  state: State
  result: ReturnType<typeof solve>
}) {
  const big = 'text-4xl md:text-5xl font-data tabular-nums font-bold'
  switch (state.solveFor) {
    case 'futureValue':
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          In {state.tenureYears} years, your plan will grow to{' '}
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(result.computed)}</span>
          <span className="text-sm text-forest-200">
            That&apos;s about {formatINRCompact(result.computed)}.
          </span>
        </p>
      )
    case 'monthlyInvestment':
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          To reach ₹{formatINR(state.targetValue)} in {state.tenureYears} years, you&apos;ll need
          to save
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(result.computed)}/month</span>
          <span className="text-sm text-forest-200">
            Starting today. {state.stepUpOn ? `Plus a ${state.stepUpPercent}% raise to your SIP each year.` : ''}
          </span>
        </p>
      )
    case 'annualRate':
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          To hit ₹{formatINR(state.targetValue)} in {state.tenureYears} years with what you&apos;re saving,
          you&apos;d need an annual return of
          <span className={`block mt-2 mb-1 ${big}`}>{result.computed.toFixed(2)}%</span>
          <span className="text-sm text-forest-200">
            {result.computed > 14
              ? 'That\'s ambitious — equity index funds have historically delivered ~12-14%.'
              : result.computed < 6
                ? 'Achievable with debt funds or FDs.'
                : 'Realistic for a diversified equity portfolio.'}
          </span>
        </p>
      )
    case 'tenureYears':
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          To reach ₹{formatINR(state.targetValue)} at {state.annualRate}% returns, you&apos;ll need
          <span className={`block mt-2 mb-1 ${big}`}>{result.computed.toFixed(1)} years</span>
          <span className="text-sm text-forest-200">
            About {Math.round(result.computed * 12)} months.
          </span>
        </p>
      )
    case 'presentValue':
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          You&apos;d need a one-time lumpsum of
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(result.computed)}</span>
        </p>
      )
  }
}

// ---- Risk + horizon insight -------------------------------------------------

// RiskHorizonInsight — classifies the chosen rate into a risk tier and
// reads its fit against the chosen tenure. Surfaces the two principles
// most retail investors miss:
//   1. Low-risk products may not beat inflation over long horizons.
//   2. High-risk products need a long horizon to ride out volatility.
//
// Currently a deterministic function. The structure (classify + fit + render)
// is designed for a clean swap to an LLM-generated paragraph later — just
// replace `classifyRate`/`assessFit` with an async fetch and lift to state.
function RiskHorizonInsight({
  rate,
  tenureYears,
}: {
  rate: number
  tenureYears: number
}) {
  const risk = classifyRate(rate)
  const fit = assessFit(rate, tenureYears)
  return (
    <div
      className={`mt-4 p-4 rounded-bk-md border text-xs leading-relaxed ${
        fit.tone === 'warn'
          ? 'bg-saffron-50 border-saffron-200'
          : 'bg-forest-50 border-forest-200/60'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${
            risk.badgeClass
          }`}
        >
          {risk.level} risk
        </span>
        <span className="text-ink-600">{risk.description}</span>
      </div>
      <p className={fit.tone === 'warn' ? 'text-saffron-700' : 'text-ink-600'}>
        <span className="font-semibold">
          {fit.tone === 'warn' ? 'Worth a second look: ' : 'Good fit: '}
        </span>
        {fit.message}
      </p>
    </div>
  )
}

interface RiskInfo {
  level: 'Low' | 'Medium-low' | 'Medium' | 'Medium-high' | 'High'
  description: string
  badgeClass: string
}

function classifyRate(rate: number): RiskInfo {
  if (rate < 7.5)
    return {
      level: 'Low',
      description: 'FD-like — predictable, capital-safe.',
      badgeClass: 'bg-ink-100 text-ink-600',
    }
  if (rate < 9)
    return {
      level: 'Medium-low',
      description: 'Debt funds — slightly higher than FD, similar predictability.',
      badgeClass: 'bg-ink-100 text-ink-600',
    }
  if (rate < 11.5)
    return {
      level: 'Medium',
      description: 'Balanced — mix of equity and debt smooths the ride.',
      badgeClass: 'bg-forest-100 text-forest-700',
    }
  if (rate < 13)
    return {
      level: 'Medium-high',
      description: 'Equity index — tracks the market.',
      badgeClass: 'bg-saffron-100 text-saffron-700',
    }
  return {
    level: 'High',
    description: 'Active equity — higher upside, wider downside.',
    badgeClass: 'bg-saffron-100 text-saffron-700',
  }
}

interface FitAssessment {
  tone: 'ok' | 'warn'
  message: string
}

function assessFit(rate: number, tenureYears: number): FitAssessment {
  // Equity-like returns over a short horizon — the most common mistake.
  if (rate >= 11.5 && tenureYears < 7) {
    return {
      tone: 'warn',
      message: `Equity-like returns over only ${tenureYears} years is risky — a single bad year can wipe out years of gains. Consider Balanced (~10%) for a smoother ride, or extend the tenure to 10+ years.`,
    }
  }
  // Low-risk over a long horizon — silent inflation losses.
  if (rate < 8 && tenureYears > 12) {
    return {
      tone: 'warn',
      message: `Returns near ${rate.toFixed(1)}% over ${tenureYears} years will likely just match inflation — your money won't actually grow in real terms. For long horizons, Balanced or Equity has historically rewarded the patience.`,
    }
  }
  // Equity over long horizon — the classic recommended pairing.
  if (rate >= 11 && tenureYears >= 15) {
    return {
      tone: 'ok',
      message: `Your ${tenureYears}-year horizon is long enough to ride out equity volatility. Historically, Indian equity has been positive over every rolling 15-year window — time is the antidote to short-term swings.`,
    }
  }
  // Balanced over medium horizon — generally fine.
  if (rate >= 9 && rate < 12 && tenureYears >= 7) {
    return {
      tone: 'ok',
      message: `Balanced returns over ${tenureYears} years is a comfortable middle ground — meaningful growth without the swings of pure equity.`,
    }
  }
  // FD/debt over short horizon — appropriate.
  if (rate < 9 && tenureYears <= 5) {
    return {
      tone: 'ok',
      message: `FD or debt is well-suited to short-horizon goals where capital safety matters more than maximum growth.`,
    }
  }
  return {
    tone: 'ok',
    message: `This return-tenure pairing is in a reasonable range. As a rule of thumb: more risk needs more time to smooth out, and longer tenures eventually need more risk to beat inflation.`,
  }
}

// ---- Lessons recap card -----------------------------------------------------

// ThreeLessons — the educational payoff. After 4 charts of data, we
// distil three teachable principles using the investor's own numbers.
// Each lesson includes a "Try this" button that flips a relevant input
// so they experience the principle, not just read about it.
function ThreeLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: ReturnType<typeof solve>
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  const baseInputs = {
    presentValue: result.resolved.presentValue,
    monthlyInvestment: result.resolved.monthlyInvestment,
    annualRate: result.resolved.annualRate,
    tenureYears: result.resolved.tenureYears,
    targetValue: 0,
    inflationPercent: 0,
  }

  // Compounding lesson — multiplier of contributions → corpus
  const multiplier = result.totalContributions > 0
    ? result.resolved.futureValue / result.totalContributions
    : 0

  // Time-premium lesson — same plan run for 5 more years
  const earlierFv = solve({
    ...baseInputs,
    tenureYears: result.resolved.tenureYears + 5,
    stepUpPercent: state.stepUpOn ? state.stepUpPercent : 0,
    solveFor: 'futureValue',
  }).computed
  const timeBonus = earlierFv - result.resolved.futureValue

  // Third lesson rotates between step-up and inflation based on what's off
  const stepUpFv = solve({
    ...baseInputs,
    stepUpPercent: state.stepUpOn ? state.stepUpPercent : 10,
    solveFor: 'futureValue',
  }).computed
  const stepUpBonus = stepUpFv - result.resolved.futureValue
  const realToday = result.resolved.futureValue / Math.pow(1 + (state.inflationOn ? state.inflationPercent : 6) / 100, result.resolved.tenureYears)
  const inflationGap = result.resolved.futureValue - realToday

  return (
    <div className="card p-8 mb-6 bg-forest-50 border-2 border-forest-200">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-700 mb-1">
        For your future self
      </p>
      <h2 className="text-2xl font-serif text-ink-900 mb-6">Three things to take away</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <LessonCard
          number="1"
          title="Compounding does most of the work"
          body={
            <>
              You&apos;ll put in <strong>₹{formatINR(result.totalContributions)}</strong>. At
              the end, you&apos;ll have <strong>₹{formatINR(result.resolved.futureValue)}</strong> —
              that&apos;s a <strong>{multiplier.toFixed(1)}× multiplier</strong>. The longer the
              tenure, the bigger this gets, because each year&apos;s returns earn their own
              returns the year after.
            </>
          }
          cta={{
            label: 'Try it: cut tenure in half',
            onClick: () =>
              setState((s) => ({
                ...s,
                tenureYears: Math.max(Math.round(s.tenureYears / 2), 1),
              })),
          }}
        />

        <LessonCard
          number="2"
          title="Time beats picking the perfect rate"
          body={
            <>
              Same plan, just 5 years longer, grows to{' '}
              <strong>₹{formatINR(earlierFv)}</strong> —{' '}
              <strong>₹{formatINRCompact(timeBonus)} more</strong> than today&apos;s plan. Most
              investors over-think which fund will beat the market; the bigger lever is
              starting (or extending) early.
            </>
          }
          cta={{
            label: 'Try it: add 5 more years',
            onClick: () => setState((s) => ({ ...s, tenureYears: s.tenureYears + 5 })),
          }}
        />

        {!state.stepUpOn ? (
          <LessonCard
            number="3"
            title="A yearly raise to your SIP barely hurts"
            body={
              <>
                If you nudged your monthly SIP up by 10% every year (matching typical
                salary growth), your corpus would grow to{' '}
                <strong>₹{formatINR(stepUpFv)}</strong> — about{' '}
                <strong>₹{formatINRCompact(stepUpBonus)} more</strong>. You wouldn&apos;t
                notice the extra ₹1,000/month next year, but your future self will.
              </>
            }
            cta={{
              label: 'Try it: turn on yearly increase',
              onClick: () => setState((s) => ({ ...s, stepUpOn: true })),
            }}
          />
        ) : (
          <LessonCard
            number="3"
            title="Inflation quietly eats nominal gains"
            body={
              <>
                Your corpus of ₹{formatINR(result.resolved.futureValue)} will only buy what
                today&apos;s <strong>₹{formatINR(realToday)}</strong> buys. About{' '}
                <strong>₹{formatINRCompact(inflationGap)}</strong> goes to rising prices.
                That&apos;s why retirement planners always work in real returns, not nominal.
              </>
            }
            cta={{
              label: state.inflationOn ? 'Adjust inflation rate' : 'Try it: show real values',
              onClick: () => setState((s) => ({ ...s, inflationOn: true })),
            }}
          />
        )}
      </div>
    </div>
  )
}

function LessonCard({
  number,
  title,
  body,
  cta,
}: {
  number: string
  title: string
  body: React.ReactNode
  cta: { label: string; onClick: () => void }
}) {
  return (
    <div className="bg-paper rounded-bk-md p-5 border border-forest-200/60 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-forest-400 text-paper text-sm font-data tabular-nums font-bold">
          {number}
        </span>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
      </div>
      <p className="text-sm text-ink-600 leading-relaxed flex-1 mb-4">{body}</p>
      <button
        type="button"
        onClick={cta.onClick}
        className="text-xs font-semibold text-forest-700 hover:text-forest-900 underline underline-offset-2 self-start"
      >
        → {cta.label}
      </button>
    </div>
  )
}

function ChartCard({
  title,
  takeaway,
  children,
}: {
  title: string
  /** A single short sentence printed BELOW the chart, lightly styled, that
   *  tells the investor what to remember from the visual. Pedagogical, not
   *  descriptive — "look at the band on top" beats "stacked area shows…". */
  takeaway: string
  children: React.ReactNode
}) {
  return (
    <div className="card p-6 flex flex-col">
      <p className="text-sm font-semibold text-ink-900 mb-4">{title}</p>
      <div className="flex-1">{children}</div>
      <p className="text-xs text-ink-600 mt-4 pt-3 border-t border-ink-100 leading-relaxed">
        <span className="text-forest-600 font-semibold">Takeaway: </span>
        {takeaway}
      </p>
    </div>
  )
}

// ---- Charts ----------------------------------------------------------------

function GrowthAreaChart({ yearly }: { yearly: ReturnType<typeof solve>['yearly'] }) {
  const data = yearly.map((p) => ({
    year: p.year,
    contributions: p.contributions,
    returns: Math.max(0, p.balance - p.contributions),
  }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="contGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FOREST_700} stopOpacity={0.7} />
            <stop offset="100%" stopColor={FOREST_700} stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FOREST_200} stopOpacity={0.7} />
            <stop offset="100%" stopColor={FOREST_200} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={INK_100} vertical={false} />
        <XAxis
          dataKey="year"
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
        />
        <YAxis
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          tickFormatter={(v) => formatINRCompact(v)}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FAF8F0',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
          formatter={(value, name) => [
            `₹${formatINR(typeof value === 'number' ? value : Number(value) || 0)}`,
            name === 'contributions' ? 'Contributions' : 'Returns',
          ]}
          labelFormatter={(l) => `Year ${l}`}
        />
        <Area
          type="monotone"
          dataKey="contributions"
          stackId="1"
          stroke={FOREST_700}
          strokeWidth={2}
          fill="url(#contGrad)"
        />
        <Area
          type="monotone"
          dataKey="returns"
          stackId="1"
          stroke={FOREST_200}
          strokeWidth={2}
          fill="url(#retGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// TimeImpactChart — three horizontal bars showing the SAME plan if it had
// run for 5 fewer years, exactly the tenure today, or 5 more years. Teaches
// that time is the most powerful lever, more than rate-chasing. Uses the
// RESOLVED state so it works regardless of which variable the investor is
// solving for.
function TimeImpactChart({
  state,
  result,
}: {
  state: State
  result: ReturnType<typeof solve>
}) {
  const baseN = result.resolved.tenureYears
  const scenarios = [
    { label: 'Start 5 years earlier', years: baseN + 5, highlight: false },
    { label: 'Your plan today', years: baseN, highlight: true },
    { label: 'Wait 5 more years', years: Math.max(baseN - 5, 0.5), highlight: false },
  ]

  const baseInputs = {
    presentValue: result.resolved.presentValue,
    monthlyInvestment: result.resolved.monthlyInvestment,
    annualRate: result.resolved.annualRate,
    targetValue: 0,
    stepUpPercent: state.stepUpOn ? state.stepUpPercent : 0,
    inflationPercent: 0,
  }

  const data = scenarios.map((s) => ({
    name: s.label,
    value: solve({ ...baseInputs, tenureYears: s.years, solveFor: 'futureValue' }).computed,
    highlight: s.highlight,
    years: s.years,
  }))

  const maxVal = Math.max(...data.map((d) => d.value), 1)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={INK_100} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, maxVal * 1.15]}
          stroke={INK_400}
          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          tickFormatter={(v) => formatINRCompact(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          width={140}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FAF8F0',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
          formatter={(value, _name, item) => [
            `₹${formatINR(typeof value === 'number' ? value : Number(value) || 0)}`,
            `Corpus after ${item.payload.years} years`,
          ]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.highlight ? FOREST_700 : FOREST_200} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(label) => formatINRCompact(Number(label) || 0)}
            style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: INK_400 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function NominalVsRealChart({
  yearly,
  inflationOn,
}: {
  yearly: ReturnType<typeof solve>['yearly']
  inflationOn: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={yearly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={INK_100} vertical={false} />
        <XAxis
          dataKey="year"
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
        />
        <YAxis
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          tickFormatter={(v) => formatINRCompact(v)}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FAF8F0',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
          formatter={(value, name) => [
            `₹${formatINR(typeof value === 'number' ? value : Number(value) || 0)}`,
            name === 'balance' ? 'Nominal' : "Today's money",
          ]}
          labelFormatter={(l) => `Year ${l}`}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke={FOREST_700}
          strokeWidth={2}
          dot={false}
          name="Nominal"
        />
        {inflationOn && (
          <Line
            type="monotone"
            dataKey="real"
            stroke={SAFFRON}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            name="Today's money"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

function YearByYearTable({
  yearly,
  inflationOn,
}: {
  yearly: ReturnType<typeof solve>['yearly']
  inflationOn: boolean
}) {
  return (
    <div className="max-h-[260px] overflow-y-auto -mx-2">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-paper">
          <tr className="text-left text-xs uppercase tracking-[0.12em] text-ink-400 border-b border-ink-100">
            <th className="py-2 px-2">Year</th>
            <th className="py-2 px-2 text-right">Contributions</th>
            <th className="py-2 px-2 text-right">Balance</th>
            {inflationOn && <th className="py-2 px-2 text-right">In today's ₹</th>}
          </tr>
        </thead>
        <tbody>
          {yearly.map((p) => (
            <tr key={p.year} className="border-b border-ink-100/50">
              <td className="py-1.5 px-2 font-data tabular-nums text-ink-600">{p.year}</td>
              <td className="py-1.5 px-2 text-right font-data tabular-nums text-ink-600">
                {formatINRCompact(p.contributions)}
              </td>
              <td className="py-1.5 px-2 text-right font-data tabular-nums text-forest-700 font-semibold">
                {formatINRCompact(p.balance)}
              </td>
              {inflationOn && (
                <td className="py-1.5 px-2 text-right font-data tabular-nums text-ink-600">
                  {formatINRCompact(p.real)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- URL state --------------------------------------------------------------

const URL_KEYS: Array<[keyof State, string]> = [
  ['solveFor', 'mode'],
  ['presentValue', 'pv'],
  ['monthlyInvestment', 'pmt'],
  ['annualRate', 'r'],
  ['tenureYears', 'n'],
  ['targetValue', 'fv'],
  ['stepUpPercent', 'su'],
  ['inflationPercent', 'inf'],
  ['inflationOn', 'inflOn'],
  ['stepUpOn', 'suOn'],
]

function hydrateFromUrl(searchParams: URLSearchParams | null, defaults: State): State {
  if (!searchParams) return defaults
  const out: State = { ...defaults }
  for (const [stateKey, urlKey] of URL_KEYS) {
    const raw = searchParams.get(urlKey)
    if (raw == null) continue
    if (stateKey === 'solveFor') {
      if (['futureValue', 'monthlyInvestment', 'annualRate', 'tenureYears', 'presentValue'].includes(raw)) {
        (out as any)[stateKey] = raw as SolveFor
      }
    } else if (stateKey === 'inflationOn' || stateKey === 'stepUpOn') {
      (out as any)[stateKey] = raw === '1' || raw === 'true'
    } else {
      const n = Number(raw)
      if (Number.isFinite(n)) (out as any)[stateKey] = n
    }
  }
  return out
}

function serializeToUrl(state: State): string {
  const params = new URLSearchParams()
  for (const [stateKey, urlKey] of URL_KEYS) {
    const v = state[stateKey]
    if (stateKey === 'inflationOn' || stateKey === 'stepUpOn') {
      if (v) params.set(urlKey, '1')
    } else if (typeof v === 'number') {
      params.set(urlKey, String(v))
    } else {
      params.set(urlKey, String(v))
    }
  }
  return params.toString()
}
