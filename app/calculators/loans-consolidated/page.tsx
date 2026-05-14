'use client'

// Loans consolidated calculator — five borrower questions on one canvas:
//
//   1. What will my EMI be?            (basic)
//   2. What loan can I afford?         (capacity)
//   3. Should I prepay?                (prepay)
//   4. What if I change my EMI?        (emi-change)
//   5. What if my rate changes?        (rate-change)
//
// Modes 1-2 are "planning a new loan"; 3-5 are "optimizing an existing loan"
// and share the loan-basics inputs so users only enter their loan once.
//
// Page mirrors /calculators/consolidated:
//   Question cards → mode-specific inputs → sentence headline → 4 charts
//   in a 2×2 grid → "Three things to take away" recap.

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PaywallGate } from '@/app/components/PaywallGate'
import { CurrencySlider } from '@/app/components/inputs/CurrencySlider'
import { CurrencyInput } from '@/app/components/inputs/CurrencyInput'
import { RateSlider } from '@/app/components/inputs/RateSlider'
import { TenureChips } from '@/app/components/inputs/TenureChips'
import { TogglePills } from '@/app/components/inputs/TogglePills'
import { AmortizationArea } from '@/app/components/charts/AmortizationArea'
import { Donut } from '@/app/components/charts/Donut'
import { useToast } from '@/app/components/toast-context'
import { useDebouncedCalc } from '@/lib/hooks/useDebouncedCalc'
import { formatINR, formatINRCompact } from '@/lib/format-currency'

import { calculateEmi } from '@/lib/calculators/emi'
import { calculateEmiCapacity } from '@/lib/calculators/emiCapacity'
import { calculatePartialPayment } from '@/lib/calculators/partialPayment'
import { calculateEmiChange } from '@/lib/calculators/emiChange'
import { calculateRateChange } from '@/lib/calculators/rateChange'
import type {
  BackupAvailability,
  EmiChangeResult,
  EMICalculatorResult,
  EMICapacityResult,
  IncomeStabilityLevel,
  PartialPaymentResult,
  RateChangeResult,
} from '@/lib/calculators/types'

const FOREST_700 = '#0B3D2E'
const FOREST_400 = '#1D9E75'
const FOREST_200 = '#9DD4BB'
const INK_400 = '#7A786E'
const INK_100 = '#E8E5DC'
const SAFFRON_400 = '#D4A437'

type Mode = 'basic' | 'capacity' | 'prepay' | 'emi-change' | 'rate-change'

interface PrepaymentDraft {
  date: string  // 'MMM-yyyy'
  amount: number | null
}

interface EmiChangeDraft {
  date: string
  newEmi: number | null
}

interface RateChangeDraft {
  date: string
  newRate: number | null
}

interface State {
  mode: Mode

  // Shared loan basics (used by basic + all 3 optimization modes)
  loanAmount: number
  interestRate: number
  tenureYears: number
  loanStartDate: string

  // Capacity-only
  currentAge: number
  retirementAge: number
  netIncome: number
  existingEmi: number
  expenses: number
  additionalIncome: number
  stability: IncomeStabilityLevel
  backup: BackupAvailability

  // Optimization events
  prepayments: PrepaymentDraft[]
  emiChanges: EmiChangeDraft[]
  rateChanges: RateChangeDraft[]
}

const DEFAULTS: State = {
  mode: 'basic',
  loanAmount: 3_000_000,
  interestRate: 9,
  tenureYears: 20,
  loanStartDate: 'Jan-2024',
  currentAge: 35,
  retirementAge: 60,
  netIncome: 150_000,
  existingEmi: 0,
  expenses: 60_000,
  additionalIncome: 0,
  stability: 'HIGH',
  backup: 'YES',
  prepayments: [{ date: 'Jan-2029', amount: 500_000 }],
  emiChanges: [{ date: 'Jan-2027', newEmi: 35_000 }],
  rateChanges: [{ date: 'Jan-2026', newRate: 8 }],
}

// Discriminated union — every mode emits a different result shape, but the
// `kind` tag lets downstream renderers narrow cleanly.
type ComputedResult =
  | { kind: 'basic'; data: EMICalculatorResult }
  | { kind: 'capacity'; data: EMICapacityResult }
  | { kind: 'prepay'; data: PartialPaymentResult }
  | { kind: 'emi-change'; data: EmiChangeResult }
  | { kind: 'rate-change'; data: RateChangeResult }

// ---- Question cards ---------------------------------------------------------

interface QuestionCardSpec {
  value: Mode
  question: string
  blurb: string
  example: string
}

const PLANNING_QUESTIONS: ReadonlyArray<QuestionCardSpec> = [
  {
    value: 'basic',
    question: 'What will my EMI be?',
    blurb: 'I know the loan I want. Show me the monthly EMI and total cost.',
    example: 'e.g. "I want a ₹30L home loan for 20 years at 9%."',
  },
  {
    value: 'capacity',
    question: 'What loan can I afford?',
    blurb: 'I want to know how much loan my income comfortably supports.',
    example: 'e.g. "I earn ₹1.5L/month — how much home loan can I take?"',
  },
]

const OPTIMIZING_QUESTIONS: ReadonlyArray<QuestionCardSpec> = [
  {
    value: 'prepay',
    question: 'Should I prepay my loan?',
    blurb: 'I have surplus money. Show me what prepaying would save.',
    example: 'e.g. "If I prepay ₹5L in year 5, how much do I save?"',
  },
  {
    value: 'emi-change',
    question: 'What if I change my EMI?',
    blurb: 'I can afford a bigger EMI now. Show me how that helps.',
    example: 'e.g. "If I bump my EMI to ₹35K in year 3, when do I finish?"',
  },
  {
    value: 'rate-change',
    question: 'What if my rate changes?',
    blurb: 'Rates have moved. Show me whether to keep my EMI or my tenure.',
    example: 'e.g. "Rate dropped to 8% — keep tenure or keep EMI?"',
  },
]

// ============================================================================
// Page
// ============================================================================

export default function LoansConsolidatedPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="animate-spin h-10 w-10 border-2 border-ink-100 border-t-forest-400 rounded-full" />
    </div>
  )
}

