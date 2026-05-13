'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateTargetValue } from '@/lib/calculators/targetValue'
import { TargetValueResult } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'

export default function TargetValuePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [targetAmount, setTargetAmount] = useState('5000000')
  const [annualRate, setAnnualRate] = useState('10')
  const [tenureYears, setTenureYears] = useState('10')
  const [results, setResults] = useState<TargetValueResult | null>(null)

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
      const r = calculateTargetValue({
        targetAmount: parseFloat(targetAmount),
        annualRate: parseFloat(annualRate),
        tenureYears: parseFloat(tenureYears),
      })
      setResults(r)

      fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'target-value',
          inputs: { targetAmount, annualRate, tenureYears },
          results: r,
          is_draft: true,
        }),
      }).catch(() => undefined)
    } catch (err) {
      console.error('Calculation error:', err)
      addToast('Error calculating target value', 'error')
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
          calculator_type: 'target-value',
          inputs: { targetAmount, annualRate, tenureYears },
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
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Target Value</h1>
        <p className="text-gray-600 mb-8">
          How much do you need to invest each month to reach your target?
        </p>

        <PaywallGate
          requires="silver"
          reason="Target Value is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
        >
        <div className="card p-8 mb-8 grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Amount (₹)
            </label>
            <input
              type="number"
              className="input-modern w-full"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
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
              <Stat label="Monthly Investment" value={`₹${results.requiredMonthlyInvestment}`} accent />
              <Stat label="Total Contribution" value={`₹${results.totalContribution}`} />
              <Stat label="Expected Returns" value={`₹${results.expectedReturns}`} />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : 'Save Result'}
            </button>
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
