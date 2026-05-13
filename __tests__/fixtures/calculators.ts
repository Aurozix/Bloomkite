import {
  GoalPlannerInput,
  CashFlowAnalyzerInput,
  NetWorthCalculatorInput,
  PriorityRankerInput,
  InsuranceNeedsInput,
  RiskProfilerInput,
  RiskProfilerAnswer,
} from '@/lib/calculators/types'

export const goalPlannerInputs = {
  // Canonical Calculators_Requirements.md §1.1 scenario:
  // ₹50L goal, 10yr, 5% inflation, ₹10L current savings at 8%, 10% returns.
  // Spec §1.4 quotes monthlyInv ≈ ₹44,124.56 but the figure is inconsistent
  // with its own formula — see goalPlanner.test.ts for the actual derived value.
  basic: {
    goalAmount: 5000000,
    currentAmount: 1000000,
    tenure: 10,
    tenureType: 'YEAR',
    inflationRate: 5,
    growthRate: 8,
    annualInvestmentRate: 10,
  } as GoalPlannerInput,

  aggressive: {
    goalAmount: 10000000,
    currentAmount: 1000000,
    tenure: 5,
    tenureType: 'YEAR',
    inflationRate: 6,
    growthRate: 10,
    annualInvestmentRate: 15,
  } as GoalPlannerInput,

  conservative: {
    goalAmount: 2000000,
    currentAmount: 1000000,
    tenure: 15,
    tenureType: 'YEAR',
    inflationRate: 4,
    growthRate: 6,
    annualInvestmentRate: 8,
  } as GoalPlannerInput,

  zeroCurrentSavings: {
    goalAmount: 1000000,
    currentAmount: 0,
    tenure: 10,
    tenureType: 'YEAR',
    inflationRate: 5,
    growthRate: 8,
    annualInvestmentRate: 12,
  } as GoalPlannerInput,
}

export const cashFlowInputs = {
  basic: {
    incomeItems: [
      { name: 'Salary', amount: 100000 },
      { name: 'Bonus', amount: 50000 },
    ],
    expenseItems: [
      { name: 'Rent', amount: 30000 },
      { name: 'Food', amount: 15000 },
      { name: 'Utilities', amount: 5000 },
    ],
  } as CashFlowAnalyzerInput,

  surplus: {
    incomeItems: [
      { name: 'Salary', amount: 200000 },
      { name: 'Investment Income', amount: 25000 },
    ],
    expenseItems: [
      { name: 'Rent', amount: 40000 },
      { name: 'Expenses', amount: 50000 },
    ],
  } as CashFlowAnalyzerInput,

  deficit: {
    incomeItems: [{ name: 'Salary', amount: 50000 }],
    expenseItems: [
      { name: 'Rent', amount: 40000 },
      { name: 'Expenses', amount: 30000 },
    ],
  } as CashFlowAnalyzerInput,
}

export const netWorthInputs = {
  basic: {
    assets: [
      { name: 'Savings Account', amount: 500000 },
      { name: 'Investment Portfolio', amount: 2000000 },
      { name: 'Real Estate', amount: 5000000 },
    ],
    liabilities: [
      { name: 'Home Loan', amount: 3000000 },
      { name: 'Personal Loan', amount: 200000 },
    ],
  } as NetWorthCalculatorInput,

  noLiabilities: {
    assets: [
      { name: 'Savings', amount: 1000000 },
      { name: 'Investments', amount: 2000000 },
    ],
    liabilities: [],
  } as NetWorthCalculatorInput,

  balanced: {
    assets: [
      { name: 'Cash', amount: 500000 },
      { name: 'Investments', amount: 3000000 },
      { name: 'Property', amount: 8000000 },
    ],
    liabilities: [
      { name: 'Mortgage', amount: 5000000 },
      { name: 'Credit Card', amount: 100000 },
    ],
  } as NetWorthCalculatorInput,
}

export const priorityRankerInputs = {
  mixed: {
    goals: [
      { name: 'Emergency Fund', urgencyLevel: 1 },
      { name: 'Retirement', urgencyLevel: 5 },
      { name: 'Children Education', urgencyLevel: 3 },
      { name: 'Dream Vacation', urgencyLevel: 9 },
    ],
  } as PriorityRankerInput,

  sameUrgency: {
    goals: [
      { name: 'Goal A', urgencyLevel: 5 },
      { name: 'Goal B', urgencyLevel: 5 },
      { name: 'Goal C', urgencyLevel: 5 },
    ],
  } as PriorityRankerInput,

  withDeleteMarker: {
    goals: [
      { name: 'Keep This', urgencyLevel: 1 },
      { name: 'Delete Me', urgencyLevel: 4 },
      { name: 'Keep This Too', urgencyLevel: 2 },
    ],
  } as PriorityRankerInput,
}