function Inner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [state, setState] = useState<State>(() => hydrateFromUrl(searchParams, DEFAULTS))
  const [authChecked, setAuthChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) router.push('/auth/signin')
        else setAuthChecked(true)
      })
      .catch(() => router.push('/auth/signin'))
  }, [router])

  useEffect(() => {
    const qs = serializeToUrl(state)
    const url = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [state])

  const result = useDebouncedCalc<ComputedResult>(
    () => computeResult(state),
    [state],
    150,
  )

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      const resp = await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: `loans-consolidated:${state.mode}`,
          inputs: { ...state },
          results: result.data,
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
          className="text-forest-700 hover:text-forest-500 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="text-4xl font-serif text-ink-900 mb-3">Plan your loan</h1>
        <p className="text-ink-600 mb-8 max-w-2xl">
          One walkthrough for the five questions every borrower has — from picking the right
          EMI to deciding whether to prepay.
        </p>

        <PaywallGate
          requires="silver"
          reason="This calculator is part of the advanced suite. Upgrade to Silver to unlock all 15 calculators."
        >
          <QuestionCards mode={state.mode} onChange={(m) => setState((s) => ({ ...s, mode: m }))} />

          <ModeForm state={state} setState={setState} />

          {result ? (
            <>
              <Headline state={state} result={result} onSave={handleSave} saving={saving} />
              <Charts state={state} result={result} />
              <ThreeLessons state={state} result={result} setState={setState} />
            </>
          ) : (
            <div className="card p-12 flex items-center justify-center text-ink-400">
              Crunching the numbers…
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setState({ ...DEFAULTS, mode: state.mode })}
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

// ---- Question cards ---------------------------------------------------------

function QuestionCards({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (m: Mode) => void
}) {
  return (
    <div className="mb-8">
      <p className="text-sm font-semibold text-ink-900 mb-1">Start here.</p>
      <p className="text-sm text-ink-600 mb-5">Which of these sounds like your question?</p>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-3">
          I&apos;m planning a new loan
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {PLANNING_QUESTIONS.map((q) => (
            <QuestionCardButton key={q.value} card={q} active={mode === q.value} onSelect={() => onChange(q.value)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-3">
          I already have a loan and want to…
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {OPTIMIZING_QUESTIONS.map((q) => (
            <QuestionCardButton key={q.value} card={q} active={mode === q.value} onSelect={() => onChange(q.value)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuestionCardButton({
  card,
  active,
  onSelect,
}: {
  card: QuestionCardSpec
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left p-4 rounded-bk-md border-2 transition-all ${
        active
          ? 'border-forest-400 bg-forest-50 shadow-bk-sm'
          : 'border-ink-100 bg-paper hover:border-forest-200 hover:bg-forest-50/40'
      }`}
    >
      <p className={`text-sm font-semibold mb-2 ${active ? 'text-forest-700' : 'text-ink-900'}`}>
        {card.question}
      </p>
      <p className="text-xs text-ink-600 mb-2">{card.blurb}</p>
      <p className="text-xs text-ink-400 italic">{card.example}</p>
    </button>
  )
}

// ---- Mode form switcher -----------------------------------------------------

function ModeForm({
  state,
  setState,
}: {
  state: State
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  switch (state.mode) {
    case 'basic':
      return <BasicForm state={state} setState={setState} />
    case 'capacity':
      return <CapacityForm state={state} setState={setState} />
    case 'prepay':
    case 'emi-change':
    case 'rate-change':
      return <OptimizationForm state={state} setState={setState} />
  }
}

// ---- Shared "loan basics" used by basic + 3 optimization modes -------------

function LoanBasicsCard({
  state,
  setState,
  showStartDate,
}: {
  state: State
  setState: React.Dispatch<React.SetStateAction<State>>
  showStartDate: boolean
}) {
  return (
    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
      <InputBlock
        label="Loan amount"
        currentValue={`₹${formatINR(state.loanAmount)}`}
        helper="The principal you want to borrow."
        learnMore="The amount of the loan, not including any down payment. For a home costing ₹40L with ₹10L down, the loan amount is ₹30L."
      >
        <CurrencySlider
          value={state.loanAmount}
          onChange={(v) => setState((s) => ({ ...s, loanAmount: v }))}
          min={1_00_000}
          max={5_00_00_000}
          step={50_000}
          ariaLabel="Loan amount"
        />
      </InputBlock>

      <InputBlock
        label="Interest rate"
        currentValue={`${state.interestRate.toFixed(2)}%`}
        helper="Annual interest rate quoted by the bank."
        learnMore="Home loans typically range 8-10% in India. Personal loans 11-18%. Auto loans 8-12%. A 1% lower rate on a ₹30L 20-year loan saves ~₹3-4 lakh in total interest."
      >
        <RateSlider
          value={state.interestRate}
          onChange={(v) => setState((s) => ({ ...s, interestRate: v }))}
          min={0}
          max={20}
          step={0.05}
          ariaLabel="Interest rate"
        />
      </InputBlock>

      <InputBlock
        label="Tenure"
        currentValue={`${state.tenureYears} years`}
        helper="Loan duration in years."
        learnMore="Longer tenure = smaller EMI but much more interest paid. A 20y loan typically pays ~2× the interest of a 10y loan at the same rate. Banks usually cap home loans at 20-30 years and only up to retirement age."
      >
        <TenureChips
          value={state.tenureYears}
          onChange={(v) => setState((s) => ({ ...s, tenureYears: v }))}
          min={1}
          max={30}
        />
      </InputBlock>

      {showStartDate && (
        <InputBlock
          label="When did the loan start?"
          currentValue={state.loanStartDate}
          helper="The month your first EMI was paid."
          learnMore="Format is short month + year, like Jan-2024 or Jul-2022. We use this to line up your prepayments, EMI changes, or rate changes with the right month in the amortization."
        >
          <MonthYearInput
            value={state.loanStartDate}
            onChange={(v) => setState((s) => ({ ...s, loanStartDate: v }))}
          />
        </InputBlock>
      )}
    </div>
  )
}

// ---- Mode A: Basic EMI form ------------------------------------------------

function BasicForm({ state, setState }: { state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  return (
    <div className="card p-6 mb-6">
      <LoanBasicsCard state={state} setState={setState} showStartDate={false} />
    </div>
  )
}

// ---- Mode B: Capacity form -------------------------------------------------

function CapacityForm({ state, setState }: { state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  return (
    <div className="card p-6 mb-6">
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
        <InputBlock
          label="Monthly family income (net)"
          currentValue={`₹${formatINR(state.netIncome)}`}
          helper="Take-home income after tax — the actual cash you receive monthly."
          learnMore="Use net (post-tax) income from all stable sources — salary, rental, business. Don't include bonuses or variable pay unless you'd consider them reliable enough to commit an EMI against."
        >
          <CurrencySlider
            value={state.netIncome}
            onChange={(v) => setState((s) => ({ ...s, netIncome: v }))}
            min={20_000}
            max={20_00_000}
            step={1000}
            ariaLabel="Monthly family income"
          />
        </InputBlock>

        <InputBlock
          label="Monthly household expenses"
          currentValue={`₹${formatINR(state.expenses)}`}
          helper="Everything you spend on living each month."
          learnMore="Rent or current home, groceries, utilities, transport, schooling, dining, entertainment — every recurring outflow. Be honest: under-counting expenses is the most common reason borrowers struggle with their EMI later."
        >
          <CurrencySlider
            value={state.expenses}
            onChange={(v) => setState((s) => ({ ...s, expenses: v }))}
            min={0}
            max={10_00_000}
            step={1000}
            ariaLabel="Monthly household expenses"
          />
        </InputBlock>

        <InputBlock
          label="Existing EMIs (other loans)"
          currentValue={`₹${formatINR(state.existingEmi)}`}
          helper="Total monthly EMI of any current loans (car, personal, etc.)."
          learnMore="Banks tally all your existing EMIs against your income when assessing eligibility. The standard rule of thumb: total EMIs (including the new one) shouldn't exceed 50% of net income."
        >
          <CurrencySlider
            value={state.existingEmi}
            onChange={(v) => setState((s) => ({ ...s, existingEmi: v }))}
            min={0}
            max={5_00_000}
            step={500}
            ariaLabel="Existing EMIs"
          />
        </InputBlock>

        <InputBlock
          label="Other monthly income"
          currentValue={`₹${formatINR(state.additionalIncome)}`}
          helper="Reliable side income (rent received, dividends)."
          learnMore="Only count income you'd put your name on a loan against. Volatile income (freelance, bonuses) should be excluded — count it as a future cushion instead."
        >
          <CurrencySlider
            value={state.additionalIncome}
            onChange={(v) => setState((s) => ({ ...s, additionalIncome: v }))}
            min={0}
            max={5_00_000}
            step={500}
            ariaLabel="Other monthly income"
          />
        </InputBlock>

        <InputBlock
          label="Your age today"
          currentValue={`${state.currentAge} years`}
          helper="We cap tenure at retirement age."
          learnMore="Banks won't lend on a tenure that extends past your stated retirement age. So a 50-year-old planning to retire at 60 is capped at a 10-year loan, regardless of repayment ability."
        >
          <NumberStepper
            value={state.currentAge}
            onChange={(v) => setState((s) => ({ ...s, currentAge: v }))}
            min={18}
            max={70}
          />
        </InputBlock>

        <InputBlock
          label="Planned retirement age"
          currentValue={`${state.retirementAge} years`}
          helper="When you plan to stop earning a regular income."
          learnMore="Standard is 60 in India, 58 in some sectors. Self-employed sometimes plan later. Banks use the lower of (your stated retirement age, their policy ceiling — usually 65 or 70)."
        >
          <NumberStepper
            value={state.retirementAge}
            onChange={(v) => setState((s) => ({ ...s, retirementAge: v }))}
            min={50}
            max={75}
          />
        </InputBlock>

        <InputBlock
          label="Interest rate (assumed)"
          currentValue={`${state.interestRate.toFixed(2)}%`}
          helper="Roughly what the bank will charge."
          learnMore="A reasonable starting point: 9% for home loans, 11% for personal, 9% for auto. We use this to convert your affordable EMI back into a loan principal."
        >
          <RateSlider
            value={state.interestRate}
            onChange={(v) => setState((s) => ({ ...s, interestRate: v }))}
            min={0}
            max={20}
            step={0.05}
            ariaLabel="Assumed interest rate"
          />
        </InputBlock>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-ink-100">
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-2">How stable is your income?</p>
          <p className="text-xs text-ink-600 mb-3">
            Salaried with a permanent role = High. Freelance, sales, commission-heavy = Medium.
          </p>
          <TogglePills
            value={state.stability}
            onChange={(v) => setState((s) => ({ ...s, stability: v as IncomeStabilityLevel }))}
            options={[
              { value: 'HIGH', label: 'High — stable role' },
              { value: 'MEDIUM', label: 'Medium — variable' },
            ]}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-2">Do you have a backup fund?</p>
          <p className="text-xs text-ink-600 mb-3">
            6+ months of expenses saved up that you wouldn&apos;t touch for an EMI.
          </p>
          <TogglePills
            value={state.backup}
            onChange={(v) => setState((s) => ({ ...s, backup: v as BackupAvailability }))}
            options={[
              { value: 'YES', label: 'Yes' },
              { value: 'NO', label: 'No' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

// ---- Modes C/D/E: Optimization forms ---------------------------------------

function OptimizationForm({ state, setState }: { state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  return (
    <div className="space-y-6 mb-6">
      <div className="card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-4">
          Your existing loan
        </p>
        <LoanBasicsCard state={state} setState={setState} showStartDate />
      </div>

      <div className="card p-6">
        {state.mode === 'prepay' && <PrepaymentEditor state={state} setState={setState} />}
        {state.mode === 'emi-change' && <EmiChangeEditor state={state} setState={setState} />}
        {state.mode === 'rate-change' && <RateChangeEditor state={state} setState={setState} />}
      </div>
    </div>
  )
}

function PrepaymentEditor({ state, setState }: { state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const update = (i: number, patch: Partial<PrepaymentDraft>) => {
    setState((s) => ({
      ...s,
      prepayments: s.prepayments.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }))
  }
  const add = () =>
    setState((s) => ({
      ...s,
      prepayments: [...s.prepayments, { date: 'Jan-2030', amount: 100_000 }],
    }))
  const remove = (i: number) =>
    setState((s) => ({ ...s, prepayments: s.prepayments.filter((_, idx) => idx !== i) }))

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-1">
        Your planned prepayments
      </p>
      <p className="text-sm text-ink-600 mb-4">
        Lump-sum amounts you&apos;ll pay on top of your regular EMI, on a specific date.
      </p>
      <div className="space-y-3">
        {state.prepayments.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <MonthYearInput value={p.date} onChange={(v) => update(i, { date: v })} />
            <div className="flex-1">
              <CurrencyInput
                value={p.amount}
                onChange={(v) => update(i, { amount: v })}
                ariaLabel="Prepayment amount"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-ink-400 hover:text-saffron-700"
              aria-label="Remove prepayment"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
      >
        <PlusIcon className="h-4 w-4" />
        Add another prepayment
      </button>
    </div>
  )
}

function EmiChangeEditor({ state, setState }: { state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const update = (i: number, patch: Partial<EmiChangeDraft>) =>
    setState((s) => ({
      ...s,
      emiChanges: s.emiChanges.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }))
  const add = () =>
    setState((s) => ({ ...s, emiChanges: [...s.emiChanges, { date: 'Jan-2030', newEmi: 30_000 }] }))
  const remove = (i: number) =>
    setState((s) => ({ ...s, emiChanges: s.emiChanges.filter((_, idx) => idx !== i) }))

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-1">
        Your planned EMI changes
      </p>
      <p className="text-sm text-ink-600 mb-4">
        When you&apos;ll raise (or lower) your EMI and what the new amount will be.
      </p>
      <div className="space-y-3">
        {state.emiChanges.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <MonthYearInput value={p.date} onChange={(v) => update(i, { date: v })} />
            <div className="flex-1">
              <CurrencyInput
                value={p.newEmi}
                onChange={(v) => update(i, { newEmi: v })}
                ariaLabel="New EMI"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-ink-400 hover:text-saffron-700"
              aria-label="Remove EMI change"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
      >
        <PlusIcon className="h-4 w-4" />
        Add another change
      </button>
    </div>
  )
}

function RateChangeEditor({ state, setState }: { state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const update = (i: number, patch: Partial<RateChangeDraft>) =>
    setState((s) => ({
      ...s,
      rateChanges: s.rateChanges.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }))
  const add = () =>
    setState((s) => ({ ...s, rateChanges: [...s.rateChanges, { date: 'Jan-2030', newRate: 8.5 }] }))
  const remove = (i: number) =>
    setState((s) => ({ ...s, rateChanges: s.rateChanges.filter((_, idx) => idx !== i) }))

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-1">
        Rate changes
      </p>
      <p className="text-sm text-ink-600 mb-4">
        When the rate moved (or will move) and to what.
      </p>
      <div className="space-y-3">
        {state.rateChanges.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <MonthYearInput value={p.date} onChange={(v) => update(i, { date: v })} />
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                value={p.newRate ?? ''}
                onChange={(e) => {
                  const n = e.target.value === '' ? null : Number(e.target.value)
                  update(i, { newRate: n })
                }}
                className="w-24 px-3 py-2 bg-paper border border-ink-200 rounded-bk-md font-data tabular-nums text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
                aria-label="New rate percent"
              />
              <span className="text-ink-400">%</span>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-ink-400 hover:text-saffron-700"
              aria-label="Remove rate change"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
      >
        <PlusIcon className="h-4 w-4" />
        Add another change
      </button>
    </div>
  )
}

// ---- Headline ---------------------------------------------------------------

function Headline({
  state,
  result,
  onSave,
  saving,
}: {
  state: State
  result: ComputedResult
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="card p-8 mb-6 bg-forest-700 text-paper">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-200 mb-3">
        Here&apos;s what your loan looks like
      </p>
      <SentenceBody state={state} result={result} />
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-6 px-5 py-2.5 bg-paper text-forest-700 font-semibold rounded-bk-md hover:bg-forest-50 transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save this plan'}
      </button>
    </div>
  )
}

function SentenceBody({ state, result }: { state: State; result: ComputedResult }) {
  const big = 'text-4xl md:text-5xl font-data tabular-nums font-bold'

  switch (result.kind) {
    case 'basic': {
      const r = result.data
      const emi = parseFloat(r.emi)
      const interest = parseFloat(r.interestPayable)
      const total = parseFloat(r.total)
      const interestRatio = parseFloat(r.loanAmount) > 0 ? interest / parseFloat(r.loanAmount) : 0
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          Your monthly EMI is
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(emi)}</span>
          <span className="text-sm text-forest-200">
            Over {state.tenureYears} years you&apos;ll pay ₹{formatINRCompact(total)} total —
            including ₹{formatINRCompact(interest)} in interest ({(interestRatio * 100).toFixed(0)}% of
            the loan).
          </span>
        </p>
      )
    }
    case 'capacity': {
      const r = result.data
      const loan = parseFloat(r.advisableLoanAmount)
      const emi = parseFloat(r.monthlyEmiAffordable)
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          You can comfortably afford a loan of
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(loan)}</span>
          <span className="text-sm text-forest-200">
            That works out to an EMI of around ₹{formatINR(emi)}/month over {r.termOfLoan} years at{' '}
            {state.interestRate.toFixed(2)}%. Stability adjustment: {r.stabilityMultiplier}% of
            surplus retained.
          </span>
        </p>
      )
    }
    case 'prepay': {
      const r = result.data
      const totalPrepaid = state.prepayments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
      const tenureSaved = r.tenureReductionMonths
      const interestSaved = parseFloat(r.interestSaved)
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          Prepaying ₹{formatINR(totalPrepaid)} would save you
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(interestSaved)}</span>
          <span className="text-sm text-forest-200">
            in interest, and finish the loan {Math.floor(tenureSaved / 12)} years{' '}
            {tenureSaved % 12 > 0 ? `${tenureSaved % 12} months ` : ''}early.
          </span>
        </p>
      )
    }
    case 'emi-change': {
      const r = result.data
      if (r.diverged) {
        return (
          <p className="text-xl md:text-2xl leading-relaxed">
            <span className="text-saffron-200">
              Your new EMI is too small to cover the monthly interest — the loan would never
              close at this rate. Raise the EMI above the interest accrual.
            </span>
          </p>
        )
      }
      const tenureSaved = r.tenureReductionMonths
      const interestSaved = parseFloat(r.interestSaved)
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          Changing your EMI would save you
          <span className={`block mt-2 mb-1 ${big}`}>₹{formatINR(interestSaved)}</span>
          <span className="text-sm text-forest-200">
            in interest. The loan finishes {Math.floor(tenureSaved / 12)} years{' '}
            {tenureSaved % 12 > 0 ? `${tenureSaved % 12} months ` : ''}early. Final EMI: ₹
            {formatINR(parseFloat(r.finalEmi))}.
          </span>
        </p>
      )
    }
    case 'rate-change': {
      const r = result.data
      const aMonths = r.approachA.tenureChangeMonths
      const bEmiChange = parseFloat(r.approachB.emiChange)
      return (
        <p className="text-xl md:text-2xl leading-relaxed">
          You have two ways to respond to a rate change:
          <span className="block mt-3 space-y-1 text-base text-forest-200">
            <span className="block">
              <strong className="text-paper">Keep my EMI</strong> → tenure changes by{' '}
              <span className="font-data tabular-nums text-paper">{Math.abs(aMonths)} months</span>{' '}
              ({aMonths < 0 ? 'longer' : 'shorter'})
            </span>
            <span className="block">
              <strong className="text-paper">Keep my tenure</strong> → EMI changes by{' '}
              <span className="font-data tabular-nums text-paper">
                ₹{formatINR(Math.abs(bEmiChange))}/month
              </span>{' '}
              ({bEmiChange < 0 ? 'less' : 'more'})
            </span>
          </span>
        </p>
      )
    }
  }
}

// ---- Charts -----------------------------------------------------------------

function Charts({ state, result }: { state: State; result: ComputedResult }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-ink-900 mb-3">See it four ways</p>
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartsForMode state={state} result={result} />
      </div>
    </div>
  )
}

function ChartsForMode({ state, result }: { state: State; result: ComputedResult }) {
  switch (result.kind) {
    case 'basic':
      return <BasicCharts result={result.data} state={state} />
    case 'capacity':
      return <CapacityCharts result={result.data} state={state} />
    case 'prepay':
      return <PrepayCharts result={result.data} />
    case 'emi-change':
      return <EmiChangeCharts result={result.data} />
    case 'rate-change':
      return <RateChangeCharts result={result.data} />
  }
}

function BasicCharts({ result, state }: { result: EMICalculatorResult; state: State }) {
  const principal = parseFloat(result.loanAmount)
  const interest = parseFloat(result.interestPayable)

  // Tenure-sensitivity: same loan, what would EMI + total interest look like
  // at 10y vs current vs 30y. Teaches the tenure tradeoff.
  const tenureBars = useMemo(() => {
    const tenures = [10, state.tenureYears, 30].filter((v, i, a) => a.indexOf(v) === i)
    return tenures.map((years) => {
      const r = calculateEmi({
        loanAmount: state.loanAmount,
        tenure: years,
        tenureType: 'YEAR',
        interestRate: state.interestRate,
      })
      return {
        name: `${years} years`,
        emi: parseFloat(r.emi),
        interest: parseFloat(r.interestPayable),
        highlight: years === state.tenureYears,
      }
    })
  }, [state.loanAmount, state.interestRate, state.tenureYears])

  return (
    <>
      <ChartCard
        title="Where your money goes"
        takeaway={`Of every rupee you pay, ₹${(principal / (principal + interest)).toFixed(2)} goes to the loan itself; the rest is interest the bank earns.`}
      >
        <div className="flex justify-center py-2">
          <Donut
            segments={[
              { label: 'Principal', value: principal, color: FOREST_700 },
              { label: 'Interest', value: interest, color: FOREST_200 },
            ]}
            size={200}
            thickness={0.32}
            centerLabel={`₹${formatINRCompact(parseFloat(result.total))}`}
            centerSubLabel="total payable"
          />
        </div>
      </ChartCard>

      <ChartCard
        title="What tenure does to your EMI"
        takeaway="Longer tenure = smaller EMI but a lot more total interest. The bank's friend, not always yours."
      >
        <TenureBarsChart bars={tenureBars} />
      </ChartCard>

      <ChartCard
        title="Principal vs interest, year by year"
        takeaway="Early years are mostly interest. The principal starts paying down meaningfully only later — which is why prepayments help most in the first half."
      >
        <AmortizationArea rows={result.amortisationResponse} height={240} />
      </ChartCard>

      <ChartCard
        title="The full schedule"
        takeaway="Every month: opening balance, interest paid, principal paid, closing balance."
      >
        <ScheduleTable rows={result.amortisationResponse} />
      </ChartCard>
    </>
  )
}

function CapacityCharts({ result, state }: { result: EMICapacityResult; state: State }) {
  const income = state.netIncome
  const expenses = state.expenses
  const existingEmi = state.existingEmi
  const additional = state.additionalIncome
  const surplus = parseFloat(result.surplusMoney)
  const adjustedSurplus = parseFloat(result.surplus)
  const emiCapacity = parseFloat(result.emiCapacity)
  const advisableLoan = parseFloat(result.advisableLoanAmount)

  // Sensitivity: loan capacity at different rates.
  const rateBars = useMemo(() => {
    const rates = [7, 8, 9, 10, 11]
    return rates.map((rate) => {
      const r = calculateEmiCapacity({
        currentAge: state.currentAge,
        retirementAge: state.retirementAge,
        netFamilyIncome: state.netIncome,
        existingEmi: state.existingEmi,
        houseHoldExpense: state.expenses,
        additionalIncome: state.additionalIncome,
        stability: state.stability,
        backUp: state.backup,
        interestRate: rate,
      })
      return {
        name: `${rate}%`,
        value: parseFloat(r.advisableLoanAmount),
        highlight: Math.abs(rate - state.interestRate) < 0.5,
      }
    })
  }, [state])

  return (
    <>
      <ChartCard
        title="Where your monthly money goes"
        takeaway={`After expenses and existing EMIs, you have ₹${formatINR(surplus)} of monthly surplus. We multiply by ${result.stabilityMultiplier}% (stability + backup) for the safe EMI capacity.`}
      >
        <div className="flex justify-center py-2">
          <Donut
            segments={[
              { label: 'Expenses', value: expenses, color: '#9DD4BB' },
              { label: 'Existing EMIs', value: existingEmi || 0.001, color: '#F0CC7A' },
              { label: 'Surplus → EMI capacity', value: Math.max(0, surplus), color: FOREST_700 },
            ]}
            size={200}
            thickness={0.32}
            centerLabel={`₹${formatINRCompact(income + additional)}`}
            centerSubLabel="monthly inflow"
          />
        </div>
      </ChartCard>

      <ChartCard
        title="How rate affects the loan you can take"
        takeaway="At your income, a 1% higher rate typically shrinks the affordable loan by 8-10%."
      >
        <CategoricalBarChart
          bars={rateBars}
          unitFormat={(v) => formatINRCompact(v)}
        />
      </ChartCard>

      <ChartCard
        title="Stability matters"
        takeaway={`Banks treat ${state.stability === 'HIGH' ? 'high' : 'medium'} stability ${state.backup === 'YES' ? 'with a backup fund' : 'without backup'} as ${result.stabilityMultiplier}% of your surplus. The rest is a safety margin.`}
      >
        <StabilityExplainer
          surplus={surplus}
          adjusted={adjustedSurplus}
          capacity={emiCapacity}
          multiplierPct={parseFloat(result.stabilityMultiplier)}
        />
      </ChartCard>

      <ChartCard
        title="Your numbers, in a row"
        takeaway="The stack: gross surplus, then safety-adjusted surplus, then EMI capacity, then the loan principal that EMI services over your tenure."
      >
        <CapacityNumbersGrid
          surplus={surplus}
          adjusted={adjustedSurplus}
          capacity={emiCapacity}
          loan={advisableLoan}
          tenure={result.termOfLoan}
        />
      </ChartCard>
    </>
  )
}

function PrepayCharts({ result }: { result: PartialPaymentResult }) {
  const beforeMonths = result.originalTenureMonths
  const afterMonths = result.revisedTenureMonths
  const beforeInterest = parseFloat(result.originalTotalInterest)
  const afterInterest = parseFloat(result.totalInterestNow)
  const interestSaved = parseFloat(result.interestSaved)

  return (
    <>
      <ChartCard
        title="Tenure: before vs after"
        takeaway={
          afterMonths < beforeMonths
            ? `Your prepayments cut ${beforeMonths - afterMonths} months off the loan — that's ${((beforeMonths - afterMonths) / 12).toFixed(1)} years of EMIs you never have to pay.`
            : `Add prepayments above to see your tenure shrink.`
        }
      >
        <BeforeAfterPair
          beforeLabel="Without prepayment"
          afterLabel="With prepayments"
          beforeValue={beforeMonths}
          afterValue={afterMonths}
          unit="months"
          format={(v) => `${Math.floor(v / 12)}y ${v % 12}m`}
          better="lower"
        />
      </ChartCard>

      <ChartCard
        title="Interest saved"
        takeaway={
          interestSaved > 0
            ? `That's ₹${formatINRCompact(interestSaved)} you keep instead of paying it as interest. Often this is much more than the prepayment amount itself.`
            : 'Add prepayments above to see your interest savings.'
        }
      >
        <BeforeAfterPair
          beforeLabel="Without prepayment"
          afterLabel="With prepayments"
          beforeValue={beforeInterest}
          afterValue={afterInterest}
          unit="₹"
          format={(v) => formatINRCompact(v)}
          better="lower"
        />
      </ChartCard>

      <ChartCard
        title="Year-by-year, with prepayments"
        takeaway="Each year's principal and interest portion — prepayments stack into the principal column."
      >
        <AmortizationArea rows={result.newAmortisation} height={240} />
      </ChartCard>

      <ChartCard
        title="Full schedule"
        takeaway="Every month, including prepayment rows. Useful for matching to your bank statement."
      >
        <ScheduleTable rows={result.newAmortisation} />
      </ChartCard>
    </>
  )
}

function EmiChangeCharts({ result }: { result: EmiChangeResult }) {
  if (result.diverged) {
    return (
      <>
        <ChartCard
          title="Heads up"
          takeaway="At least one of your planned EMIs is smaller than the monthly interest at that point — so the loan balance would grow forever. Bump that EMI above the interest accrual to make the schedule close."
        >
          <p className="text-sm text-ink-600 p-4 bg-saffron-50 rounded-bk-md">
            Original EMI: ₹{formatINR(parseFloat(result.originalEmi))}. Your planned change drops
            it below the monthly interest, which is mathematically not amortizable. Try raising
            it, or use the rate-change scenario instead.
          </p>
        </ChartCard>
        <div className="card p-6 flex items-center justify-center text-ink-400">—</div>
        <div className="card p-6 flex items-center justify-center text-ink-400">—</div>
        <div className="card p-6 flex items-center justify-center text-ink-400">—</div>
      </>
    )
  }

  const beforeMonths = result.originalTenureMonths
  const afterMonths = result.revisedTenureMonths
  const beforeInterest = parseFloat(result.originalTotalInterest)
  const afterInterest = parseFloat(result.totalInterestNow)

  return (
    <>
      <ChartCard
        title="Tenure: before vs after"
        takeaway={
          afterMonths < beforeMonths
            ? `Raising your EMI cuts ${beforeMonths - afterMonths} months off the loan.`
            : afterMonths > beforeMonths
              ? `Lowering your EMI extends the loan by ${afterMonths - beforeMonths} months and costs more in interest.`
              : 'No change to tenure at this EMI.'
        }
      >
        <BeforeAfterPair
          beforeLabel="Original EMI"
          afterLabel="New EMI"
          beforeValue={beforeMonths}
          afterValue={afterMonths}
          unit="months"
          format={(v) => `${Math.floor(v / 12)}y ${v % 12}m`}
          better="lower"
        />
      </ChartCard>

      <ChartCard
        title="Interest difference"
        takeaway={
          beforeInterest > afterInterest
            ? `Total interest drops by ₹${formatINRCompact(beforeInterest - afterInterest)}.`
            : `Lower EMI means more interest paid (₹${formatINRCompact(afterInterest - beforeInterest)} extra).`
        }
      >
        <BeforeAfterPair
          beforeLabel="Original total"
          afterLabel="With change"
          beforeValue={beforeInterest}
          afterValue={afterInterest}
          unit="₹"
          format={(v) => formatINRCompact(v)}
          better="lower"
        />
      </ChartCard>

      <ChartCard
        title="Year-by-year"
        takeaway="Principal and interest paid each year under the new EMI schedule."
      >
        <AmortizationArea rows={result.newAmortisation} height={240} />
      </ChartCard>

      <ChartCard title="Full schedule" takeaway="Each month's EMI is shown alongside its split.">
        <ScheduleTable rows={result.newAmortisation} />
      </ChartCard>
    </>
  )
}

function RateChangeCharts({ result }: { result: RateChangeResult }) {
  const a = result.approachA
  const b = result.approachB
  const originalInterest = parseFloat(result.originalTotalInterest)
  const aInterest = parseFloat(a.totalInterest)
  const bInterest = parseFloat(b.totalInterest)

  return (
    <>
      <ChartCard
        title="Tenure under each approach"
        takeaway={
          a.revisedTenureMonths < result.originalTenureMonths
            ? 'Keeping the same EMI means you finish faster (when the rate dropped).'
            : a.revisedTenureMonths > result.originalTenureMonths
              ? 'Keeping the same EMI means the loan takes longer (when the rate rose).'
              : 'No tenure change at this rate.'
        }
      >
        <CategoricalBarChart
          bars={[
            { name: 'Original', value: result.originalTenureMonths },
            { name: 'Keep EMI', value: a.revisedTenureMonths, highlight: true },
            { name: 'Keep tenure', value: b.revisedTenureMonths },
          ]}
          unitFormat={(v) => `${Math.floor(v / 12)}y ${v % 12}m`}
        />
      </ChartCard>

      <ChartCard
        title="Total interest under each approach"
        takeaway="Compare the lifetime interest. Lower is better for you."
      >
        <CategoricalBarChart
          bars={[
            { name: 'Original', value: originalInterest },
            { name: 'Keep EMI', value: aInterest },
            { name: 'Keep tenure', value: bInterest, highlight: true },
          ]}
          unitFormat={(v) => formatINRCompact(v)}
        />
      </ChartCard>

      <ChartCard
        title="Keep EMI → tenure adjusts"
        takeaway={`Final EMI: ₹${formatINR(parseFloat(a.finalEmi))}. Total interest: ₹${formatINRCompact(aInterest)}.`}
      >
        <AmortizationArea rows={a.newAmortisation} height={240} />
      </ChartCard>

      <ChartCard
        title="Keep tenure → EMI adjusts"
        takeaway={`Final EMI: ₹${formatINR(parseFloat(b.finalEmi))}. Total interest: ₹${formatINRCompact(bInterest)}.`}
      >
        <AmortizationArea rows={b.newAmortisation} height={240} />
      </ChartCard>
    </>
  )
}

// ---- Three lessons recap ----------------------------------------------------

function ThreeLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: ComputedResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  return (
    <div className="card p-8 mb-6 bg-forest-50 border-2 border-forest-200">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-700 mb-1">
        For your future self
      </p>
      <h2 className="text-2xl font-serif text-ink-900 mb-6">Three things to take away</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <LessonsForMode state={state} result={result} setState={setState} />
      </div>
    </div>
  )
}

function LessonsForMode({
  state,
  result,
  setState,
}: {
  state: State
  result: ComputedResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  switch (result.kind) {
    case 'basic':
      return <BasicLessons state={state} result={result.data} setState={setState} />
    case 'capacity':
      return <CapacityLessons state={state} result={result.data} setState={setState} />
    case 'prepay':
      return <PrepayLessons state={state} result={result.data} setState={setState} />
    case 'emi-change':
      return <EmiChangeLessons state={state} result={result.data} setState={setState} />
    case 'rate-change':
      return <RateChangeLessons state={state} result={result.data} setState={setState} />
  }
}

function BasicLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: EMICalculatorResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  const principal = parseFloat(result.loanAmount)
  const interest = parseFloat(result.interestPayable)
  // Same loan, 10 years shorter — how much interest saved?
  const shorterTenure = Math.max(5, state.tenureYears - 10)
  const shorterRes = calculateEmi({
    loanAmount: state.loanAmount,
    tenure: shorterTenure,
    tenureType: 'YEAR',
    interestRate: state.interestRate,
  })
  const shorterInterestSaved = interest - parseFloat(shorterRes.interestPayable)
  // 1% lower rate
  const cheaperRes = calculateEmi({
    loanAmount: state.loanAmount,
    tenure: state.tenureYears,
    tenureType: 'YEAR',
    interestRate: Math.max(0, state.interestRate - 1),
  })
  const rateSavings = interest - parseFloat(cheaperRes.interestPayable)

  return (
    <>
      <LessonCard
        number="1"
        title="Tenure costs interest, more than you think"
        body={
          <>
            Your loan&apos;s total interest is{' '}
            <strong>₹{formatINR(interest)}</strong> — that&apos;s{' '}
            <strong>{((interest / principal) * 100).toFixed(0)}%</strong> of the principal. A
            10-year shorter tenure would save you ~₹{formatINRCompact(shorterInterestSaved)}.
          </>
        }
        cta={{
          label: `Try it: ${shorterTenure}-year loan`,
          onClick: () => setState((s) => ({ ...s, tenureYears: shorterTenure })),
        }}
      />
      <LessonCard
        number="2"
        title="A small rate cut is a big deal"
        body={
          <>
            1% off your rate would save{' '}
            <strong>~₹{formatINRCompact(rateSavings)}</strong> in interest over the life of this
            loan. Always negotiate, or check if a different bank offers lower.
          </>
        }
        cta={{
          label: 'Try it: rate is 1% lower',
          onClick: () =>
            setState((s) => ({ ...s, interestRate: Math.max(0, s.interestRate - 1) })),
        }}
      />
      <LessonCard
        number="3"
        title="Prepayments would save a lot"
        body={
          <>
            Even a small prepayment early in the loan saves disproportionately. Switch to the
            prepayment scenario and try a one-time ₹1L prepayment in year 5 to see for yourself.
          </>
        }
        cta={{
          label: 'Open prepayment scenario',
          onClick: () => setState((s) => ({ ...s, mode: 'prepay' })),
        }}
      />
    </>
  )
}

function CapacityLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: EMICapacityResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  const emiCapacity = parseFloat(result.emiCapacity)
  const totalEmiRatio = ((emiCapacity + state.existingEmi) / state.netIncome) * 100

  return (
    <>
      <LessonCard
        number="1"
        title="Keep total EMIs under 50% of income"
        body={
          <>
            At your numbers, your total EMI load (existing + new) would be{' '}
            <strong>{totalEmiRatio.toFixed(0)}%</strong> of your net income. Banks consider 50%
            the absolute ceiling; lenders prefer 40% or lower.
          </>
        }
        cta={{
          label: 'Try it: 1% lower rate',
          onClick: () =>
            setState((s) => ({ ...s, interestRate: Math.max(0, s.interestRate - 1) })),
        }}
      />
      <LessonCard
        number="2"
        title="Backup fund changes everything"
        body={
          <>
            Stability + backup currently gets you a{' '}
            <strong>{result.stabilityMultiplier}%</strong> multiplier on your surplus.
            With no backup, banks (and you) trim 10-20% off your safe EMI capacity.
          </>
        }
        cta={{
          label: state.backup === 'YES' ? 'Try it: no backup' : 'Try it: with backup',
          onClick: () =>
            setState((s) => ({ ...s, backup: s.backup === 'YES' ? 'NO' : 'YES' })),
        }}
      />
      <LessonCard
        number="3"
        title="See the actual EMI you&apos;d pay"
        body={
          <>
            Your affordable loan is ₹{formatINR(parseFloat(result.advisableLoanAmount))}. Switch
            to &quot;What will my EMI be?&quot; with that number to see the full schedule and
            year-by-year breakdown.
          </>
        }
        cta={{
          label: 'See the EMI schedule',
          onClick: () =>
            setState((s) => ({
              ...s,
              mode: 'basic',
              loanAmount: Math.round(parseFloat(result.advisableLoanAmount)),
              tenureYears: result.termOfLoan,
            })),
        }}
      />
    </>
  )
}

function PrepayLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: PartialPaymentResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  const totalPrepaid = state.prepayments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const interestSaved = parseFloat(result.interestSaved)
  const savingsRatio = totalPrepaid > 0 ? interestSaved / totalPrepaid : 0

  return (
    <>
      <LessonCard
        number="1"
        title="Early prepayments save the most"
        body={
          <>
            Every ₹1 you prepay early saves <strong>~₹{savingsRatio.toFixed(2)}</strong> in future
            interest. Prepayments late in the loan save much less — most of the interest has
            already accrued.
          </>
        }
        cta={{
          label: 'Try it: prepay earlier',
          onClick: () =>
            setState((s) => ({
              ...s,
              prepayments: s.prepayments.map((p, i) =>
                i === 0 ? { ...p, date: shiftMonth(p.date, -24) } : p,
              ),
            })),
        }}
      />
      <LessonCard
        number="2"
        title="Lump-sum or bigger EMI?"
        body={
          <>
            Both save interest. Lump-sum prepayments win when you have a one-time windfall
            (bonus, gift). A bigger EMI wins when you have steady extra capacity. Try the EMI
            change scenario for the same loan.
          </>
        }
        cta={{
          label: 'Compare with EMI change',
          onClick: () => setState((s) => ({ ...s, mode: 'emi-change' })),
        }}
      />
      <LessonCard
        number="3"
        title="Watch out for tax benefits"
        body={
          <>
            Home loans give a tax deduction on both principal (₹1.5L u/s 80C) and interest
            (₹2L u/s 24). Heavy prepayment reduces future interest, but also future deductions —
            usually still a net win, but worth checking with a CA.
          </>
        }
        cta={{ label: 'Got it', onClick: () => undefined }}
      />
    </>
  )
}

function EmiChangeLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: EmiChangeResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  void result
  return (
    <>
      <LessonCard
        number="1"
        title="Bumping EMI compounds"
        body={
          <>
            Even a 10% higher EMI typically cuts your loan tenure by 2-3 years and saves 15-20%
            of the total interest. The math heavily favours paying more, sooner.
          </>
        }
        cta={{
          label: 'Try it: EMI +10%',
          onClick: () =>
            setState((s) => ({
              ...s,
              emiChanges: s.emiChanges.map((c, i) =>
                i === 0 && c.newEmi ? { ...c, newEmi: Math.round(c.newEmi * 1.1) } : c,
              ),
            })),
        }}
      />
      <LessonCard
        number="2"
        title="Banks allow EMI changes"
        body={
          <>
            Most lenders let you increase your EMI without a fee (and often via a one-line form
            online). Decreases require approval and a reset. Plan to increase when your salary
            does.
          </>
        }
        cta={{ label: 'Got it', onClick: () => undefined }}
      />
      <LessonCard
        number="3"
        title="What about a lump-sum instead?"
        body={
          <>
            A one-time prepayment and a bumped EMI are different shapes of the same idea.
            Prepayment helps once, then you go back to original EMI; a bumped EMI keeps helping
            every month.
          </>
        }
        cta={{
          label: 'Compare with prepayment',
          onClick: () => setState((s) => ({ ...s, mode: 'prepay' })),
        }}
      />
    </>
  )
}

function RateChangeLessons({
  state,
  result,
  setState,
}: {
  state: State
  result: RateChangeResult
  setState: React.Dispatch<React.SetStateAction<State>>
}) {
  void state
  void result
  return (
    <>
      <LessonCard
        number="1"
        title="Keep EMI = pay less total"
        body={
          <>
            When rates fall and you keep your EMI, the extra goes to principal — so you finish
            earlier and pay less total interest. This is almost always the better option.
          </>
        }
        cta={{ label: 'Got it', onClick: () => undefined }}
      />
      <LessonCard
        number="2"
        title="Keep tenure = more cash now"
        body={
          <>
            Lower EMI means more cash in hand monthly. Useful if you genuinely need that cash;
            wasteful if it just goes to lifestyle creep. Default to keeping the EMI unless you
            have a clear use.
          </>
        }
        cta={{ label: 'Got it', onClick: () => undefined }}
      />
      <LessonCard
        number="3"
        title="Floating rates work both ways"
        body={
          <>
            Most home loans in India are floating-rate, indexed to the bank&apos;s lending rate.
            When the RBI cuts repo rate, your EMI (or tenure) updates within a few months.
            Watch for the bank&apos;s communication.
          </>
        }
        cta={{ label: 'Got it', onClick: () => undefined }}
      />
    </>
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

// ---- Shared subcomponents ---------------------------------------------------

function ChartCard({
  title,
  takeaway,
  children,
}: {
  title: string
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

function InputBlock({
  label,
  currentValue,
  helper,
  learnMore,
  children,
}: {
  label: string
  currentValue: string
  helper: string
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

function NumberStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div className="inline-flex items-center bg-paper border border-ink-200 rounded-bk-md">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-3 py-2 text-ink-600 hover:text-forest-700"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), max))
        }}
        className="w-16 text-center bg-transparent font-data tabular-nums text-ink-900 outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-3 py-2 text-ink-600 hover:text-forest-700"
      >
        +
      </button>
    </div>
  )
}

function MonthYearInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder="Jan-2024"
      onChange={(e) => onChange(e.target.value)}
      className="w-28 px-3 py-2 bg-paper border border-ink-200 rounded-bk-md font-data tabular-nums text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
      aria-label="Month and year"
    />
  )
}

// ---- Helper charts ----------------------------------------------------------

function TenureBarsChart({
  bars,
}: {
  bars: { name: string; emi: number; interest: number; highlight: boolean }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={bars} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={INK_100} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
        />
        <YAxis
          stroke={INK_400}
          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          tickFormatter={(v) => formatINRCompact(Number(v))}
          width={56}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FAF8F0',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
          formatter={(value, name) => [
            `₹${formatINR(Number(value) || 0)}`,
            name === 'emi' ? 'Monthly EMI' : 'Total interest',
          ]}
        />
        <Bar dataKey="emi" name="emi">
          {bars.map((b, i) => (
            <Cell key={i} fill={b.highlight ? FOREST_700 : FOREST_200} />
          ))}
        </Bar>
        <Bar dataKey="interest" name="interest">
          {bars.map((b, i) => (
            <Cell key={i} fill={b.highlight ? SAFFRON_400 : '#F0CC7A'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function CategoricalBarChart({
  bars,
  unitFormat,
}: {
  bars: { name: string; value: number; highlight?: boolean }[]
  unitFormat: (n: number) => string
}) {
  const maxVal = Math.max(...bars.map((b) => b.value), 1)
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={bars} layout="vertical" margin={{ top: 8, right: 36, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={INK_100} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, maxVal * 1.2]}
          stroke={INK_400}
          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          tickFormatter={unitFormat}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={INK_400}
          tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FAF8F0',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
          formatter={(value) => [unitFormat(Number(value) || 0), '']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {bars.map((b, i) => (
            <Cell key={i} fill={b.highlight ? FOREST_700 : FOREST_200} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(label) => unitFormat(Number(label) || 0)}
            style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: INK_400 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BeforeAfterPair({
  beforeLabel,
  afterLabel,
  beforeValue,
  afterValue,
  format,
  better,
}: {
  beforeLabel: string
  afterLabel: string
  beforeValue: number
  afterValue: number
  unit: string
  format: (n: number) => string
  better: 'higher' | 'lower'
}) {
  const max = Math.max(beforeValue, afterValue, 1)
  const beforePct = (beforeValue / max) * 100
  const afterPct = (afterValue / max) * 100
  const isImproved = better === 'lower' ? afterValue < beforeValue : afterValue > beforeValue
  const afterColor = afterValue === beforeValue ? INK_400 : isImproved ? FOREST_400 : SAFFRON_400

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-ink-400">{beforeLabel}</span>
          <span className="text-sm font-data tabular-nums text-ink-600">{format(beforeValue)}</span>
        </div>
        <div className="h-3 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-[width] duration-300"
            style={{ width: `${beforePct}%`, backgroundColor: INK_400 }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-ink-900 font-semibold">{afterLabel}</span>
          <span
            className="text-sm font-data tabular-nums font-semibold"
            style={{ color: afterColor }}
          >
            {format(afterValue)}
          </span>
        </div>
        <div className="h-3 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-[width,background-color] duration-300"
            style={{ width: `${afterPct}%`, backgroundColor: afterColor }}
          />
        </div>
      </div>
    </div>
  )
}

function StabilityExplainer({
  surplus,
  adjusted,
  capacity,
  multiplierPct,
}: {
  surplus: number
  adjusted: number
  capacity: number
  multiplierPct: number
}) {
  return (
    <div className="space-y-3 text-sm">
      <Row label="Gross surplus (income − expenses − other EMIs)" value={`₹${formatINR(surplus)}`} />
      <Row label={`× ${multiplierPct}% (stability multiplier)`} value="" muted />
      <Row label="Safe surplus after multiplier" value={`₹${formatINR(adjusted)}`} bold />
      <Row label="+ other reliable income" value="" muted />
      <Row label="= Monthly EMI you can afford" value={`₹${formatINR(capacity)}`} highlight />
    </div>
  )
}

function Row({
  label,
  value,
  muted,
  bold,
  highlight,
}: {
  label: string
  value: string
  muted?: boolean
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        highlight ? 'pt-2 border-t border-forest-200' : ''
      }`}
    >
      <span className={`${muted ? 'text-ink-400 text-xs' : 'text-ink-600'} ${bold ? 'font-semibold text-ink-900' : ''}`}>
        {label}
      </span>
      <span
        className={`font-data tabular-nums ${
          highlight ? 'text-forest-700 font-bold text-lg' : bold ? 'text-ink-900 font-semibold' : 'text-ink-600'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function CapacityNumbersGrid({
  surplus,
  adjusted,
  capacity,
  loan,
  tenure,
}: {
  surplus: number
  adjusted: number
  capacity: number
  loan: number
  tenure: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <GridStat label="Gross surplus" value={`₹${formatINR(surplus)}`} />
      <GridStat label="Adjusted surplus" value={`₹${formatINR(adjusted)}`} />
      <GridStat label="Monthly EMI capacity" value={`₹${formatINR(capacity)}`} />
      <GridStat label="Tenure" value={`${tenure} years`} />
      <GridStat label="Advisable loan" value={`₹${formatINRCompact(loan)}`} highlight />
    </div>
  )
}

function GridStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`p-3 rounded-bk-md ${
        highlight ? 'bg-forest-100 border border-forest-200' : 'bg-ink-100'
      }`}
    >
      <p className="text-xs text-ink-400 mb-1">{label}</p>
      <p
        className={`font-data tabular-nums font-semibold ${
          highlight ? 'text-forest-700 text-lg' : 'text-ink-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function ScheduleTable({
  rows,
}: {
  rows: Array<{
    monthNumber: number
    date: string
    interest: string
    principal: string
    closingBalance: string
  }>
}) {
  return (
    <div className="max-h-[240px] overflow-y-auto -mx-2 text-sm">
      <table className="w-full">
        <thead className="sticky top-0 bg-paper">
          <tr className="text-left text-xs uppercase tracking-[0.12em] text-ink-400 border-b border-ink-100">
            <th className="py-2 px-2">#</th>
            <th className="py-2 px-2">Date</th>
            <th className="py-2 px-2 text-right">Interest</th>
            <th className="py-2 px-2 text-right">Principal</th>
            <th className="py-2 px-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 240).map((r) => (
            <tr key={r.monthNumber} className="border-b border-ink-100/50">
              <td className="py-1.5 px-2 font-data tabular-nums text-ink-400">{r.monthNumber}</td>
              <td className="py-1.5 px-2 text-ink-600">{r.date}</td>
              <td className="py-1.5 px-2 text-right font-data tabular-nums text-ink-600">
                ₹{formatINRCompact(parseFloat(r.interest))}
              </td>
              <td className="py-1.5 px-2 text-right font-data tabular-nums text-forest-700">
                ₹{formatINRCompact(parseFloat(r.principal))}
              </td>
              <td className="py-1.5 px-2 text-right font-data tabular-nums text-ink-600">
                ₹{formatINRCompact(parseFloat(r.closingBalance))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Compute --------------------------------------------------------------

function computeResult(state: State): ComputedResult {
  switch (state.mode) {
    case 'basic':
      return {
        kind: 'basic',
        data: calculateEmi({
          loanAmount: state.loanAmount,
          tenure: state.tenureYears,
          tenureType: 'YEAR',
          interestRate: state.interestRate,
        }),
      }
    case 'capacity':
      return {
        kind: 'capacity',
        data: calculateEmiCapacity({
          currentAge: state.currentAge,
          retirementAge: state.retirementAge,
          netFamilyIncome: state.netIncome,
          existingEmi: state.existingEmi,
          houseHoldExpense: state.expenses,
          additionalIncome: state.additionalIncome,
          stability: state.stability,
          backUp: state.backup,
          interestRate: state.interestRate,
        }),
      }
    case 'prepay':
      return {
        kind: 'prepay',
        data: calculatePartialPayment({
          loanAmount: state.loanAmount,
          interestRate: state.interestRate,
          tenure: state.tenureYears,
          tenureType: 'YEAR',
          loanDate: state.loanStartDate,
          partialPaymentReq: state.prepayments
            .filter((p) => (p.amount ?? 0) > 0 && p.date.trim())
            .map((p) => ({ partPayDate: p.date.trim(), partPayAmount: p.amount as number })),
        }),
      }
    case 'emi-change':
      return {
        kind: 'emi-change',
        data: calculateEmiChange({
          loanAmount: state.loanAmount,
          interestRate: state.interestRate,
          tenure: state.tenureYears,
          tenureType: 'YEAR',
          loanDate: state.loanStartDate,
          emiChangeReq: state.emiChanges
            .filter((c) => (c.newEmi ?? 0) > 0 && c.date.trim())
            .map((c) => ({ emiChangedDate: c.date.trim(), newEmi: c.newEmi as number })),
        }),
      }
    case 'rate-change':
      return {
        kind: 'rate-change',
        data: calculateRateChange({
          loanAmount: state.loanAmount,
          interestRate: state.interestRate,
          tenure: state.tenureYears,
          tenureType: 'YEAR',
          loanDate: state.loanStartDate,
          interestChangeReq: state.rateChanges
            .filter((c) => (c.newRate ?? 0) >= 0 && c.date.trim())
            .map((c) => ({
              interestChangedDate: c.date.trim(),
              changedRate: c.newRate as number,
            })),
        }),
      }
  }
}

// ---- Utilities --------------------------------------------------------------

function shiftMonth(input: string, deltaMonths: number): string {
  // Parse MMM-yyyy and shift by N months. Falls through to original on parse fail.
  const m = input.trim().match(/^([A-Za-z]{3})-(\d{4})$/)
  if (!m) return input
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = monthNames.findIndex((n) => n.toLowerCase() === m[1].toLowerCase())
  if (idx < 0) return input
  const year = parseInt(m[2], 10)
  const total = year * 12 + idx + deltaMonths
  const newYear = Math.floor(total / 12)
  const newMonth = total - newYear * 12
  return `${monthNames[((newMonth % 12) + 12) % 12]}-${newYear}`
}

// ---- URL state --------------------------------------------------------------

const URL_KEYS: Array<[keyof State, string]> = [
  ['mode', 'mode'],
  ['loanAmount', 'amt'],
  ['interestRate', 'r'],
  ['tenureYears', 'n'],
  ['loanStartDate', 'd'],
  ['currentAge', 'age'],
  ['retirementAge', 'ret'],
  ['netIncome', 'inc'],
  ['existingEmi', 'eemi'],
  ['expenses', 'exp'],
  ['additionalIncome', 'add'],
  ['stability', 'stab'],
  ['backup', 'bkp'],
]

function hydrateFromUrl(searchParams: URLSearchParams | null, defaults: State): State {
  if (!searchParams) return defaults
  const out: State = { ...defaults }
  for (const [stateKey, urlKey] of URL_KEYS) {
    const raw = searchParams.get(urlKey)
    if (raw == null) continue
    if (stateKey === 'mode') {
      if (['basic', 'capacity', 'prepay', 'emi-change', 'rate-change'].includes(raw)) {
        (out as any)[stateKey] = raw as Mode
      }
    } else if (stateKey === 'stability') {
      if (raw === 'HIGH' || raw === 'MEDIUM') (out as any)[stateKey] = raw
    } else if (stateKey === 'backup') {
      if (raw === 'YES' || raw === 'NO') (out as any)[stateKey] = raw
    } else if (stateKey === 'loanStartDate') {
      (out as any)[stateKey] = raw
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
    if (typeof v === 'number') params.set(urlKey, String(v))
    else params.set(urlKey, String(v))
  }
  return params.toString()
}
