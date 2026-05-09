export const dbFixtures = {
  users: [
    {
      id: 'user-123',
      email: 'investor1@test.com',
      password_hash: 'hashed_pwd_1',
      user_metadata: JSON.stringify({ role: 'investor' }),
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'investor-456',
      email: 'investor2@test.com',
      password_hash: 'hashed_pwd_2',
      user_metadata: JSON.stringify({ role: 'investor' }),
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'advisor-789',
      email: 'advisor@test.com',
      password_hash: 'hashed_pwd_3',
      user_metadata: JSON.stringify({ role: 'advisor' }),
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],

  financialPlans: [
    {
      id: 'plan-1',
      user_id: 'user-123',
      calculator_type: 'goal-planner',
      name: 'Home Purchase Goal',
      inputs: JSON.stringify({
        goalAmount: 5000000,
        currentSavings: 500000,
        tenureYears: 10,
        inflationRate: 5,
        growthRate: 8,
        investmentRate: 12,
      }),
      results: JSON.stringify({
        futureValue: '7500000.00',
        requiredMonthlyInvestment: '25000.00',
        totalInvestmentNeeded: '3000000.00',
        gap: '2500000.00',
        monthlyInvestmentAfterInflation: '32000.00',
      }),
      is_draft: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'plan-draft-1',
      user_id: 'user-123',
      calculator_type: 'risk-profiler',
      name: null,
      inputs: JSON.stringify({
        answers: Array(16).fill(null).map((_, i) => ({
          questionNumber: i + 1,
          answerScore: 3,
        })),
      }),
      results: JSON.stringify({
        totalScore: 48,
        riskCategory: 'Moderate',
        equityAllocation: 60,
        debtAllocation: 30,
        cashAllocation: 10,
      }),
      is_draft: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-' + Math.random().toString(36).substr(2, 9),
  email: `test-${Date.now()}@test.com`,
  password_hash: 'test_hash',
  user_metadata: JSON.stringify({ role: 'investor' }),
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createTestFinancialPlan = (userId: string, overrides = {}) => ({
  id: 'plan-' + Math.random().toString(36).substr(2, 9),
  user_id: userId,
  calculator_type: 'goal-planner',
  name: 'Test Plan',
  inputs: JSON.stringify({}),
  results: JSON.stringify({}),
  is_draft: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})
