'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateEmiCapacity } from '@/lib/calculators/emiCapacity'
import {
  BackupAvailability,
  EMICapacityResult,
  IncomeStabilityLevel,
} from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'

export default function EmiCapacityPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [currentAge, setCurrentAge] = useState('35')
  const [retirementAge, setRetirementAge] = useState('65')
  const [netFamilyIncome, setNetFamilyIncome] = useState('83333')
  const [existingEmi, setExistingEmi] = useState('5000')
  const [houseHoldExpense, setHouseHoldExpense] = useState('33333')
  const [additionalIncome, setAdditionalIncome] = useState('0')
  const [stability, setStability] = useState<IncomeStabilityLevel>('HIGH')
  const [backUp, setBackUp] = useState<BackupAvailability>('YES')
  const [interestRate, setInterestRate] = useState('8')
  const [results, setResults] = useState<EMICapacityResult | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) router.push('/auth/signin')
      })
      .finally(() => setLoading(false))
  }, [router])

  const inputsPayload = useMemo(
    () => ({
      currentAge,
      retirementAge,
      netFamilyIncome,
      existingEmi,
      houseHoldExpense,
      additionalIncome,
      stability,
      backUp,
      interestRate,
    }),
    [
      currentAge,
      retirementAge,
      netFamilyIncome,
      existingEmi,
      houseHoldExpense,
      additionalIncome,
      stability,
      backUp,
      interestRate,
    ],
  )

  const handleCalculate = async () => {
    try {
      const r = calculateEmiCapacity({
        currentAge: parseInt(currentAge, 10),
        retirementAge: parseInt(retirementAge, 10),
        netFamilyIncome: parseFloat(netFamilyIncome),
        existingEmi: parseFloat(existingEmi),
        houseHoldExpense: parseFloat(houseHoldExpense),
        additionalIncome: parseFloat(additionalIncome),
        stability,
        backUp,
        interestRate: parseFloat(interestRate),
      })
      setResults(r)

      fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'emi-capacity',
          inputs: inputsPayload,
          results: r,
          is_draft: true,
        }),
      }).catch(() => undefined)
    } catch (err) {
      console.error('Calculation error:', err)
      addToast('Error calculating EMI capacity', 'error')
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
          calculator_type: 'emi-capacity',
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
      <div className="max-w-4xl mx-auto">
        <a
          href="/calculators"
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
        >
          ← Back to Calculators
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">EMI Capacity</h1>
        <p className="text-gray-600 mb-8">
          How much additional loan can you afford given your income, expenses, and existing
          obligations?
        </p>

        <PaywallGate
          requires="silver"
          reason="EMI Capacity is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
        >
          <div className="card p-8 mb-8 grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Age
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value)}
                min={18}
                max={75}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Retirement Age
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={retirementAge}
                onChange={(e) => setRetirementAge(e.target.value)}
                min={19}
                max={75}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interest Rate (% p.a.)
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
                Monthly Family Income (₹)
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={netFamilyIncome}
                onChange={(e) => setNetFamilyIncome(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Existing EMI (₹/mo)
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={existingEmi}
                onChange={(e) => setExistingEmi(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Household Expenses (₹/mo)
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={houseHoldExpense}
                onChange={(e) => setHouseHoldExpense(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Income (₹/mo)
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={additionalIncome}
                onChange={(e) => setAdditionalIncome(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Income Stability
              </label>
              <select
                className="input-modern w-full"
                value={stability}
                onChange={(e) => setStability(e.target.value as IncomeStabilityLevel)}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Emergency Backup
              </label>
              <select
                className="input-modern w-full"
                value={backUp}
                onChange={(e) => setBackUp(e.target.value as BackupAvailability)}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>

            <button onClick={handleCalculate} className="btn-primary md:col-span-3 py-3 text-lg">
              Calculate Capacity
            </button>
          </div>

          {results && (
            <div className="card p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Stat
                  label="Advisable Loan Amount"
                  value={`₹${results.advisableLoanAmount}`}
                  accent
                />
                <Stat
                  label="Monthly EMI Affordable"
                  value={`₹${results.monthlyEmiAffordable}`}
                />
                <Stat label="Term of Loan" value={`${results.termOfLoan} yrs`} />
                <Stat label="Gross Surplus" value={`₹${results.surplusMoney}`} />
                <Stat
                  label={`Adjusted Surplus (${results.stabilityMultiplier}%)`}
                  value={`₹${results.surplus}`}
                />
                <Stat label="EMI Capacity" value={`₹${results.emiCapacity}`} />
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
