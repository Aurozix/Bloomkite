'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateNetWorth } from '@/lib/calculators/netWorth'
import { NetWorthCalculatorResult, AssetCategory, LiabilityCategory } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function NetWorthCalculator() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [assets, setAssets] = useState<AssetCategory[]>([
    { name: 'Savings Account', amount: 500000 },
    { name: 'Mutual Funds', amount: 200000 },
  ])
  const [liabilities, setLiabilities] = useState<LiabilityCategory[]>([
    { name: 'Home Loan', amount: 1000000 },
  ])

  const [results, setResults] = useState<NetWorthCalculatorResult | null>(null)

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

      const result = calculateNetWorth({
        assets,
        liabilities,
      })

      setResults(result)

      // Auto-save as draft
      await saveDraft(result)
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error calculating net worth', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const saveDraft = async (resultData: NetWorthCalculatorResult) => {
    try {
      await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'net-worth',
          inputs: { assets, liabilities },
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
          calculator_type: 'net-worth',
          name: 'Net Worth Snapshot',
          inputs: { assets, liabilities },
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

  const addAsset = () => {
    setAssets([...assets, { name: '', amount: 0 }])
  }

  const addLiability = () => {
    setLiabilities([...liabilities, { name: '', amount: 0 }])
  }

  const removeAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index))
  }

  const removeLiability = (index: number) => {
    setLiabilities(liabilities.filter((_, i) => i !== index))
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

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Net Worth Calculator</h1>
        <p className="text-gray-600 mb-8">Track your assets and liabilities to calculate net worth</p>

        {/* Input Form */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Assets</h2>

          {assets.map((asset, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <input
                type="text"
                value={asset.name}
                onChange={(e) => {
                  const updated = [...assets]
                  updated[index].name = e.target.value
                  setAssets(updated)
                }}
                placeholder="Asset name"
                className="input-modern flex-1"
              />
              <input
                type="number"
                value={asset.amount}
                onChange={(e) => {
                  const updated = [...assets]
                  updated[index].amount = parseFloat(e.target.value) || 0
                  setAssets(updated)
                }}
                placeholder="Amount"
                className="input-modern w-40"
              />
              {assets.length > 1 && (
                <button
                  onClick={() => removeAsset(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addAsset}
            className="btn-outline py-2 px-4 mb-8 text-sm"
          >
            + Add Asset
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-8">Liabilities</h2>

          {liabilities.map((liability, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <input
                type="text"
                value={liability.name}
                onChange={(e) => {
                  const updated = [...liabilities]
                  updated[index].name = e.target.value
                  setLiabilities(updated)
                }}
                placeholder="Liability name"
                className="input-modern flex-1"
              />
              <input
                type="number"
                value={liability.amount}
                onChange={(e) => {
                  const updated = [...liabilities]
                  updated[index].amount = parseFloat(e.target.value) || 0
                  setLiabilities(updated)
                }}
                placeholder="Amount"
                className="input-modern w-40"
              />
              {liabilities.length > 1 && (
                <button
                  onClick={() => removeLiability(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addLiability}
            className="btn-outline py-2 px-4 text-sm"
          >
            + Add Liability
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Net Worth</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-green-600">₹{parseFloat(results.totalAssets).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600">₹{parseFloat(results.totalLiabilities).toLocaleString('en-IN')}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Net Worth</p>
                <p className="text-2xl font-bold text-blue-600">₹{parseFloat(results.netWorth).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {results.assetBreakdown.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Asset Breakdown</h3>
                <div className="space-y-3">
                  {results.assetBreakdown.map((asset, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">{asset.category}</span>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{parseFloat(asset.amount).toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-600">{parseFloat(asset.percentage).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
