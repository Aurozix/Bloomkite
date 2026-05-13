'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateFutureValue } from '@/lib/calculators/futureValue'
import { FutureValueResult } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'

export default function FutureValuePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [presentValue, setPresentValue] = useState('100000')
  const [annualRate, setAnnualRate] = useState('10')
  const [tenureYears, setTenureYears] = useState('10')
  const [results, setResults] = useState<FutureValueResult | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) router.push('/auth/signin')
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleCalculate = async () => {
    try {
      const r = calculateFutureValue({
        presentValue: parseFloat(presentValue),
        annualRate: parseFloat(annualRate),
        tenureYears: parseFloat(tenureYears),
      })
      setResults(r)

      fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'future-value',
          inputs: { presentValue, annualRate, tenureYears },
          results: r,
          is_draft: true,
        }),
      }).catch(() => undefined)
    } catch (err) {
      console.error('Calculation error:', err)
      addToast('Error calculating future value', 'error')
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
          calculator_type: 'future-value',
          inputs: { presentValue, annualRate, tenureYears },
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
      <div className="max-w-3xl mx-auto">
        <a
          href="/calculators"
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Future Value</h1>
        <p className="text-gray-600 mb-8">
          Project how much an investment will grow at a fixed annual rate.
        </p>

        <div className="card p-8 mb-8 grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Present Value (₹)
            </label>
            <input
              type="number"
              className="input-modern w-full"
              value={presentValue}
              onChange={(e) => setPresentValue(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Annual Rate (%)
            </label>
            <input
              type="number"
              className="input-modern w-full"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              step={0.1}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tenure (years)
            </label>
            <input
              type="number"
              className="input-modern w-full"
              value={tenureYears}
              onChange={(e) => setTenureYears(e.target.value)}
              min={0}
            />
          </div>

          <button onClick={handleCalculate} className="btn-primary md:col-span-3 py-3 text-lg">
            Calculate
          </button>
        </div>

        {results && (
          <div className="card p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Stat label="Future Value" value={`₹${results.futureValue}`} accent />
              <Stat label="Total Interest" value={`₹${results.totalInterest}`} />
              <Stat label="Effective Annual Growth" value={`${results.effectiveAnnualGrowth}%`} />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        )}
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