export const insuranceNeedsInputs = {
  stablePredictable: {
    annualIncome: 1000000,
    incomeStability: 'STABLE',
    incomePredictability: 'PREDICTABLE',
    existingInsurance: 500000,
  } as InsuranceNeedsInput,

  fluctuatingUnpredictable: {
    annualIncome: 1000000,
    incomeStability: 'FLUCTUATING',
    incomePredictability: 'UNPREDICTABLE',
    existingInsurance: 250000,
  } as InsuranceNeedsInput,

  highIncome: {
    annualIncome: 5000000,
    incomeStability: 'STABLE',
    incomePredictability: 'PREDICTABLE',
    existingInsurance: 2000000,
  } as InsuranceNeedsInput,

  lowIncome: {
    annualIncome: 300000,
    incomeStability: 'FLUCTUATING',
    incomePredictability: 'UNPREDICTABLE',
    existingInsurance: 100000,
  } as InsuranceNeedsInput,
}

export const riskProfilerInputs = {
  aggressive: {
    answers: [
      { questionNumber: 1, answerScore: 1 },
      { questionNumber: 2, answerScore: 1 },
      { questionNumber: 3, answerScore: 1 },
      { questionNumber: 4, answerScore: 1 },
      { questionNumber: 5, answerScore: 1 },
      { questionNumber: 6, answerScore: 1 },
      { questionNumber: 7, answerScore: 1 },
      { questionNumber: 8, answerScore: 1 },
      { questionNumber: 9, answerScore: 1 },
      { questionNumber: 10, answerScore: 1 },
      { questionNumber: 11, answerScore: 1 },
      { questionNumber: 12, answerScore: 1 },
      { questionNumber: 13, answerScore: 1 },
      { questionNumber: 14, answerScore: 1 },
      { questionNumber: 15, answerScore: 1 },
      { questionNumber: 16, answerScore: 1 },
    ] as RiskProfilerAnswer[],
  } as RiskProfilerInput,

  conservative: {
    answers: [
      { questionNumber: 1, answerScore: 5 },
      { questionNumber: 2, answerScore: 5 },
      { questionNumber: 3, answerScore: 5 },
      { questionNumber: 4, answerScore: 5 },
      { questionNumber: 5, answerScore: 5 },
      { questionNumber: 6, answerScore: 5 },
      { questionNumber: 7, answerScore: 5 },
      { questionNumber: 8, answerScore: 5 },
      { questionNumber: 9, answerScore: 5 },
      { questionNumber: 10, answerScore: 5 },
      { questionNumber: 11, answerScore: 5 },
      { questionNumber: 12, answerScore: 5 },
      { questionNumber: 13, answerScore: 5 },
      { questionNumber: 14, answerScore: 5 },
      { questionNumber: 15, answerScore: 5 },
      { questionNumber: 16, answerScore: 5 },
    ] as RiskProfilerAnswer[],
  } as RiskProfilerInput,

  moderate: {
    answers: [
      { questionNumber: 1, answerScore: 3 },
      { questionNumber: 2, answerScore: 3 },
      { questionNumber: 3, answerScore: 3 },
      { questionNumber: 4, answerScore: 3 },
      { questionNumber: 5, answerScore: 3 },
      { questionNumber: 6, answerScore: 3 },
      { questionNumber: 7, answerScore: 3 },
      { questionNumber: 8, answerScore: 3 },
      { questionNumber: 9, answerScore: 3 },
      { questionNumber: 10, answerScore: 3 },
      { questionNumber: 11, answerScore: 3 },
      { questionNumber: 12, answerScore: 3 },
      { questionNumber: 13, answerScore: 3 },
      { questionNumber: 14, answerScore: 3 },
      { questionNumber: 15, answerScore: 3 },
      { questionNumber: 16, answerScore: 3 },
    ] as RiskProfilerAnswer[],
  } as RiskProfilerInput,
}

export const authFixtures = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      role: 'investor',
    },
  },
  investorUser: {
    id: 'investor-123',
    email: 'investor@example.com',
    user_metadata: {
      role: 'investor',
    },
  },
  advisorUser: {
    id: 'advisor-123',
    email: 'advisor@example.com',
    user_metadata: {
      role: 'advisor',
    },
  },
}
