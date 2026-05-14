'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

import { calculateEmiChange } from '@/lib/calculators/emiChange'
import {
  EMITenureType,
  EmiChangeEntry,
  EmiChangeResult,
} from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'
import { useDebouncedCalc } from '@/lib/hooks/useDebouncedCalc'
import { CurrencySlider } from '@/app/components/inputs/CurrencySlider'
import { CurrencyInput } from '@/app/components/inputs/CurrencyInput'
import { RateSlider } from '@/app/components/inputs/RateSlider'
import { TenureChips } from '@/app/components/inputs/TenureChips'
import { TogglePills } from '@/app/components/inputs/TogglePills'
import { BeforeAfterBars, BeforeAfterMetric } from '@/app/components/charts/BeforeAfterBars'
import { formatINR, formatINRCompact } from '@/lib/format-currency'

interface ChangeDraft {
  emiChangedDate: string
  newEmi: number | null
}

const DEFAULT_CHANGES: ChangeDraft[] = [
  { emiChangedDate: 'Jun-2029', newEmi: 35000 },
]

export default function EmiChangePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [authChecking, setAuthChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

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

  const cleanChanges = useMemo<EmiChangeEntry[]>(
    () =>
      changes
        .filter((c) => c.emiChangedDate.trim() && (c.newEmi ?? 0) > 0)
        .map((c) => ({
          emiChangedDate: c.emiChangedDate.trim(),
          newEmi: Number(c.newEmi),
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

  const results = useDebouncedCalc<EmiChangeResult>(
    () =>
      calculateEmiChange({
        loanAmount,
        tenure: tenureYears,
        tenureType,
        interestRate,
        loanDate: loanDate.trim(),
        emiChangeReq: cleanChanges,
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
          calculator_type: 'emi-change',
          name: 'EMI Change Impact',
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

  const metrics: BeforeAfterMetric[] = results
    ? [
        {
          label: 'Tenure',
          before: results.originalTenureMonths,
          after: results.revisedTenureMonths,
          format: (m) => formatYearsMonths(m),
        },
        {
          label: 'Total interest',
          before: parseFloat(results.originalTotalInterest),
          after: parseFloat(results.totalInterestNow),
          format: (n) => formatINRCompact(n),
        },
        {
          label: 'Monthly EMI',
          before: parseFloat(results.originalEmi),
          after: parseFloat(results.finalEmi),
          format: (n) => formatINRCompact(n),
          betterDirection: 'lower',
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <a
          href="/calculators"
          className="text-forest-700 hover:text-forest-500 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="font-serif text-4xl text-ink-900 mb-2">EMI Change Impact</h1>
        <p className="text-ink-600 mb-10">
          Bumping your EMI mid-loan is one of the cheapest ways to save lakhs in interest. See by how much.
        </p>

        <PaywallGate
          requires="silver"
          reason="EMI Change Impact is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
        >
          <div className="grid lg:grid-cols-2 gap-8">
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
                  label="Interest rate"
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
                  <h2 className="font-serif text-xl text-ink-900">EMI changes</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setChanges((prev) => [
                        ...prev,
                        { emiChangedDate: '', newEmi: null },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add EMI change
                  </button>
                </div>

                <div className="space-y-3">
                  {changes.map((c, idx) => (
                    <div key={idx} className="flex gap-2 items-stretch">
                      <input
                        type="text"
                        className="w-32 px-3 py-2.5 bg-paper border border-ink-200 rounded-bk-md font-data text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
                        value={c.emiChangedDate}
                        onChange={(e) =>
                          updateChange(idx, { emiChangedDate: e.target.value })
                        }
                        placeholder="Jun-2029"
                      />
                      <div className="flex-1">
                        <CurrencyInput
                          value={c.newEmi}
                          onChange={(n) => updateChange(idx, { newEmi: n })}
                          ariaLabel="New EMI"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setChanges((prev) => prev.filter((_, i) => i !== idx))
                        }
                        disabled={changes.length <= 1}
                        className="text-ink-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-2"
                        aria-label="Remove EMI change"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RESULTS */}
            <div className="space-y-6">
              {results?.diverged && (
                <div className="p-4 rounded-bk-md bg-amber-50 border border-amber-200">
                  <p className="text-amber-900 font-semibold mb-1">
                    EMI too low — loan never amortizes
                  </p>
                  <p className="text-sm text-amber-800">
                    At least one of the new EMI values is at or below the monthly interest
                    accrual, so the loan would never be paid off. Increase the EMI above the
                    interest charge to see a valid revised schedule.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Stat
                  label="Original EMI"
                  value={results ? `₹${formatINR(parseFloat(results.originalEmi))}` : '—'}
                />
                <Stat
                  label="Final EMI"
                  value={results ? `₹${formatINR(parseFloat(results.finalEmi))}` : '—'}
                  tone="good"
                />
                <Stat
                  label="Interest saved"
                  value={results ? `₹${formatINR(parseFloat(results.interestSaved))}` : '—'}
                  tone="good"
                />
              </div>

              {results && (
                <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
                  <BeforeAfterBars metrics={metrics} />
                </div>
              )}

              {results && (
                <button
                  onClick={() => setShowSchedule((v) => !v)}
                  className="text-sm font-semibold text-forest-700 hover:text-forest-500"
                >
                  {showSchedule ? 'Hide' : 'View'} revised schedule (
                  {results.newAmortisation.length} months)
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !results}
                className="w-full py-3 px-4 rounded-bk-md bg-forest-700 hover:bg-forest-500 text-paper font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>

          {results && showSchedule && (
            <div className="mt-8 bg-paper border border-ink-200 rounded-bk-lg shadow-bk-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-ink-100 text-ink-600">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">EMI</th>
                      <th className="px-3 py-2 text-right">Opening</th>
                      <th className="px-3 py-2 text-right">Interest</th>
                      <th className="px-3 py-2 text-right">Principal</th>
                      <th className="px-3 py-2 text-right">Closing</th>
                      <th className="px-3 py-2 text-right">% Paid</th>
                    </tr>
                  </thead>
                  <tbody className="font-data tabular-nums text-ink-900">
                    {results.newAmortisation.map((row, idx) => {
                      const prev = idx > 0 ? results.newAmortisation[idx - 1] : null
                      const emiChanged = prev !== null && prev.emiUsed !== row.emiUsed
                      return (
                        <tr
                          key={row.monthNumber}
                          className={`border-t border-ink-100 ${
                            emiChanged ? 'bg-forest-50' : ''
                          }`}
                        >
                          <td className="px-3 py-2">{row.monthNumber}</td>
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            ₹{formatINR(parseFloat(row.emiUsed))}
                          </td>
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
            </div>
          )}
        </PaywallGate>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'good' | 'bad' | 'neutral'
}) {
  const toneColor =
    tone === 'good' ? 'text-forest-700' : tone === 'bad' ? 'text-red-700' : 'text-ink-900'
  return (
    <div className="bg-paper border border-ink-200 rounded-bk-md p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-1">
        {label}
      </p>
      <p className={`font-data tabular-nums text-xl font-medium ${toneColor}`}>{value}</p>
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
