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
  BanknotesIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  ScaleIcon,
  HomeModernIcon,
  WalletIcon,
  ReceiptPercentIcon,
  ArrowsRightLeftIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline'

interface Calculator {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  path: string
}

// Consolidated calculators are the recommended entry points — they answer
// every question a borrower or investor really has, and the page itself
// teaches the principles behind each answer. The individual calculators
// remain available for power users or for embedding in saved plans, but
// the consolidated pages are where most users should start.
const consolidatedCalculators: Calculator[] = [
  {
    id: 'consolidated',
    name: 'Plan your money',
    description:
      'Future value, required SIP, required return, required tenure — one canvas that answers the four questions every investor really has',
    icon: Squares2X2Icon,
    path: '/calculators/consolidated',
  },
  {
    id: 'loans-consolidated',
    name: 'Plan your loan',
    description:
      'EMI, capacity, prepayment impact, EMI change, rate change — everything a borrower needs in one walkthrough',
    icon: BuildingLibraryIcon,
    path: '/calculators/loans-consolidated',
  },
]

const individualCalculators: Calculator[] = [
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
  {
    id: 'future-value',
    name: 'Future Value',
    description: 'How much will your investment grow at a fixed annual rate?',
    icon: BanknotesIcon,
    path: '/calculators/future-value',
  },
  {
    id: 'target-value',
    name: 'Target Value',
    description: 'How much to invest monthly to reach your target amount?',
    icon: ScaleIcon,
    path: '/calculators/target-value',
  },
  {
    id: 'rate-finder',
    name: 'Rate Finder',
    description: 'What annual return rate is needed to reach your goal?',
    icon: AdjustmentsHorizontalIcon,
    path: '/calculators/rate-finder',
  },
  {
    id: 'tenure-finder',
    name: 'Tenure Finder',
    description: 'How long will it take to reach your target at the given rate?',
    icon: ClockIcon,
    path: '/calculators/tenure-finder',
  },
  {
    id: 'emi',
    name: 'EMI Calculator',
    description: 'Calculate monthly loan EMI with a full amortization schedule',
    icon: HomeModernIcon,
    path: '/calculators/emi',
  },
  {
    id: 'emi-capacity',
    name: 'EMI Capacity',
    description: 'Maximum loan you can afford from your income, expenses, and stability',
    icon: WalletIcon,
    path: '/calculators/emi-capacity',
  },
  {
    id: 'partial-payment',
    name: 'Partial Payment Impact',
    description: 'How lump-sum prepayments shorten your loan tenure and save interest',
    icon: ReceiptPercentIcon,
    path: '/calculators/partial-payment',
  },
  {
    id: 'emi-change',
    name: 'EMI Change Impact',
    description: 'Impact of raising or lowering your EMI mid-loan on tenure and interest',
    icon: ArrowsRightLeftIcon,
    path: '/calculators/emi-change',
  },
  {
    id: 'rate-change',
    name: 'Rate Change Impact',
    description: 'Compare keeping EMI vs. keeping tenure when your interest rate changes',
    icon: PresentationChartLineIcon,
    path: '/calculators/rate-change',
  },
]

export default function Calculators() {
  const router = useRouter()
  const [, setUser] = useState<any>(null)
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
        <div className="animate-spin h-12 w-12 border-4 border-ink-100 border-t-forest-400 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a
            href="/dashboard"
            className="text-forest-700 hover:text-forest-500 font-semibold mb-6 inline-block"
          >
            ← Back to Dashboard
          </a>
          <h1 className="font-serif text-4xl text-ink-900 mb-3">Financial Calculators</h1>
          <p className="text-xl text-ink-600">
            Use our suite of financial planning tools to make better decisions
          </p>
        </div>

        {/* CONSOLIDATED — top of page, visually distinct. The 2 cards here */}
        {/* are the recommended entry points: each one consolidates a       */}
        {/* family of related calculators into a single guided walkthrough. */}
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-700">
              Start here · Consolidated walkthroughs
            </h2>
            <span className="text-xs text-ink-400">Recommended</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {consolidatedCalculators.map((calc) => {
              const IconComponent = calc.icon
              return (
                <button
                  key={calc.id}
                  onClick={() => router.push(calc.path)}
                  className="text-left p-8 rounded-bk-lg border-2 border-forest-200 bg-forest-50 hover:border-forest-400 hover:bg-forest-50/80 transition-all shadow-bk-sm cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <IconComponent className="h-12 w-12 text-forest-700" />
                  </div>
                  <h3 className="text-2xl font-serif text-ink-900 mb-2">{calc.name}</h3>
                  <p className="text-ink-600 text-sm mb-4 leading-relaxed">{calc.description}</p>
                  <div className="inline-block text-sm font-semibold text-forest-700">
                    Open walkthrough →
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* INDIVIDUAL — the underlying single-purpose calculators. Still */}
        {/* available for users who want a specific tool, but visually     */}
        {/* less prominent than the consolidated walkthroughs above.       */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-4">
            Or pick a single-purpose calculator
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {individualCalculators.map((calc) => {
              const IconComponent = calc.icon
              return (
                <button
                  key={calc.id}
                  onClick={() => router.push(calc.path)}
                  className="card p-6 text-left hover:shadow-bk-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <IconComponent className="h-10 w-10 text-forest-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink-900 mb-2">{calc.name}</h3>
                  <p className="text-ink-600 text-sm mb-4">{calc.description}</p>
                  <div className="inline-block text-sm font-semibold text-forest-700">
                    Open calculator →
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Info Section */}
        <div className="mt-16 card p-8">
          <h2 className="text-2xl font-serif text-ink-900 mb-4">About these calculators</h2>
          <p className="text-ink-600 mb-4">
            Our financial calculators help you understand your financial situation, set realistic
            goals, and make informed investment decisions.
          </p>
          <ul className="space-y-2 text-ink-600">
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
