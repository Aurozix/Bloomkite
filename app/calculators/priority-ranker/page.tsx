'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { rankGoals } from '@/lib/calculators/priorityRanker'
import { Goal, RankedGoal } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { TrashIcon } from '@heroicons/react/24/outline'

interface UrgencyOption {
  level: number
  label: string
}

// Fallback used while the API is loading or if the master-data fetch fails.
// Mirrors the seed in database/seed-master-data.ts so the page never lands
// in a state with an empty dropdown.
const FALLBACK_URGENCY: UrgencyOption[] = [
  { level: 1, label: 'Critical' },
  { level: 2, label: 'Very Important' },
  { level: 3, label: 'Important' },
  { level: 4, label: 'To Be Deleted' },
  { level: 5, label: 'Moderate' },
  { level: 6, label: 'Low' },
  { level: 7, label: 'Very Low' },
  { level: 8, label: 'Minor' },
  { level: 9, label: 'Least Urgent' },
]

export default function PriorityRanker() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [goals, setGoals] = useState<Goal[]>([
    { name: 'Emergency Fund', urgencyLevel: 1 },
    { name: 'Retirement', urgencyLevel: 5 },
  ])

  const [results, setResults] = useState<RankedGoal[] | null>(null)
  const [urgencyOptions, setUrgencyOptions] = useState<UrgencyOption[]>(FALLBACK_URGENCY)

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

        // Lazy-load the urgency labels from master-data. Slug 'urgency-N'
        // encodes the level; sortOrder is the canonical level number.
        try {
          const r = await fetch('/api/master-data/urgency-levels')
          if (r.ok) {
            const json = await r.json()
            const rows = (json.data ?? []) as Array<{ slug: string; name: string; sortOrder: number }>
            if (rows.length > 0) {
              setUrgencyOptions(
                rows.map((row) => ({ level: row.sortOrder, label: row.name }))
              )
            }
          }
        } catch {
          // Silent fall-through to FALLBACK_URGENCY.
        }
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

      // Build a label map from the master-data fetch so the result rows
      // render the admin-edited names (not the hard-coded defaults).
      const labelMap: Record<number, string> = {}
      for (const opt of urgencyOptions) labelMap[opt.level] = opt.label

      const result = rankGoals({ goals }, labelMap)

      setResults(result)

      // Auto-save as draft
      await saveDraft(result)
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error ranking goals', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const saveDraft = async (resultData: RankedGoal[]) => {
    try {
      await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'priority-ranker',
          inputs: { goals },
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
          calculator_type: 'priority-ranker',
          name: 'Goal Priorities',
          inputs: { goals },
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

  const addGoal = () => {
    setGoals([...goals, { name: '', urgencyLevel: 5 }])
  }

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index))
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

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Priority Ranker</h1>
        <p className="text-gray-600 mb-8">Prioritize your financial goals based on urgency</p>

        {/* Input Form */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Financial Goals</h2>

          <p className="text-sm text-gray-600 mb-4">
            Urgency Scale: 1 (Most Urgent) → 9 (Least Urgent) | 4 = Delete Goal
          </p>

          {goals.map((goal, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <input
                type="text"
                value={goal.name}
                onChange={(e) => {
                  const updated = [...goals]
                  updated[index].name = e.target.value
                  setGoals(updated)
                }}
                placeholder="Goal name"
                className="input-modern flex-1"
              />
              <select
                value={goal.urgencyLevel}
                onChange={(e) => {
                  const updated = [...goals]
                  updated[index].urgencyLevel = parseInt(e.target.value)
                  setGoals(updated)
                }}
                className="input-modern w-64"
              >
                {urgencyOptions.map((opt) => (
                  <option key={opt.level} value={opt.level}>
                    {opt.level}. {opt.label}
                  </option>
                ))}
              </select>
              {goals.length > 1 && (
                <button
                  onClick={() => removeGoal(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addGoal}
            className="btn-outline py-2 px-4 mb-8 text-sm"
          >
            + Add Goal
          </button>

          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="btn-primary w-full py-3 text-lg"
          >
            {calculating ? 'Ranking...' : 'Rank Goals'}
          </button>
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="card p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Ranked Goals</h2>

            <div className="space-y-3">
              {results.map((goal) => (
                <div key={goal.priority} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: 'var(--primary-600)' }}>
                    {goal.priority}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900">{goal.name}</p>
                    <p className="text-sm text-gray-600">
                      Urgency Level: {goal.urgencyLevel} ({goal.urgencyDescription})
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full py-3 text-lg mt-8"
            >
              {saving ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="card p-8 bg-yellow-50 border-2 border-yellow-200">
            <p className="text-center text-yellow-800">
              All goals marked as urgency level 4 have been filtered out. Add some valid goals to see results.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
