'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateGoalPlan } from '@/lib/calculators/goalPlanner'
import { GoalPlannerResult, GoalPlannerTenureType } from '@/lib/calculators/types'
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
  const [currentAmount, setCurrentAmount] = useState('1000000')
  const [tenure, setTenure] = useState('10')
  const [tenureType, setTenureType] = useState<GoalPlannerTenureType>('YEAR')
  const [inflationRate, setInflationRate] = useState('5')
  const [growthRate, setGrowthRate] = useState('8')
  const [annualInvestmentRate, setAnnualInvestmentRate] = useState('10')

  // Results
  const [results, setResults] = useState<GoalPlannerResult | null>(null)
  const [narration, setNarration] = useState<string | null>(null)
  const [narrationLoading, setNarrationLoading] = useState(false)

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
        currentAmount: parseFloat(currentAmount),
        tenure: parseFloat(tenure),
        tenureType,
        inflationRate: parseFloat(inflationRate),
        growthRate: parseFloat(growthRate),
        annualInvestmentRate: parseFloat(annualInvestmentRate),
      })

      setResults(result)
      setNarration(null)

      // Auto-save as draft
      await saveDraft(result)

      // Fire-and-fetch narration. Route returns 404 when the feature flag is
      // off (default) — that's expected and silently skipped, no toast. Same
      // for any other failure: narration is opt-in delight, never blocks.
      void fetchNarration({
        goalAmount: parseFloat(goalAmount),
        currentAmount: parseFloat(currentAmount),
        tenure: parseFloat(tenure),
        tenureType,
        inflationRate: parseFloat(inflationRate),
        growthRate: parseFloat(growthRate),
        annualInvestmentRate: parseFloat(annualInvestmentRate),
      })
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error calculating goal plan', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const fetchNarration = async (inputs: {
    goalAmount: number
    currentAmount: number
    tenure: number
    tenureType: GoalPlannerTenureType
    inflationRate: number
    growthRate: number
    annualInvestmentRate: number
  }) => {
    setNarrationLoading(true)
    try {
      const response = await fetch('/api/calculators/goal-planner/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      })
      if (!response.ok) {
        // 404 is the expected response when the feature flag is off.
        setNarration(null)
        return
      }
      const data = await response.json()
      if (typeof data?.narration === 'string') setNarration(data.narration)
    } catch {
      setNarration(null)
    } finally {
      setNarrationLoading(false)
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
            currentAmount,
            tenure,
            tenureType,
            inflationRate,
            growthRate,
            annualInvestmentRate,
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
            currentAmount,
            tenure,
            tenureType,
            inflationRate,
            growthRate,
            annualInvestmentRate,
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
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="input-modern w-full"
                placeholder="1000000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tenure</label>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="input-modern w-full"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tenure Unit</label>
              <select
                value={tenureType}
                onChange={(e) => setTenureType(e.target.value as GoalPlannerTenureType)}
                className="input-modern w-full"
              >
                <option value="YEAR">Years</option>
                <option value="MONTH">Months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Inflation Rate (% p.a.)</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Growth Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="input-modern w-full"
                placeholder="8"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Investment Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={annualInvestmentRate}
                onChange={(e) => setAnnualInvestmentRate(e.target.value)}
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
                <p className="text-sm text-gray-600 mb-1">Future Cost of Goal (inflation-adjusted)</p>
                <p className="text-3xl font-bold text-blue-600">₹{parseFloat(results.futureCost).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Required Monthly Investment</p>
                <p className="text-3xl font-bold text-green-600">₹{parseFloat(results.monthlyInv).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Savings, Grown</p>
                <p className="text-2xl font-bold text-purple-600">₹{parseFloat(results.futureValue).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Gap to Fill</p>
                <p className="text-2xl font-bold text-orange-600">₹{parseFloat(results.finalCorpus).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Annual Investment Equivalent</p>
                <p className="text-2xl font-bold text-gray-800">₹{parseFloat(results.annualInv).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Monthly Rate Used</p>
                <p className="text-2xl font-bold text-gray-800">{(parseFloat(results.rateOfReturn) * 100).toFixed(3)}%</p>
              </div>
            </div>

            {(narrationLoading || narration) && (
              <div className="rounded-lg p-5 mb-6 border" style={{ borderColor: 'var(--bk-forest-100, #e5e7eb)', background: 'var(--bk-forest-25, #f8fafc)' }}>
                <p className="text-sm font-semibold text-gray-700 mb-2">Summary</p>
                {narrationLoading ? (
                  <p className="text-gray-500 text-sm italic">Reading your numbers...</p>
                ) : (
                  <p className="text-gray-800 leading-relaxed">{narration}</p>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Quick Summary</p>
              <p className="text-gray-700">
                To accumulate ₹{parseFloat(goalAmount).toLocaleString('en-IN')} in{' '}
                {tenure} {tenureType === 'YEAR' ? 'years' : 'months'} with {inflationRate}% inflation, you need to save{' '}
                <span className="font-bold" style={{ color: 'var(--primary-600)' }}>
                  ₹{parseFloat(results.monthlyInv).toLocaleString('en-IN')} per month
                </span>
                . This assumes {growthRate}% growth on current savings and {annualInvestmentRate}% returns on monthly investments.
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
