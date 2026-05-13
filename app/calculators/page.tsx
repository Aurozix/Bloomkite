'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalculatorIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  StarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface Calculator {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  path: string
}

const calculators: Calculator[] = [
  {
    id: 'goal-planner',
    name: 'Goal Planner',
    description: 'Calculate how much you need to save monthly to reach your financial goals',
    icon: ArrowTrendingUpIcon,
    path: '/calculators/goal-planner',
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Analyzer',
    description: 'Analyze your monthly income and expenses to understand your financial position',
    icon: CurrencyDollarIcon,
    path: '/calculators/cash-flow',
  },
  {
    id: 'net-worth',
    name: 'Net Worth Calculator',
    description: 'Calculate your total net worth by tracking assets and liabilities',
    icon: ChartBarIcon,
    path: '/calculators/net-worth',
  },
  {
    id: 'priority-ranker',
    name: 'Priority Ranker',
    description: 'Prioritize your financial goals based on urgency and importance',
    icon: StarIcon,
    path: '/calculators/priority-ranker',
  },
  {
    id: 'insurance-needs',
    name: 'Insurance Needs',
    description: 'Determine how much life insurance coverage you need based on your income',
    icon: ShieldCheckIcon,
    path: '/calculators/insurance-needs',
  },
  {
    id: 'risk-profiler',
    name: 'Risk Profiler',
    description: 'Assess your risk tolerance and get personalized investment recommendations',
    icon: CalculatorIcon,
    path: '/calculators/risk-profiler',
  },
]

export default function Calculators() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Financial Calculators</h1>
          <p className="text-xl text-gray-600">
            Use our suite of financial planning tools to make better decisions
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calc) => {
            const IconComponent = calc.icon
            return (
              <button
                key={calc.id}
                onClick={() => router.push(calc.path)}
                className="card p-6 text-left hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <IconComponent
                    className="h-10 w-10"
                    style={{ color: 'var(--primary-600)' }}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{calc.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{calc.description}</p>
                <div
                  className="inline-block text-sm font-semibold"
                  style={{ color: 'var(--primary-600)' }}
                >
                  Open Calculator →
                </div>
              </button>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-16 card p-8 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About These Calculators</h2>
          <p className="text-gray-600 mb-4">
            Our financial calculators help you understand your financial situation, set realistic
            goals, and make informed investment decisions.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Easy-to-use tools with clear, actionable results</li>
            <li>✓ Calculations based on standard financial formulas</li>
            <li>✓ Save your results for future reference</li>
            <li>✓ Get personalized recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
