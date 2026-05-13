'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateEmi } from '@/lib/calculators/emi'
import { EMICalculatorResult, EMITenureType } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { PaywallGate } from '@/app/components/PaywallGate'

export default function EmiCalculatorPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [loanAmount, setLoanAmount] = useState('3000000')
  const [tenure, setTenure] = useState('20')
  const [tenureType, setTenureType] = useState<EMITenureType>('YEAR')
  const [interestRate, setInterestRate] = useState('8')
  const [results, setResults] = useState<EMICalculatorResult | null>(null)
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
    () => ({ loanAmount, tenure, tenureType, interestRate }),
    [loanAmount, tenure, tenureType, interestRate],
  )

  const handleCalculate = async () => {
    try {
      const r = calculateEmi({
        loanAmount: parseFloat(loanAmount),
        tenure: parseFloat(tenure),
        tenureType,
        interestRate: parseFloat(interestRate),
      })
      setResults(r)
      setShowSchedule(false)

      fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'emi',
          inputs: inputsPayload,
          results: r,
          is_draft: true,
        }),
      }).catch(() => undefined)
    } catch (err) {
      console.error('Calculation error:', err)
      addToast('Error calculating EMI', 'error')
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
          calculator_type: 'emi',
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
        <h1 className="text-4xl font-bold text-gray-900 mb-3">EMI Calculator</h1>
        <p className="text-gray-600 mb-8">
          Calculate your monthly loan EMI and see a full month-by-month amortization schedule.
        </p>

        <PaywallGate
          requires="silver"
          reason="EMI Calculator is part of the advanced calculator suite. Upgrade to Silver to unlock all 15 calculators."
        >
          <div className="card p-8 mb-8 grid md:grid-cols-4 gap-6">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tenure
              </label>
              <input
                type="number"
                className="input-modern w-full"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tenure Unit
              </label>
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

            <button onClick={handleCalculate} className="btn-primary md:col-span-4 py-3 text-lg">
              Calculate EMI
            </button>
          </div>

          {results && (
            <div className="card p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Stat label="Monthly EMI" value={`₹${results.emi}`} accent />
                <Stat label="Total Interest" value={`₹${results.interestPayable}`} />
                <Stat label="Total Payable" value={`₹${results.total}`} />
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => setShowSchedule((v) => !v)}
                  className="btn-secondary py-2 px-4"
                >
                  {showSchedule ? 'Hide' : 'View'} Amortization Schedule (
                  {results.amortisationResponse.length} months)
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
                        <th className="px-3 py-2 text-right">Opening</th>
                        <th className="px-3 py-2 text-right">Interest</th>
                        <th className="px-3 py-2 text-right">Principal</th>
                        <th className="px-3 py-2 text-right">Closing</th>
                        <th className="px-3 py-2 text-right">% Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.amortisationResponse.map((row) => (
                        <tr key={row.monthNumber} className="border-t border-gray-100">
                          <td className="px-3 py-2">{row.monthNumber}</td>
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2 text-right">₹{row.openingBalance}</td>
                          <td className="px-3 py-2 text-right">₹{row.interest}</td>
                          <td className="px-3 py-2 text-right">₹{row.principal}</td>
                          <td className="px-3 py-2 text-right">₹{row.closingBalance}</td>
                          <td className="px-3 py-2 text-right">{row.loanPaid}%</td>
                        </tr>
                      ))}
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
