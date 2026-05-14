'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

import { calculateRateChange } from '@/lib/calculators/rateChange'
import {
  EMITenureType,
  InterestChangeEntry,
  RateChangeApproachResult,
  RateChangeResult,
} from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'
import { useDebouncedCalc } from '@/lib/hooks/useDebouncedCalc'
import { CurrencySlider } from '@/app/components/inputs/CurrencySlider'
import { RateSlider } from '@/app/components/inputs/RateSlider'
import { TenureChips } from '@/app/components/inputs/TenureChips'
import { TogglePills } from '@/app/components/inputs/TogglePills'
import { BeforeAfterBars, BeforeAfterMetric } from '@/app/components/charts/BeforeAfterBars'
import { formatINR, formatINRCompact } from '@/lib/format-currency'

interface ChangeDraft {
  interestChangedDate: string
  changedRate: number | null
}

const DEFAULT_CHANGES: ChangeDraft[] = [
  { interestChangedDate: 'Jun-2029', changedRate: 7 },
]

type ApproachKey = 'A' | 'B'

export default function RateChangePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [authChecking, setAuthChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSchedule, setShowSchedule] = useState<ApproachKey | null>(null)

  const [loanAmount, setLoanAmount] = useState(3_000_000)
  const [tenureYears, setTenureYears] = useState(20)
  const [tenureType, setTenureType] = useState<EMITenureType>('YEAR')
  const [interestRate, setInterestRate] = useState(8)
  const [loanDate, setLoanDate] = useState('Jan-2024')
  const [changes, setChanges] = useState<ChangeDraft[]>(DEFAULT_CHANGES)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) router.push('/auth/signin')
      })
      .finally(() => setAuthChecking(false))
  }, [router])

  const cleanChanges = useMemo<InterestChangeEntry[]>(
    () =>
      changes
        .filter(
          (c) =>
            c.interestChangedDate.trim() &&
            typeof c.changedRate === 'number' &&
            Number.isFinite(c.changedRate) &&
            c.changedRate >= 0
        )
        .map((c) => ({
          interestChangedDate: c.interestChangedDate.trim(),
          changedRate: Number(c.changedRate),
        })),
    [changes]
  )

  const inputsPayload = useMemo(
    () => ({
      loanAmount,
      tenure: tenureYears,
      tenureType,
      interestRate,
      loanDate,
      changes: cleanChanges,
    }),
    [loanAmount, tenureYears, tenureType, interestRate, loanDate, cleanChanges]
  )

  const results = useDebouncedCalc<RateChangeResult>(
    () =>
      calculateRateChange({
        loanAmount,
        tenure: tenureYears,
        tenureType,
        interestRate,
        loanDate: loanDate.trim(),
        interestChangeReq: cleanChanges,
      }),
    [loanAmount, tenureYears, tenureType, interestRate, loanDate, cleanChanges]
  )

  const updateChange = (idx: number, patch: Partial<ChangeDraft>) => {
    setChanges((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const handleSave = async () => {
    if (!results) return
    setSaving(true)
    try {
      const resp = await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'rate-change',
          name: 'Rate Change Impact',
          inputs: inputsPayload,
          results,
          is_draft: false,
        }),
      })
      if (resp.ok) addToast('Saved', 'success')
      else addToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-spin h-10 w-10 border-2 border-ink-200 border-t-forest-400 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <a
          href="/calculators"
          className="text-forest-700 hover:text-forest-500 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="font-serif text-4xl text-ink-900 mb-2">Rate Change Impact</h1>
        <p className="text-ink-600 mb-10">
          Banks respond to a rate change one of two ways. Compare both side-by-side.
        </p>

        <PaywallGate
          requires="silver"
          reason="Rate Change Impact is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
        >
          <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
            {/* INPUTS */}
            <div className="space-y-6">
              <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm space-y-6">
                <h2 className="font-serif text-xl text-ink-900">Your loan</h2>

                <CurrencySlider
                  label="Loan amount"
                  value={loanAmount}
                  onChange={setLoanAmount}
                  min={100_000}
                  max={50_000_000}
                  step={50_000}
                  ticks={[500_000, 2_500_000, 10_000_000, 25_000_000]}
                />

                <RateSlider
                  label="Initial interest rate"
                  value={interestRate}
                  onChange={setInterestRate}
                  min={0}
                  max={20}
                  step={0.1}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
                      Tenure
                    </span>
                    <TogglePills
                      value={tenureType}
                      onChange={setTenureType}
                      options={[
                        { value: 'YEAR', label: 'Years' },
                        { value: 'MONTH', label: 'Months' },
                      ]}
                    />
                  </div>
                  {tenureType === 'YEAR' ? (
                    <TenureChips value={tenureYears} onChange={setTenureYears} />
                  ) : (
                    <input
                      type="number"
                      value={tenureYears}
                      min={1}
                      max={600}
                      onChange={(e) => setTenureYears(Number(e.target.value) || 1)}
                      className="w-32 px-3 py-2 bg-paper border border-ink-200 rounded-bk-md font-data tabular-nums text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
                    Loan start (MMM-yyyy)
                  </label>
                  <input
                    type="text"
                    className="w-44 px-3 py-2 bg-paper border border-ink-200 rounded-bk-md font-data text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    placeholder="Jan-2024"
                  />
                </div>
              </div>

              <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl text-ink-900">Rate changes</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setChanges((prev) => [
                        ...prev,
                        { interestChangedDate: '', changedRate: null },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add rate change
                  </button>
                </div>

                <div className="space-y-3">
                  {changes.map((c, idx) => (
                    <div key={idx} className="flex gap-2 items-stretch">
                      <input
                        type="text"
                        className="w-32 px-3 py-2.5 bg-paper border border-ink-200 rounded-bk-md font-data text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
                        value={c.interestChangedDate}
                        onChange={(e) =>
                          updateChange(idx, { interestChangedDate: e.target.value })
                        }
                        placeholder="Jun-2029"
                      />
                      <div className="flex-1 flex items-center bg-paper border border-ink-200 rounded-bk-md focus-within:border-forest-400 focus-within:ring-2 focus-within:ring-forest-400/20">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          max={30}
                          value={c.changedRate ?? ''}
                          onChange={(e) =>
                            updateChange(idx, {
                              changedRate:
                                e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          placeholder="7.0"
                          className="flex-1 py-2.5 px-3 bg-transparent outline-none font-data tabular-nums text-ink-900 placeholder:text-ink-400"
                        />
                        <span className="pr-3 text-ink-400 font-data" aria-hidden="true">
                          %
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setChanges((prev) => prev.filter((_, i) => i !== idx))
                        }
                        disabled={changes.length <= 1}
                        className="text-ink-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-2"
                        aria-label="Remove rate change"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !results}
                className="w-full py-3 px-4 rounded-bk-md bg-forest-700 hover:bg-forest-500 text-paper font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Result'}
              </button>
            </div>

            {/* RESULTS — two approaches side-by-side */}
            <div className="space-y-6">
              {results && (
                <div className="grid md:grid-cols-2 gap-6">
                  <ApproachPanel
                    title="Approach A"
                    subtitle="Keep EMI, adjust tenure"
                    desc="Your EMI stays unchanged. The loan ends sooner (or later)."
                    result={results.approachA}
                    originalEmi={parseFloat(results.originalEmi)}
                    originalTenureMonths={results.originalTenureMonths}
                    originalTotalInterest={parseFloat(results.originalTotalInterest)}
                    onShowSchedule={() =>
                      setShowSchedule((cur) => (cur === 'A' ? null : 'A'))
                    }
                    showingSchedule={showSchedule === 'A'}
                  />
                  <ApproachPanel
                    title="Approach B"
                    subtitle="Keep tenure, adjust EMI"
                    desc="The loan still ends on the original date; your EMI shifts."
                    result={results.approachB}
                    originalEmi={parseFloat(results.originalEmi)}
                    originalTenureMonths={results.originalTenureMonths}
                    originalTotalInterest={parseFloat(results.originalTotalInterest)}
                    onShowSchedule={() =>
                      setShowSchedule((cur) => (cur === 'B' ? null : 'B'))
                    }
                    showingSchedule={showSchedule === 'B'}
                  />
                </div>
              )}
            </div>
          </div>

          {results && showSchedule && (
            <div className="mt-8 bg-paper border border-ink-200 rounded-bk-lg shadow-bk-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-serif text-lg text-ink-900">
                  Schedule —{' '}
                  {showSchedule === 'A'
                    ? 'Approach A (EMI fixed)'
                    : 'Approach B (tenure fixed)'}
                </h3>
                <button
                  onClick={() => setShowSchedule(null)}
                  className="text-sm text-ink-400 hover:text-ink-900"
                >
                  Close
                </button>
              </div>
              <ScheduleTable
                approach={showSchedule === 'A' ? results.approachA : results.approachB}
              />
            </div>
          )}
        </PaywallGate>
      </div>
    </div>
  )
}

function ApproachPanel({
  title,
  subtitle,
  desc,
  result,
  originalEmi,
  originalTenureMonths,
  originalTotalInterest,
  onShowSchedule,
  showingSchedule,
}: {
  title: string
  subtitle: string
  desc: string
  result: RateChangeApproachResult
  originalEmi: number
  originalTenureMonths: number
  originalTotalInterest: number
  onShowSchedule: () => void
  showingSchedule: boolean
}) {
  const metrics: BeforeAfterMetric[] = [
    {
      label: 'Monthly EMI',
      before: originalEmi,
      after: parseFloat(result.finalEmi),
      format: (n) => formatINRCompact(n),
      betterDirection: 'lower',
    },
    {
      label: 'Tenure',
      before: originalTenureMonths,
      after: result.revisedTenureMonths,
      format: (m) => formatYearsMonths(m),
    },
    {
      label: 'Total interest',
      before: originalTotalInterest,
      after: parseFloat(result.totalInterest),
      format: (n) => formatINRCompact(n),
    },
  ]

  return (
    <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-serif text-xl text-forest-700">{title}</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
          {subtitle}
        </span>
      </div>
      <p className="text-sm text-ink-600 mb-5">{desc}</p>

      {result.diverged && (
        <div className="mb-4 p-3 rounded-bk-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Rate hike too steep — at the new rate, monthly interest exceeds the EMI, so the
          principal would grow rather than shrink.
        </div>
      )}

      <BeforeAfterBars metrics={metrics} />

      <div className="mt-6 pt-4 border-t border-ink-100 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-ink-400 font-semibold">
          Interest saved
        </span>
        <span className="font-data tabular-nums text-forest-700 text-lg font-medium">
          ₹{formatINR(parseFloat(result.interestSaved))}
        </span>
      </div>

      <button
        onClick={onShowSchedule}
        className="mt-4 text-sm font-semibold text-forest-700 hover:text-forest-500"
      >
        {showingSchedule ? 'Hide' : 'View'} schedule ({result.newAmortisation.length} months)
      </button>
    </div>
  )
}

function ScheduleTable({ approach }: { approach: RateChangeApproachResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-ink-100 text-ink-600">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="px-3 py-2 text-right">EMI</th>
            <th className="px-3 py-2 text-right">Opening</th>
            <th className="px-3 py-2 text-right">Interest</th>
            <th className="px-3 py-2 text-right">Principal</th>
            <th className="px-3 py-2 text-right">Closing</th>
            <th className="px-3 py-2 text-right">% Paid</th>
          </tr>
        </thead>
        <tbody className="font-data tabular-nums text-ink-900">
          {approach.newAmortisation.map((row, idx) => {
            const prev = idx > 0 ? approach.newAmortisation[idx - 1] : null
            const changed =
              prev !== null &&
              (prev.rateUsed !== row.rateUsed || prev.emiUsed !== row.emiUsed)
            return (
              <tr
                key={row.monthNumber}
                className={`border-t border-ink-100 ${changed ? 'bg-forest-50' : ''}`}
              >
                <td className="px-3 py-2">{row.monthNumber}</td>
                <td className="px-3 py-2">{row.date}</td>
                <td className="px-3 py-2 text-right">{row.rateUsed}%</td>
                <td className="px-3 py-2 text-right">₹{formatINR(parseFloat(row.emiUsed))}</td>
                <td className="px-3 py-2 text-right">₹{formatINR(parseFloat(row.openingBalance))}</td>
                <td className="px-3 py-2 text-right">₹{formatINR(parseFloat(row.interest))}</td>
                <td className="px-3 py-2 text-right">₹{formatINR(parseFloat(row.principal))}</td>
                <td className="px-3 py-2 text-right">₹{formatINR(parseFloat(row.closingBalance))}</td>
                <td className="px-3 py-2 text-right">{row.loanPaid}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function formatYearsMonths(months: number): string {
  if (!Number.isFinite(months) || months <= 0) return '0m'
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0) return `${y}y`
  return `${y}y ${m}m`
}
