'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateInsuranceNeeds } from '@/lib/calculators/insuranceNeeds'
import { InsuranceNeedsInput, InsuranceNeedsResult, IncomeStability, IncomePredictability } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'

export default function InsuranceNeeds() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form inputs
  const [annualIncome, setAnnualIncome] = useState('1000000')
  const [incomeStability, setIncomeStability] = useState<IncomeStability>('STABLE')
  const [incomePredictability, setIncomePredictability] = useState<IncomePredictability>('PREDICTABLE')
  const [existingInsurance, setExistingInsurance] = useState('250000')

  // Results
  const [results, setResults] = useState<InsuranceNeedsResult | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (!data.user) {
          router.push('/auth/signin')
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Session error:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [router])

  const handleCalculate = async () => {
    try {
      setCalculating(true)

      const result = calculateInsuranceNeeds({
        annualIncome: parseFloat(annualIncome),
        incomeStability,
        incomePredictability,
        existingInsurance: parseFloat(existingInsurance),
      })

      setResults(result)

      // Auto-save as draft
      await saveDraft(result)
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error calculating insurance needs', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const saveDraft = async (resultData: InsuranceNeedsResult) => {
    try {
      await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'insurance-needs',
          inputs: {
            annualIncome,
            incomeStability,
            incomePredictability,
            existingInsurance,
          },
          results: resultData,
          is_draft: true,
        }),
      })
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  const handleSave = async () => {
    if (!results) return

    try {
      setSaving(true)

      const response = await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'insurance-needs',
          name: `Insurance Coverage Analysis - ₹${parseFloat(annualIncome).toLocaleString('en-IN')}`,
          inputs: {
            annualIncome,
            incomeStability,
            incomePredictability,
            existingInsurance,
          },
          results,
          is_draft: false,
        }),
      })

      if (response.ok) {
        addToast('Result saved successfully', 'success')
      } else {
        addToast('Failed to save result', 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      addToast('Error saving result', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <a href="/calculators" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Calculators
        </a>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Insurance Needs Calculator</h1>
        <p className="text-gray-600 mb-8">
          Determine how much life insurance coverage you need based on your income profile
        </p>

        {/* Input Form */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Income Details</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income (₹)</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="input-modern w-full"
                placeholder="1000000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Income Stability</label>
              <select
                value={incomeStability}
                onChange={(e) => setIncomeStability(e.target.value as IncomeStability)}
                className="input-modern w-full"
              >
                <option value="STABLE">Stable (e.g., Salaried)</option>
                <option value="FLUCTUATING">Fluctuating (e.g., Business/Freelance)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Income Predictability</label>
              <select
                value={incomePredictability}
                onChange={(e) => setIncomePredictability(e.target.value as IncomePredictability)}
                className="input-modern w-full"
              >
                <option value="PREDICTABLE">Predictable</option>
                <option value="UNPREDICTABLE">Unpredictable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Insurance (₹)</label>
              <input
                type="number"
                value={existingInsurance}
                onChange={(e) => setExistingInsurance(e.target.value)}
                className="input-modern w-full"
                placeholder="250000"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="btn-primary w-full py-3 text-lg"
          >
            {calculating ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="card p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Insurance Needs</h2>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Coverage Multiplier</p>
              <p className="text-4xl font-bold text-blue-600">{results.coverageMultiplier}x</p>
              <p className="text-sm text-gray-600 mt-2">Based on {incomeStability} and {incomePredictability} income</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Required Insurance</p>
                <p className="text-3xl font-bold text-green-600">₹{parseFloat(results.requiredInsurance).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Additional Coverage Needed</p>
                <p className="text-3xl font-bold text-red-600">₹{parseFloat(results.additionalCoverageNeeded).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Summary</p>
              <p className="text-gray-700">
                Your annual income of ₹{parseFloat(annualIncome).toLocaleString('en-IN')} with{' '}
                <span className="font-semibold">{incomeStability.toLowerCase()}</span> and{' '}
                <span className="font-semibold">{incomePredictability.toLowerCase()}</span> income suggests a{' '}
                <span className="font-semibold">{results.coverageMultiplier}x</span> multiplier. You need{' '}
                <span className="font-bold" style={{ color: 'var(--primary-600)' }}>
                  ₹{parseFloat(results.requiredInsurance).toLocaleString('en-IN')}
                </span>{' '}
                in coverage. Your current coverage is{' '}
                <span className="font-semibold">₹{parseFloat(results.existingInsurance).toLocaleString('en-IN')}</span>, leaving a gap of{' '}
                <span className="font-bold" style={{ color: 'var(--primary-600)' }}>
                  ₹{parseFloat(results.additionalCoverageNeeded).toLocaleString('en-IN')}
                </span>.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full py-3 text-lg"
            >
              {saving ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
