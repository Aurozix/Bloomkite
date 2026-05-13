'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateRateChange } from '@/lib/calculators/rateChange'
import {
  EMITenureType,
  InterestChangeEntry,
  RateChangeApproachResult,
  RateChangeResult,
} from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'

interface ChangeDraft {
  interestChangedDate: string
  changedRate: string
}

const DEFAULT_CHANGES: ChangeDraft[] = [
  { interestChangedDate: 'Jun-2029', changedRate: '7' },
]

type ApproachKey = 'A' | 'B'

export default function RateChangePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [loanAmount, setLoanAmount] = useState('3000000')
  const [tenure, setTenure] = useState('20')
  const [tenureType, setTenureType] = useState<EMITenureType>('YEAR')
  const [interestRate, setInterestRate] = useState('8')
  const [loanDate, setLoanDate] = useState('Jan-2024')
  const [changes, setChanges] = useState<ChangeDraft[]>(DEFAULT_CHANGES)
  const [results, setResults] = useState<RateChangeResult | null>(null)
  const [activeApproach, setActiveApproach] = useState<ApproachKey>('A')
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) router.push('/auth/signin')
      })
      .finally(() => setLoading(false))
  }, [router])

  const inputsPayload = useMemo(
    () => ({ loanAmount, tenure, tenureType, interestRate, loanDate, changes }),
    [loanAmount, tenure, tenureType, interestRate, loanDate, changes],
  )

  const updateChange = (idx: number, patch: Partial<ChangeDraft>) => {
    setChanges((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const handleCalculate = async () => {
    try {
      const cleanChanges: InterestChangeEntry[] = changes
        .filter((c) => c.interestChangedDate.trim() && c.changedRate.trim() !== '')
        .map((c) => ({
          interestChangedDate: c.interestChangedDate.trim(),
          changedRate: parseFloat(c.changedRate),
        }))
        .filter((c) => Number.isFinite(c.changedRate) && c.changedRate >= 0)

      const r = calculateRateChange({
        loanAmount: parseFloat(loanAmount),
        tenure: parseFloat(tenure),
        tenureType,
        interestRate: parseFloat(interestRate),
        loanDate: loanDate.trim(),
        interestChangeReq: cleanChanges,
      })
      setResults(r)
      setShowSchedule(false)

      fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'rate-change',
          inputs: inputsPayload,
          results: r,
          is_draft: true,
        }),
      }).catch(() => undefined)
    } catch (err) {
      console.error('Calculation error:', err)
      addToast('Error calculating rate change impact', 'error')
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    )
  }

  const active: RateChangeApproachResult | null =
    results === null
      ? null
      : activeApproach === 'A'
        ? results.approachA
        : results.approachB

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <a
          href="/calculators"
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Rate Change Impact</h1>
        <p className="text-gray-600 mb-8">
          How does a mid-loan interest rate change affect your EMI, tenure, and total interest?
          Compare both bank responses side-by-side.
        </p>

        <PaywallGate
          requires="silver"
          reason="Rate Change Impact is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
        >
          <div className="card p-8 mb-8">
            <div className="grid md:grid-cols-5 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  className="input-modern w-full"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tenure</label>
                <input
                  type="number"
                  className="input-modern w-full"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                <select
                  className="input-modern w-full"
                  value={tenureType}
                  onChange={(e) => setTenureType(e.target.value as EMITenureType)}
                >
                  <option value="YEAR">Years</option>
                  <option value="MONTH">Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Initial Rate (% p.a.)
                </label>
                <input
                  type="number"
                  className="input-modern w-full"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  step={0.1}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Start (MMM-yyyy)
                </label>
                <input
                  type="text"
                  className="input-modern w-full"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                  placeholder="Jan-2024"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Rate Changes</h3>
                <button
                  type="button"
                  onClick={() =>
                    setChanges((prev) => [
                      ...prev,
                      { interestChangedDate: '', changedRate: '' },
                    ])
                  }
                  className="btn-secondary py-2 px-3 text-sm"
                >
                  + Add Rate Change
                </button>
              </div>

              <div className="space-y-3">
                {changes.map((c, idx) => (
                  <div key={idx} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Effective Date (MMM-yyyy)
                      </label>
                      <input
                        type="text"
                        className="input-modern w-full"
                        value={c.interestChangedDate}
                        onChange={(e) =>
                          updateChange(idx, { interestChangedDate: e.target.value })
                        }
                        placeholder="Jun-2029"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        New Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        className="input-modern w-full"
                        value={c.changedRate}
                        onChange={(e) => updateChange(idx, { changedRate: e.target.value })}
                        step={0.1}
                        min={0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setChanges((prev) => prev.filter((_, i) => i !== idx))}
                      className="btn-secondary py-2 px-3 text-sm"
                      disabled={changes.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleCalculate} className="btn-primary w-full py-3 text-lg">
              Calculate Impact
            </button>
          </div>

          {results && (
            <>
              <div className="card p-8 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Compare both approaches
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <ApproachCard
                    title="Approach A — Keep EMI, Adjust Tenure"
                    subtitle="Your EMI stays the same. The loan ends sooner (or later)."
                    approach={results.approachA}
                    originalEmi={results.originalEmi}
                    originalTenureYears={results.originalTenureYears}
                    selected={activeApproach === 'A'}
                    onSelect={() => {
                      setActiveApproach('A')
                      setShowSchedule(false)
                    }}
                  />
                  <ApproachCard
                    title="Approach B — Keep Tenure, Adjust EMI"
                    subtitle="The loan still ends on the original date; your EMI shifts."
                    approach={results.approachB}
                    originalEmi={results.originalEmi}
                    originalTenureYears={results.originalTenureYears}
                    selected={activeApproach === 'B'}
                    onSelect={() => {
                      setActiveApproach('B')
                      setShowSchedule(false)
                    }}
                  />
                </div>
              </div>

              {active && (
                <div className="card p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Schedule —{' '}
                    {activeApproach === 'A' ? 'Approach A (EMI fixed)' : 'Approach B (tenure fixed)'}
                  </h3>

                  {active.diverged && (
                    <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-amber-900 font-semibold mb-1">
                        Rate hike too steep — loan never amortizes
                      </p>
                      <p className="text-sm text-amber-800">
                        At the new rate, the monthly interest exceeds the (unchanged) EMI, so
                        the principal would grow rather than shrink. Pick Approach B or reduce
                        the rate increase.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mb-6">
                    <button
                      onClick={() => setShowSchedule((v) => !v)}
                      className="btn-secondary py-2 px-4"
                    >
                      {showSchedule ? 'Hide' : 'View'} Schedule ({active.newAmortisation.length}{' '}
                      months)
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-4">
                      {saving ? 'Saving...' : 'Save Result'}
                    </button>
                  </div>

                  {showSchedule && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700">
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
                        <tbody>
                          {active.newAmortisation.map((row, idx) => {
                            const prev = idx > 0 ? active.newAmortisation[idx - 1] : null
                            const changed =
                              prev !== null &&
                              (prev.rateUsed !== row.rateUsed || prev.emiUsed !== row.emiUsed)
                            return (
                              <tr
                                key={row.monthNumber}
                                className={`border-t border-gray-100 ${
                                  changed ? 'bg-blue-50' : ''
                                }`}
                              >
                                <td className="px-3 py-2">{row.monthNumber}</td>
                                <td className="px-3 py-2">{row.date}</td>
                                <td className="px-3 py-2 text-right">{row.rateUsed}%</td>
                                <td className="px-3 py-2 text-right">₹{row.emiUsed}</td>
                                <td className="px-3 py-2 text-right">₹{row.openingBalance}</td>
                                <td className="px-3 py-2 text-right">₹{row.interest}</td>
                                <td className="px-3 py-2 text-right">₹{row.principal}</td>
                                <td className="px-3 py-2 text-right">₹{row.closingBalance}</td>
                                <td className="px-3 py-2 text-right">{row.loanPaid}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </PaywallGate>
      </div>
    </div>
  )
}

function ApproachCard({
  title,
  subtitle,
  approach,
  originalEmi,
  originalTenureYears,
  selected,
  onSelect,
}: {
  title: string
  subtitle: string
  approach: RateChangeApproachResult
  originalEmi: string
  originalTenureYears: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg p-6 border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <h4 className="text-lg font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{subtitle}</p>

      <div className="space-y-3">
        <Row label="Final EMI" was={`₹${originalEmi}`} now={`₹${approach.finalEmi}`} />
        <Row
          label="Tenure"
          was={`${originalTenureYears} yrs`}
          now={`${approach.revisedTenureYears} yrs`}
        />
        <Row label="Interest Saved" was="—" now={`₹${approach.interestSaved}`} accent />
      </div>

      {approach.diverged && (
        <p className="mt-4 text-xs text-amber-700 font-semibold">
          ⚠ Diverged — see warning when this view is selected.
        </p>
      )}
    </button>
  )
}

function Row({
  label,
  was,
  now,
  accent,
}: {
  label: string
  was: string
  now: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-gray-400 line-through">{was}</span>
        <span className={`font-bold ${accent ? 'text-blue-700' : 'text-gray-900'}`}>{now}</span>
      </span>
    </div>
  )
}
