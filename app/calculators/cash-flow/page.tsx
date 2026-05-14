'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

import { calculateCashFlow } from '@/lib/calculators/cashFlow'
import { CashFlowAnalyzerResult, CashFlowItem } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { useDebouncedCalc } from '@/lib/hooks/useDebouncedCalc'
import { CurrencyInput } from '@/app/components/inputs/CurrencyInput'
import { StackedBar } from '@/app/components/charts/StackedBar'
import { Donut } from '@/app/components/charts/Donut'
import { formatINR } from '@/lib/format-currency'

export default function CashFlowAnalyzer() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [saving, setSaving] = useState(false)

  const [incomeItems, setIncomeItems] = useState<CashFlowItem[]>([
    { name: 'Salary', amount: 75000 },
  ])
  const [expenseItems, setExpenseItems] = useState<CashFlowItem[]>([
    { name: 'Rent', amount: 20000 },
    { name: 'Groceries', amount: 10000 },
    { name: 'Utilities', amount: 3000 },
  ])

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
        setAuthChecking(false)
      }
    }
    fetchSession()
  }, [router])

  const results = useDebouncedCalc<CashFlowAnalyzerResult>(
    () => calculateCashFlow({ incomeItems, expenseItems }),
    [incomeItems, expenseItems]
  )

  const totalIncome = results ? parseFloat(results.totalMonthlyIncome) : 0
  const totalExpenses = results ? parseFloat(results.totalMonthlyExpenses) : 0
  const net = results ? parseFloat(results.monthlyNetCashFlow) : 0
  const yearlyNet = results ? parseFloat(results.yearlyNetCashFlow) : 0
  const savingsRate = results ? parseFloat(results.savingsRate) : 0
  const surplus = net >= 0

  const incomeSegments = useMemo(
    () =>
      incomeItems
        .filter((i) => (i.amount ?? 0) > 0)
        .map((i) => ({ label: i.name || 'Untitled', value: Number(i.amount) || 0 })),
    [incomeItems]
  )
  const expenseSegments = useMemo(
    () =>
      expenseItems
        .filter((i) => (i.amount ?? 0) > 0)
        .map((i) => ({ label: i.name || 'Untitled', value: Number(i.amount) || 0 })),
    [expenseItems]
  )

  const savingsRingSegments = useMemo(() => {
    const spent = Math.min(totalExpenses, totalIncome)
    const saved = Math.max(0, totalIncome - totalExpenses)
    return [
      { label: 'Saved', value: saved, color: '#0B3D2E' },
      { label: 'Spent', value: spent, color: '#D3D1C7' },
    ]
  }, [totalIncome, totalExpenses])

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
      if (response.ok) addToast('Result saved successfully', 'success')
      else addToast('Failed to save result', 'error')
    } catch (error) {
      console.error('Save error:', error)
      addToast('Error saving result', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-spin h-10 w-10 border-2 border-ink-200 border-t-forest-400 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <a href="/calculators" className="text-forest-700 hover:text-forest-500 font-semibold mb-6 inline-block">
          ← Back to Calculators
        </a>

        <h1 className="font-serif text-4xl text-ink-900 mb-2">Cash Flow Analyzer</h1>
        <p className="text-ink-600 mb-10">Track every rupee in and out — see your savings rate and surplus update as you type.</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* INPUTS */}
          <div className="space-y-8">
            <ItemSection
              title="Monthly income"
              items={incomeItems}
              setItems={setIncomeItems}
              addLabel="Add income source"
              namePlaceholder="e.g., Salary, Freelance"
            />

            <ItemSection
              title="Monthly expenses"
              items={expenseItems}
              setItems={setExpenseItems}
              addLabel="Add expense"
              namePlaceholder="e.g., Rent, Groceries"
            />
          </div>

          {/* RESULTS */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Income" value={totalIncome} tone="neutral" />
              <Stat label="Expenses" value={totalExpenses} tone="neutral" />
              <Stat
                label={surplus ? 'Surplus' : 'Deficit'}
                value={Math.abs(net)}
                tone={surplus ? 'good' : 'bad'}
              />
              <Stat
                label="Savings rate"
                value={savingsRate}
                tone={savingsRate >= 20 ? 'good' : savingsRate >= 0 ? 'neutral' : 'bad'}
                suffix="%"
                fixed={1}
                isCurrency={false}
              />
            </div>

            <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
              <Donut
                segments={savingsRingSegments}
                size={220}
                thickness={0.32}
                centerLabel={`${savingsRate.toFixed(1)}%`}
                centerSubLabel="of income saved"
              />
            </div>

            {incomeSegments.length > 0 && (
              <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
                <StackedBar segments={incomeSegments} title="Where income comes from" />
              </div>
            )}

            {expenseSegments.length > 0 && (
              <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
                <StackedBar segments={expenseSegments} title="Where money goes" />
              </div>
            )}

            <div className="bg-forest-50 border-l-4 border-forest-200 rounded-bk-md p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-forest-700 font-semibold mb-1">
                Annualized
              </p>
              <p className="text-ink-900">
                Yearly {surplus ? 'surplus' : 'deficit'}:{' '}
                <span className="font-data tabular-nums font-semibold">
                  ₹{formatINR(Math.abs(yearlyNet))}
                </span>
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !results}
              className="w-full py-3 px-4 rounded-bk-md bg-forest-700 hover:bg-forest-500 text-paper font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemSection({
  title,
  items,
  setItems,
  addLabel,
  namePlaceholder,
}: {
  title: string
  items: CashFlowItem[]
  setItems: (next: CashFlowItem[]) => void
  addLabel: string
  namePlaceholder: string
}) {
  return (
    <div className="bg-paper border border-ink-200 rounded-bk-lg p-6 shadow-bk-sm">
      <h2 className="font-serif text-xl text-ink-900 mb-4">{title}</h2>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-stretch">
            <input
              type="text"
              value={item.name}
              onChange={(e) => {
                const updated = [...items]
                updated[index] = { ...updated[index], name: e.target.value }
                setItems(updated)
              }}
              placeholder={namePlaceholder}
              className="flex-1 px-3 py-2.5 bg-paper border border-ink-200 rounded-bk-md text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
            />
            <div className="w-44">
              <CurrencyInput
                value={item.amount ?? null}
                onChange={(n) => {
                  const updated = [...items]
                  updated[index] = { ...updated[index], amount: n ?? 0 }
                  setItems(updated)
                }}
                ariaLabel={`${item.name || 'Item'} amount`}
              />
            </div>
            <button
              onClick={() => setItems(items.filter((_, i) => i !== index))}
              disabled={items.length <= 1}
              className="text-ink-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-2"
              aria-label="Remove"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setItems([...items, { name: '', amount: 0 }])}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
      >
        <PlusIcon className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
  suffix,
  fixed = 0,
  isCurrency = true,
}: {
  label: string
  value: number
  tone: 'good' | 'bad' | 'neutral'
  suffix?: string
  fixed?: number
  isCurrency?: boolean
}) {
  const toneColor =
    tone === 'good' ? 'text-forest-700' : tone === 'bad' ? 'text-red-700' : 'text-ink-900'
  const display = isCurrency
    ? `₹${formatINR(value)}`
    : `${value.toFixed(fixed)}${suffix ?? ''}`
  return (
    <div className="bg-paper border border-ink-200 rounded-bk-md p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-1">
        {label}
      </p>
      <p className={`font-data tabular-nums text-2xl font-medium ${toneColor}`}>{display}</p>
    </div>
  )
}
