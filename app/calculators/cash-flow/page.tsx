'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateCashFlow } from '@/lib/calculators/cashFlow'
import { CashFlowAnalyzerResult, CashFlowItem } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function CashFlowAnalyzer() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [incomeItems, setIncomeItems] = useState<CashFlowItem[]>([
    { name: 'Salary', amount: 75000 },
  ])
  const [expenseItems, setExpenseItems] = useState<CashFlowItem[]>([
    { name: 'Rent', amount: 20000 },
    { name: 'Groceries', amount: 10000 },
    { name: 'Utilities', amount: 3000 },
  ])

  const [results, setResults] = useState<CashFlowAnalyzerResult | null>(null)

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

      const result = calculateCashFlow({
        incomeItems,
        expenseItems,
      })

      setResults(result)

      // Auto-save as draft
      await saveDraft(result)
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error calculating cash flow', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const saveDraft = async (resultData: CashFlowAnalyzerResult) => {
    try {
      await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'cash-flow',
          inputs: { incomeItems, expenseItems },
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
          calculator_type: 'cash-flow',
          name: 'Cash Flow Analysis',
          inputs: { incomeItems, expenseItems },
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

  const addIncomeItem = () => {
    setIncomeItems([...incomeItems, { name: '', amount: 0 }])
  }

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { name: '', amount: 0 }])
  }

  const removeIncomeItem = (index: number) => {
    setIncomeItems(incomeItems.filter((_, i) => i !== index))
  }

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index))
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

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Cash Flow Analyzer</h1>
        <p className="text-gray-600 mb-8">Analyze your monthly income and expenses</p>

        {/* Input Form */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Income Items</h2>

          {incomeItems.map((item, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <input
                type="text"
                value={item.name}
                onChange={(e) => {
                  const updated = [...incomeItems]
                  updated[index].name = e.target.value
                  setIncomeItems(updated)
                }}
                placeholder="Income name"
                className="input-modern flex-1"
              />
              <input
                type="number"
                value={item.amount}
                onChange={(e) => {
                  const updated = [...incomeItems]
                  updated[index].amount = parseFloat(e.target.value) || 0
                  setIncomeItems(updated)
                }}
                placeholder="Amount"
                className="input-modern w-32"
              />
              {incomeItems.length > 1 && (
                <button
                  onClick={() => removeIncomeItem(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addIncomeItem}
            className="btn-outline py-2 px-4 mb-8 text-sm"
          >
            + Add Income Item
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-8">Expense Items</h2>

          {expenseItems.map((item, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <input
                type="text"
                value={item.name}
                onChange={(e) => {
                  const updated = [...expenseItems]
                  updated[index].name = e.target.value
                  setExpenseItems(updated)
                }}
                placeholder="Expense name"
                className="input-modern flex-1"
              />
              <input
                type="number"
                value={item.amount}
                onChange={(e) => {
                  const updated = [...expenseItems]
                  updated[index].amount = parseFloat(e.target.value) || 0
                  setExpenseItems(updated)
                }}
                placeholder="Amount"
                className="input-modern w-32"
              />
              {expenseItems.length > 1 && (
                <button
                  onClick={() => removeExpenseItem(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addExpenseItem}
            className="btn-outline py-2 px-4 text-sm"
          >
            + Add Expense Item
          </button>

          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="btn-primary w-full py-3 text-lg mt-8"
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
                <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
                <p className="text-3xl font-bold text-blue-600">₹{parseFloat(results.totalMonthlyIncome).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
                <p className="text-3xl font-bold text-red-600">₹{parseFloat(results.totalMonthlyExpenses).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Monthly Net Cash Flow</p>
                <p className="text-3xl font-bold text-green-600">₹{parseFloat(results.monthlyNetCashFlow).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Savings Rate</p>
                <p className="text-3xl font-bold text-purple-600">{parseFloat(results.savingsRate).toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Annual Summary</p>
              <p className="text-gray-700">
                Yearly net cash flow: ₹{parseFloat(results.yearlyNetCashFlow).toLocaleString('en-IN')}
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
