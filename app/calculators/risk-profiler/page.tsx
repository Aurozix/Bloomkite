'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateRiskProfile } from '@/lib/calculators/riskProfiler'
import { RiskProfilerAnswer, RiskProfilerResult } from '@/lib/calculators/types'
import { useToast } from '@/app/components/toast-context'
import { Donut } from '@/app/components/charts/Donut'

interface Question {
  number: number
  text: string
  options: { score: number; label: string }[]
  conditional?: boolean
  conditionCheckFor?: number
  conditionCheckValue?: number
}

// Fallback only used if the master-data API fetch fails. The canonical
// source is now risk_profile_questions / risk_profile_answers (BRD §6.3 /
// Calculators §6 — DB-driven questionnaire). database/seed-risk-profile.ts
// owns the seed and is the single source of truth.
const FALLBACK_QUESTIONS: Question[] = [
  {
    number: 1,
    text: 'In comparison to your peer groups, how would you rate your willingness to take risk while making financial decisions?',
    options: [
      { score: 1, label: 'I enjoy taking very high risk as the same rewards high return' },
      { score: 2, label: 'I am comfortable taking high risk as I want to make more returns' },
      { score: 3, label: 'I am ok with moderate risk my objective is to beat inflation' },
      { score: 4, label: 'I generally take low risk options to understand new financial scheme' },
      { score: 5, label: 'I donot take risk at all better to be safe and secured' },
    ],
  },
  {
    number: 2,
    text: 'How familiar are you with investment schemes and financial markets in India?',
    options: [
      { score: 1, label: 'I have experience with multiple schemes like Fixed deposits, Insurance, Mutual funds, Stocks' },
      { score: 2, label: 'I understand that different schemes give different income, growth and taxation' },
      { score: 4, label: 'I have some experience to understand some aspects of investment schemes/markets' },
      { score: 5, label: 'I have very little understanding of investment markets and have not invested till date' },
    ],
  },
  {
    number: 3,
    text: 'Have you ever invested before in stock markets, mutual funds and unit linked insurance?',
    options: [
      { score: 0, label: 'Yes' },
      { score: 0, label: 'No' },
    ],
  },
  {
    number: 3.1,
    text: 'How would you describe your experience with such investment schemes?',
    options: [
      { score: 1, label: 'I have positive experiences and never get misguided in my investment decision' },
      { score: 3, label: 'I am not familiar with investment hence I am more cautious to avoid mistakes' },
      { score: 5, label: 'I have previously lost money as an investor and am very cautious about investing' },
    ],
    conditional: true,
    conditionCheckFor: 3,
    conditionCheckValue: 0, // Show if Q3 answer is Yes (index 0)
  },
  {
    number: 4,
    text: 'Assuming that you are investing in stocks or mutual funds now: six months later you found that your investment value is decreased in value by 20%. What would be your reaction?',
    options: [
      { score: 1, label: 'Considering this as an opportunity I would make additional investments for future growth' },
      { score: 2, label: 'I would make additional investments to the extent of loss, expecting future growth' },
      { score: 3, label: 'I would leave the investment as it is and wait to see if the investment improves' },
      { score: 5, label: 'I would withdraw all my investments at current loss and transfer into secured schemes' },
    ],
  },
  {
    number: 5,
    text: 'What is the most aggressive investment you have made?',
    options: [
      { score: 1, label: 'Direct shares' },
      { score: 2, label: 'Mutual funds' },
      { score: 3, label: 'Investment in real estate / Gold / Insurance' },
      { score: 4, label: 'Own home for staying purpose' },
      { score: 5, label: 'Bank savings account or Recurring deposits' },
    ],
  },
  {
    number: 6,
    text: 'Most investments can fluctuate both up and down (i.e. volatility). How much could your investment fall in value over a 12 month period before you feel concerned and anxious?',
    options: [
      { score: 1, label: 'More than 50%' },
      { score: 2, label: 'Up to 50%' },
      { score: 3, label: 'Up to 25%' },
      { score: 4, label: 'Up to 10%' },
      { score: 5, label: 'Up to 5%' },
      { score: 6, label: 'Any fall in the value of my investments would make me feel concerned and anxious' },
    ],
  },
  {
    number: 7,
    text: 'Once investments have been placed, how long would it be before you would need to access your capital?',
    options: [
      { score: 1, label: 'Longer than 7 years' },
      { score: 2, label: 'Between 5 and 7 years' },
      { score: 3, label: 'Between 3 and 5 years' },
      { score: 4, label: 'Between 2 and 3 years' },
      { score: 5, label: 'Less than 2 years (parking)' },
    ],
  },
  {
    number: 8,
    text: 'How much money have you set aside (outside of your superannuation) to handle emergencies?',
    options: [
      { score: 1, label: 'Less than 1 month of living expenses' },
      { score: 3, label: 'Between 3 and 6 months of living expenses' },
      { score: 5, label: 'More than 6 months of living expenses' },
    ],
  },
  {
    number: 9,
    text: 'Inflation is a rise in the general level of prices of goods over time, which can reduce your spending power. How much risk are you prepared to take to counteract the effects of inflation?',
    options: [
      { score: 1, label: 'I am comfortable with short to medium term losses in order to beat inflation over the longer term' },
      { score: 3, label: 'I am conscious of the effects of inflation, but would prefer a position that limits short to medium-term losses' },
      { score: 5, label: 'Inflation may erode my savings over the long-term, but I have little tolerance for short to medium term losses' },
    ],
  },
  {
    number: 10,
    text: 'Would you be more concerned about the potential gains or possible losses when you are considering your investment options?',
    options: [
      { score: 1, label: 'Potential gains' },
      { score: 3, label: 'Equally interested in the possible losses and potential gains' },
      { score: 5, label: 'Possible losses' },
    ],
  },
  {
    number: 11,
    text: 'Over the longer term, what return do you reasonably expect to achieve from your investment portfolio?',
    options: [
      { score: 1, label: '8% or above per annum' },
      { score: 2, label: '6-8% per annum' },
      { score: 3, label: '4-6% per annum' },
      { score: 4, label: '2-4% per annum' },
      { score: 5, label: '0-2% per annum' },
    ],
  },
  {
    number: 12,
    text: 'Have you had an investment fall in value? If so, how did it make you feel?',
    options: [
      { score: 1, label: 'Unconcerned but anticipating future investment opportunities' },
      { score: 2, label: 'Unconcerned but not making any further investments' },
      { score: 3, label: 'Concerned' },
      { score: 4, label: 'Very concerned and asking friends and family about what I should do' },
      { score: 5, label: 'I have never experienced an investment fall in value and would not want to' },
    ],
  },
  {
    number: 13,
    text: 'What degree of risk are you prepared to take to achieve your desired return?',
    options: [
      { score: 1, label: 'I want to maximise potential returns regardless of risk' },
      { score: 2, label: 'A high degree of risk would be acceptable for a large increase in potential returns' },
      { score: 3, label: 'A moderate degree of risk would be acceptable for a medium increase in potential returns' },
      { score: 4, label: 'A limited degree of risk would be acceptable for a slight increase in potential returns' },
      { score: 5, label: 'Security of capital is required regardless of potential returns' },
    ],
  },
  {
    number: 14,
    text: 'What are your future income requirements from your investments?',
    options: [
      { score: 1, label: 'I require no amount of investment income as the focus should only be on capital growth' },
      { score: 2, label: 'I require a small amount of investment income as I am mainly concerned with capital growth' },
      { score: 3, label: 'I require an equal combination of investment income and capital growth' },
      { score: 4, label: 'I require a large amount of investment income with only some capital growth' },
      { score: 5, label: 'I require all of my investments to have a focus on income as capital growth is not required' },
    ],
  },
  {
    number: 15,
    text: 'Have you ever borrowed money to make an investment?',
    options: [
      { score: 1, label: 'I have borrowed money to invest in managed funds or direct shares or structured products' },
      { score: 3, label: 'I have only borrowed money to invest in an investment or rental property' },
      { score: 5, label: 'I have never borrowed money to invest outside my own home' },
    ],
  },
  {
    number: 16,
    text: 'Based on your answer to the previous question, how did borrowing to invest make you feel?',
    options: [
      { score: 1, label: 'Very confident' },
      { score: 2, label: 'Confident' },
      { score: 3, label: 'Concerned' },
      { score: 4, label: 'Very concerned' },
      { score: 5, label: 'I have never borrowed money outside my own home' },
    ],
  },
]

