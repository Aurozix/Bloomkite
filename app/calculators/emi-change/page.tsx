'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateEmiChange } from '@/lib/calculators/emiChange'
import {
  EMITenureType,
  EmiChangeEntry,
  EmiChangeResult,
} from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'

interface ChangeDraft {
  emiChangedDate: string
  newEmi: string
}

const DEFAULT_CHANGES: ChangeDraft[] = [
  { emiChangedDate: 'Jun-2029', newEmi: '35000' },
]

export default function EmiChangePage() {
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
  const [results, setResults] = useState<EmiChangeResult | null>(null)
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
      const cleanChanges: EmiChangeEntry[] = changes
        .filter((c) => c.emiChangedDate.trim() && parseFloat(c.newEmi) > 0)
        .map((c) => ({
          emiChangedDate: c.emiChangedDate.trim(),
          newEmi: parseFloat(c.newEmi),
        }))

      const r = calculateEmiChange({
        loanAmount: parseFloat(loanAmount),
        tenure: parseFloat(tenure),
        tenureType,
        interestRate: parseFloat(interestRate),
        loanDate: loanDate.trim(),
        emiChangeReq: cleanChanges,
      })
      setResults(r)
      setShowSchedule(false)

      fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'emi-change',
          inputs: inputsPayload,
          results: r,
          is_draft: true,
        }),
      }).catch(() => undefined)
    } catch (err) {
      console.error('Calculation error:', err)
      addToast('Error calculating EMI change impact', 'error')
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
          calculator_type: 'emi-change',
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <a
          href="/calculators"
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">EMI Change Impact</h1>
        <p className="text-gray-600 mb-8">
          See how increasing your EMI mid-loan shortens the tenure and saves interest.
        </p>

        <PaywallGate
          requires="silver"
          reason="EMI Change Impact is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
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
                  Rate (% p.a.)
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
                <h3 className="text-lg font-semibold text-gray-900">EMI Changes</h3>
                <button
                  type="button"
                  onClick={() =>
                    setChanges((prev) => [...prev, { emiChangedDate: '', newEmi: '' }])
                  }
                  className="btn-secondary py-2 px-3 text-sm"
                >
                  + Add EMI Change
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
                        value={c.emiChangedDate}
                        onChange={(e) =>
                          updateChange(idx, { emiChangedDate: e.target.value })
                        }
                        placeholder="Jun-2029"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        New EMI (₹)
                      </label>
                      <input
                        type="number"
                        className="input-modern w-full"
                        value={c.newEmi}
                        onChange={(e) => updateChange(idx, { newEmi: e.target.value })}
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
            <div className="card p-8">
              {results.diverged && (
                <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
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

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Stat label="Original EMI" value={`₹${results.originalEmi}`} />
                <Stat label="Final EMI" value={`₹${results.finalEmi}`} accent />
                <Stat
                  label="Revised Tenure"
                  value={`${results.revisedTenureYears} yrs`}
                  accent
                />
                <Stat
                  label="Original Tenure"
                  value={`${results.originalTenureYears} yrs`}
                />
                <Stat
                  label="Tenure Saved"
                  value={`${results.tenureReductionYears} yrs (${results.tenureReductionMonths} mo)`}
                  accent
                />
                <Stat label="Interest Saved" value={`₹${results.interestSaved}`} accent />
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => setShowSchedule((v) => !v)}
                  className="btn-secondary py-2 px-4"
                >
                  {showSchedule ? 'Hide' : 'View'} Revised Schedule (
                  {results.newAmortisation.length} months)
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
                        <th className="px-3 py-2 text-right">EMI</th>
                        <th className="px-3 py-2 text-right">Opening</th>
                        <th className="px-3 py-2 text-right">Interest</th>
                        <th className="px-3 py-2 text-right">Principal</th>
                        <th className="px-3 py-2 text-right">Closing</th>
                        <th className="px-3 py-2 text-right">% Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.newAmortisation.map((row, idx) => {
                        const prev = idx > 0 ? results.newAmortisation[idx - 1] : null
                        const emiChanged = prev !== null && prev.emiUsed !== row.emiUsed
                        return (
                          <tr
                            key={row.monthNumber}
                            className={`border-t border-gray-100 ${
                              emiChanged ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-3 py-2">{row.monthNumber}</td>
                            <td className="px-3 py-2">{row.date}</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              ₹{row.emiUsed}
                            </td>
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
        </PaywallGate>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${accent ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-blue-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
