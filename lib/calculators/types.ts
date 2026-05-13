import Decimal from 'decimal.js'

// Goal Planner
export interface GoalPlannerInput {
  goalAmount: number
  currentSavings: number
  tenureYears: number
  inflationRate: number
  growthRate: number
  investmentRate: number
}

export interface GoalPlannerResult {
  futureValue: string
  requiredMonthlyInvestment: string
  totalInvestmentNeeded: string
  gap: string
  monthlyInvestmentAfterInflation: string
}

// Cash Flow Analyzer
export interface CashFlowItem {
  name: string
  amount: number
}

export interface CashFlowAnalyzerInput {
  incomeItems: CashFlowItem[]
  expenseItems: CashFlowItem[]
}

export interface CashFlowAnalyzerResult {
  totalMonthlyIncome: string
  totalMonthlyExpenses: string
  monthlyNetCashFlow: string
  yearlyNetCashFlow: string
  savingsRate: string
  surplus: string
  deficit: string
}

// Net Worth Calculator
export interface AssetCategory {
  name: string
  amount: number
}

export interface LiabilityCategory {
  name: string
  amount: number
}

export interface NetWorthCalculatorInput {
  assets: AssetCategory[]
  liabilities: LiabilityCategory[]
}

export interface NetWorthCalculatorResult {
  totalAssets: string
  totalLiabilities: string
  netWorth: string
  assetBreakdown: {
    category: string
    amount: string
    percentage: string
  }[]
}

// Priority Ranker
export interface Goal {
  name: string
  urgencyLevel: number
}

export interface PriorityRankerInput {
  goals: Goal[]
}

export interface RankedGoal {
  priority: number
  name: string
  urgencyLevel: number
  urgencyDescription: string
}

export type PriorityRankerResult = RankedGoal[]

// Insurance Needs
export type IncomeStability = 'STABLE' | 'FLUCTUATING'
export type IncomePredictability = 'PREDICTABLE' | 'UNPREDICTABLE'

export interface InsuranceNeedsInput {
  annualIncome: number
  incomeStability: IncomeStability
  incomePredictability: IncomePredictability
  existingInsurance: number
}

export interface InsuranceNeedsResult {
  requiredInsurance: string
  coverageMultiplier: number
  existingInsurance: string
  additionalCoverageNeeded: string
  riskProfile: string
}

// Risk Profiler
export interface RiskProfilerAnswer {
  questionNumber: number
  answerScore: number
}

export interface RiskProfilerInput {
  answers: RiskProfilerAnswer[]
}

export interface RiskProfilerResult {
  totalScore: number
  riskCategory: 'Conservative' | 'Moderately Conservative' | 'Moderate' | 'Moderately Aggressive' | 'Aggressive'
  equityAllocation: number
  debtAllocation: number
  cashAllocation: number
}

// Future Value: how much will P grow at r% for n years
export interface FutureValueInput {
  presentValue: number
  annualRate: number
  tenureYears: number
}

export interface FutureValueResult {
  futureValue: string
  totalInterest: string
  effectiveAnnualGrowth: string
}

// Target Value: how much to invest monthly to reach FV at r% for n years
export interface TargetValueInput {
  targetAmount: number
  annualRate: number
  tenureYears: number
}

export interface TargetValueResult {
  requiredMonthlyInvestment: string
  totalContribution: string
  expectedReturns: string
}

// Rate Finder: what r is needed to grow PV to FV in n years
export interface RateFinderInput {
  presentValue: number
  futureValue: number
  tenureYears: number
}

export interface RateFinderResult {
  requiredAnnualRate: string
  multiplier: string
}

// Tenure Finder: how long to grow PV to FV at r%
export interface TenureFinderInput {
  presentValue: number
  futureValue: number
  annualRate: number
}

export interface TenureFinderResult {
  requiredYears: string
  requiredMonths: string
}

// Generic save/load types
export interface SaveCalculatorInput {
  calculator_type: string
  name?: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
  is_draft: boolean
}

export interface CalculatorResult<T> {
  success: boolean
  data?: T
  error?: string
}