export default function RiskProfiler() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [answers, setAnswers] = useState<Map<number, number>>(new Map())
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [results, setResults] = useState<RiskProfilerResult | null>(null)
  const [questions, setQuestions] = useState<Question[]>(FALLBACK_QUESTIONS)

  // Filter questions to show only non-conditional or those where condition is met
  const visibleQuestions = questions.filter((q) => {
    if (!q.conditional) return true
    const conditionQNum = q.conditionCheckFor
    if (conditionQNum === undefined) return false
    const conditionAnswer = answers.get(conditionQNum)
    if (conditionAnswer === undefined) return false
    // For Q3, if answer is 0 (Yes), show Q3A. If answer is 1 (No), skip Q3A
    return conditionAnswer === q.conditionCheckValue
  })

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

        // Load DB-driven questions. Silent fall-through to FALLBACK_QUESTIONS
        // on failure — calculator must never block on master-data loading.
        try {
          const r = await fetch('/api/calculators/risk-profiler/questions')
          if (r.ok) {
            const json = await r.json()
            type ApiQuestion = {
              questionNumber: number
              text: string
              options: { score: number; label: string }[]
              conditional: { onQuestionNumber: number; onAnswerScore: number | null } | null
            }
            const apiQs: ApiQuestion[] = json.questions ?? []
            if (apiQs.length > 0) {
              setQuestions(
                apiQs.map((q): Question => ({
                  number: q.questionNumber,
                  text: q.text,
                  options: q.options,
                  conditional: q.conditional ? true : undefined,
                  conditionCheckFor: q.conditional?.onQuestionNumber,
                  conditionCheckValue:
                    q.conditional?.onAnswerScore ?? undefined,
                })),
              )
            }
          }
        } catch {
          // Silent fall-through.
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

  const currentQuestion = visibleQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100

  const handleAnswerSelect = (score: number) => {
    const newAnswers = new Map(answers)
    newAnswers.set(currentQuestion.number, score)
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion && answers.has(currentQuestion.number)) {
      if (isLastQuestion) {
        handleFinish()
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    } else {
      addToast('Please select an answer', 'error')
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleFinish = async () => {
    try {
      setCalculating(true)

      // Convert answers to RiskProfilerAnswer format
      const answerArray: RiskProfilerAnswer[] = Array.from(answers.entries()).map(([qNum, score]) => ({
        questionNumber: qNum,
        answerScore: score,
      }))

      const result = calculateRiskProfile({
        answers: answerArray,
      })

      setResults(result)

      // Auto-save as draft
      await saveDraft(result)
    } catch (error) {
      console.error('Calculation error:', error)
      addToast('Error calculating risk profile', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const saveDraft = async (resultData: RiskProfilerResult) => {
    try {
      const answerArray: RiskProfilerAnswer[] = Array.from(answers.entries()).map(([qNum, score]) => ({
        questionNumber: qNum,
        answerScore: score,
      }))

      await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'risk-profiler',
          inputs: { answers: answerArray },
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

      const answerArray: RiskProfilerAnswer[] = Array.from(answers.entries()).map(([qNum, score]) => ({
        questionNumber: qNum,
        answerScore: score,
      }))

      const response = await fetch('/api/calculators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculator_type: 'risk-profiler',
          name: `Risk Profile - ${results.riskCategory}`,
          inputs: { answers: answerArray },
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

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <a href="/calculators" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
            ← Back to Calculators
          </a>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">Risk Profiler</h1>
          <p className="text-gray-600 mb-12">
            Answer a series of questions to determine your investment risk profile
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Question {currentQuestionIndex + 1} of {visibleQuestions.length}
              </p>
              <p className="text-sm font-semibold text-gray-700">{Math.round(progress)}%</p>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div className="card p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentQuestion.text}</h2>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option.score)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                      answers.get(currentQuestion.number) === option.score
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{option.label}</p>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  disabled={currentQuestionIndex === 0}
                  className="btn-outline flex-1 py-3"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!answers.has(currentQuestion.number) || calculating}
                  className="btn-primary flex-1 py-3"
                >
                  {isLastQuestion ? (calculating ? 'Calculating...' : 'Finish') : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Results view
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <a href="/calculators" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Calculators
        </a>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Your Risk Profile Results</h1>

        {/* Risk Category */}
        <div className="card p-8 mb-8 text-center">
          <p className="text-gray-600 mb-2">Your Risk Category</p>
          <h2 className="text-5xl font-bold mb-4" style={{ color: 'var(--primary-600)' }}>
            {results.riskCategory}
          </h2>
          <p className="text-gray-700">Risk Score: {results.totalScore}</p>
        </div>

        {/* Portfolio Allocation */}
        <div className="card p-8 mb-8">
          <h3 className="font-serif text-2xl font-medium text-forest-700 mb-6">
            Recommended portfolio allocation
          </h3>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
            <Donut
              size={240}
              segments={[
                { label: 'Equity (Stocks)', value: results.equityAllocation, color: '#0B3D2E' },
                { label: 'Debt (Bonds)', value: results.debtAllocation, color: '#1D9E75' },
                { label: 'Cash', value: results.cashAllocation, color: '#9DD4BB' },
              ]}
              centerLabel={results.riskCategory}
              centerSubLabel={`Score ${results.totalScore}`}
              hideLegend
            />

            {/* Custom legend with the brand-aligned typography. The Donut's
                built-in legend works too; we render our own here so the
                breakdown sits next to the chart on desktop. */}
            <ul className="flex-1 w-full max-w-sm space-y-3">
              <LegendRow color="#0B3D2E" label="Equity (Stocks)" pct={results.equityAllocation} />
              <LegendRow color="#1D9E75" label="Debt (Bonds)" pct={results.debtAllocation} />
              <LegendRow color="#9DD4BB" label="Cash" pct={results.cashAllocation} />
            </ul>
          </div>

          <div className="bg-forest-50 border-l-2 border-forest-200 p-4 rounded-r-bk-md">
            <p className="text-xs uppercase tracking-[0.12em] font-semibold text-ink-400 mb-2">
              What this means
            </p>
            <p className="text-ink-900 text-sm leading-relaxed">
              Based on your answers, the recommended composition is{' '}
              <span className="font-data tabular-nums font-medium">{results.equityAllocation}%</span> stocks,{' '}
              <span className="font-data tabular-nums font-medium">{results.debtAllocation}%</span> bonds, and{' '}
              <span className="font-data tabular-nums font-medium">{results.cashAllocation}%</span> cash. This balances
              growth potential against your tolerance for volatility.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3 text-lg"
        >
          {saving ? 'Saving...' : 'Save Result'}
        </button>
      </div>
    </div>
  )
}

function LegendRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="w-3 h-3 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-ink-900 flex-1">{label}</span>
      <span className="font-data tabular-nums font-medium text-forest-700">{pct}%</span>
    </li>
  )
}
