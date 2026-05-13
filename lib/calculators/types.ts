import Decimal from 'decimal.js'

// Goal Planner
// Output field names mirror Calculators_Requirements.md §1.4 directly.
export type GoalPlannerTenureType = 'MONTH' | 'YEAR'

export interface GoalPlannerInput {
  goalAmount: number
  currentAmount: number
  tenure: number
  tenureType: GoalPlannerTenureType
  inflationRate: number
  growthRate: number
  annualInvestmentRate: number
}

export interface GoalPlannerResult {
  // Inflation-adjusted goal amount at the end of the tenure.
  futureCost: string
  // Current savings grown at `growthRate` to the end of the tenure.
  futureValue: string
  // Gap = futureCost − futureValue (capped at 0 if already met).
  finalCorpus: string
  // Monthly investment needed to accumulate `finalCorpus` at `annualInvestmentRate`.
  monthlyInv: string
  // Annual equivalent = monthlyInv × 12.
  annualInv: string
  // Monthly rate used in the annuity formula (for transparency).
  rateOfReturn: string
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

// EMI Calculator: monthly EMI + amortization schedule for a fixed-rate loan
export type EMITenureType = 'MONTH' | 'YEAR'

export interface EMICalculatorInput {
  loanAmount: number
  tenure: number
  tenureType: EMITenureType
  interestRate: number
  // Loan start date in MMM-yyyy format (per spec §11.2). Optional; defaults to current month.
  startDate?: string
}

export interface EMIAmortizationRow {
  monthNumber: number
  date: string
  openingBalance: string
  interest: string
  principal: string
  closingBalance: string
  loanPaid: string
  totalPaid: string
}

export interface EMICalculatorResult {
  emi: string
  interestPayable: string
  total: string
  loanAmount: string
  tenure: number
  rate: string
  amortisationResponse: EMIAmortizationRow[]
}

// EMI Capacity Calculator: max loan affordable given income, expenses, stability
export type IncomeStabilityLevel = 'HIGH' | 'MEDIUM'
export type BackupAvailability = 'YES' | 'NO'

export interface EMICapacityInput {
  currentAge: number
  retirementAge: number
  netFamilyIncome: number
  existingEmi: number
  houseHoldExpense: number
  additionalIncome: number
  stability: IncomeStabilityLevel
  backUp: BackupAvailability
  interestRate: number
}

export interface EMICapacityResult {
  surplusMoney: string
  surplus: string
  emiCapacity: string
  termOfLoan: number
  advisableLoanAmount: string
  monthlyEmiAffordable: string
  stabilityMultiplier: string
}

// Partial Payment Calculator: impact of one or more lump-sum prepayments
// on a running loan. EMI stays the same; tenure shortens; interest drops.
export interface PartialPaymentEntry {
  partPayDate: string
  partPayAmount: number
}

export interface PartialPaymentInput {
  loanAmount: number
  interestRate: number
  tenure: number
  tenureType: EMITenureType
  loanDate?: string
  partialPaymentReq: PartialPaymentEntry[]
}

// Amortization row with an optional partial-payment column. Reuses the same
// shape as the EMI schedule so the UI can render either table.
export interface PartialPaymentRow extends EMIAmortizationRow {
  partialPayment: string
}

export interface PartialPaymentResult {
  emi: string
  originalTenureMonths: number
  originalTenureYears: string
  originalTotalInterest: string
  revisedTenureMonths: number
  revisedTenureYears: string
  tenureReductionMonths: number
  tenureReductionYears: string
  totalInterestNow: string
  interestSaved: string
  newAmortisation: PartialPaymentRow[]
}

// EMI Change Impact Calculator: one or more mid-loan EMI changes. Rate is
// fixed; principal isn't touched directly; the tenure adjusts to whatever the
// running EMI sequence can amortize.
export interface EmiChangeEntry {
  emiChangedDate: string
  newEmi: number
}

export interface EmiChangeInput {
  loanAmount: number
  interestRate: number
  tenure: number
  tenureType: EMITenureType
  loanDate?: string
  emiChangeReq: EmiChangeEntry[]
}

// Adds an `emiUsed` column so the row remains interpretable after the EMI
// changes mid-stream (the principal/interest split alone doesn't reveal it).
export interface EmiChangeRow extends EMIAmortizationRow {
  emiUsed: string
}

export interface EmiChangeResult {
  originalEmi: string
  finalEmi: string
  originalTenureMonths: number
  originalTenureYears: string
  originalTotalInterest: string
  revisedTenureMonths: number
  revisedTenureYears: string
  tenureReductionMonths: number
  tenureReductionYears: string
  totalInterestNow: string
  interestSaved: string
  // True if the running EMI dropped below the interest accrual at some point
  // (negative amortization) and the schedule had to be truncated. Callers
  // surface this so the UI doesn't show a bogus "tenure reduction".
  diverged: boolean
  newAmortisation: EmiChangeRow[]
}

// Rate Change Impact Calculator: one or more mid-loan interest-rate swaps.
// Spec §15 defines two responses to a rate change — Approach A keeps the EMI
// constant (tenure adjusts) and Approach B keeps the tenure constant (EMI
// adjusts). We compute both so the UI can show side-by-side.
export interface InterestChangeEntry {
  interestChangedDate: string
  changedRate: number
}

export interface RateChangeInput {
  loanAmount: number
  interestRate: number
  tenure: number
  tenureType: EMITenureType
  loanDate?: string
  interestChangeReq: InterestChangeEntry[]
}

// Row carries the rate and EMI in effect that month so the schedule stays
// interpretable across mid-stream swaps.
export interface RateChangeRow extends EMIAmortizationRow {
  emiUsed: string
  rateUsed: string
}

export type RateChangeApproach = 'TENURE_ADJUSTS' | 'EMI_ADJUSTS'

export interface RateChangeApproachResult {
  approach: RateChangeApproach
  finalEmi: string
  revisedTenureMonths: number
  revisedTenureYears: string
  tenureChangeMonths: number
  tenureChangeYears: string
  emiChange: string
  totalInterest: string
  interestSaved: string
  diverged: boolean
  newAmortisation: RateChangeRow[]
}

export interface RateChangeResult {
  originalEmi: string
  originalTenureMonths: number
  originalTenureYears: string
  originalTotalInterest: string
  approachA: RateChangeApproachResult
  approachB: RateChangeApproachResult
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
