'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateGoalPlan } from '@/lib/calculators/goalPlanner'
import { GoalPlannerResult } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'

export default function GoalPlanner() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form inputs
  const [goalAmount, setGoalAmount] = useState('5000000')
  const [currentSavings, setCurrentSavings] = useState('100000')
  const [tenureYears, setTenureYears] = useState('10')
  const [inflationRate, setInflationRate] = useState('5')
  const [growthRate, setGrowthRate] = useState('7')
  const [investmentRate, setInvestmentRate] = useState('10')

  // Results
  const [results, setResults] = useState<GoalPlannerResult | null>(null)

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

      const result = calculateGoalPlan({
        goalAmount: parseFloat(goalAmount),
        currentSavings: parseFloat(currentSavings),
        tenureYears: parseFloat(tenureYears),
        inflationRate: parseFloat(inflationRate),
        growthRate: parseFloat(growthRate),
        investmentRate: parseFloat(investmentRate),
      })

      setResults(result)

      // Auto-save as draft
      await saveDraft(result)
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error calculating goal plan', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const saveDraft = async (resultData: GoalPlannerResult) => {
    try {
      await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'goal-planner',
          inputs: {
            goalAmount,
            currentSavings,
            tenureYears,
            inflationRate,
            growthRate,
            investmentRate,
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
          calculator_type: 'goal-planner',
          name: `Goal Plan - ₹${parseFloat(goalAmount).toLocaleString('en-IN')}`,
          inputs: {
            goalAmount,
            currentSavings,
            tenureYears,
            inflationRate,
            growthRate,
            investmentRate,
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

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Goal Planner</h1>
        <p className="text-gray-600 mb-8">
          Calculate how much you need to save monthly to reach your financial goals
        </p>

        {/* Input Form */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Your Details</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Amount (₹)</label>
              <input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="input-modern w-full"
                placeholder="5000000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Savings (₹)</label>
              <input
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                className="input-modern w-full"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tenure (Years)</label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                className="input-modern w-full"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Inflation Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                className="input-modern w-full"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Growth Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="input-modern w-full"
                placeholder="7"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Investment Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={investmentRate}
                onChange={(e) => setInvestmentRate(e.target.value)}
                className="input-modern w-full"
                placeholder="10"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Results</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Future Value (adjusted for inflation)</p>
                <p className="text-3xl font-bold text-blue-600">₹{parseFloat(results.futureValue).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Required Monthly Investment</p>
                <p className="text-3xl font-bold text-green-600">₹{parseFloat(results.requiredMonthlyInvestment).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Investment Needed</p>
                <p className="text-2xl font-bold text-purple-600">₹{parseFloat(results.totalInvestmentNeeded).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Gap to Fill</p>
                <p className="text-2xl font-bold text-orange-600">₹{parseFloat(results.gap).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Summary</p>
              <p className="text-gray-700">
                To accumulate ₹{parseFloat(goalAmount).toLocaleString('en-IN')} in{' '}
                {tenureYears} years with {inflationRate}% inflation, you need to save{' '}
                <span className="font-bold" style={{ color: 'var(--primary-600)' }}>
                  ₹{parseFloat(results.requiredMonthlyInvestment).toLocaleString('en-IN')} per month
                </span>
                . This assumes {growthRate}% growth on current savings and {investmentRate}% returns on monthly investments.
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
