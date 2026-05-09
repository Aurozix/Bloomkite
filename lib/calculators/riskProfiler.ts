import { RiskProfilerInput, RiskProfilerResult } from './types'

// Question maximum scores for score inversion
// We invert scores so that high score = aggressive, low score = conservative
// This makes the category mapping consistent: 0-30 = Conservative, 62+ = Aggressive
const questionMaxScores: Record<number, number> = {
  1: 5, // willingness to take risk
  2: 5, // familiarity with schemes
  3: 0, // have you invested (binary)
  3.1: 5, // investment experience quality (Q3A, conditional)
  4: 5, // response to market downturn
  5: 5, // most aggressive investment
  6: 6, // tolerance for volatility
  7: 5, // investment time horizon
  8: 5, // emergency fund
  9: 5, // inflation risk tolerance
  10: 5, // focus in investment decision
  11: 5, // expected return
  12: 5, // past investment loss experience
  13: 5, // risk acceptance for returns
  14: 5, // income vs growth preference
  15: 5, // borrowing to invest
  16: 5, // comfort with leverage
}

export function calculateRiskProfile(input: RiskProfilerInput): RiskProfilerResult {
  let totalScore = 0

  // Invert and sum scores
  // Inversion formula: adjusted_score = (max_for_question + 1) - raw_score
  // This converts: low raw score (aggressive) → high adjusted score
  //               high raw score (conservative) → low adjusted score
  for (const answer of input.answers) {
    const maxScore = questionMaxScores[answer.questionNumber] || 5
    const rawScore = answer.answerScore
    const invertedScore = (maxScore + 1) - rawScore
    totalScore += invertedScore
  }

  // Map score to risk category
  let riskCategory: 'Conservative' | 'Moderately Conservative' | 'Moderate' | 'Moderately Aggressive' | 'Aggressive'

  if (totalScore <= 30) {
    riskCategory = 'Conservative'
  } else if (totalScore <= 40) {
    riskCategory = 'Moderately Conservative'
  } else if (totalScore <= 51) {
    riskCategory = 'Moderate'
  } else if (totalScore <= 61) {
    riskCategory = 'Moderately Aggressive'
  } else {
    riskCategory = 'Aggressive'
  }

  // Determine portfolio allocation based on risk category
  let equityAllocation = 30
  let debtAllocation = 50
  let cashAllocation = 20

  switch (riskCategory) {
    case 'Conservative':
      equityAllocation = 30
      debtAllocation = 50
      cashAllocation = 20
      break
    case 'Moderately Conservative':
      equityAllocation = 40
      debtAllocation = 45
      cashAllocation = 15
      break
    case 'Moderate':
      equityAllocation = 50
      debtAllocation = 40
      cashAllocation = 10
      break
    case 'Moderately Aggressive':
      equityAllocation = 65
      debtAllocation = 30
      cashAllocation = 5
      break
    case 'Aggressive':
      equityAllocation = 80
      debtAllocation = 15
      cashAllocation = 5
      break
  }

  return {
    totalScore,
    riskCategory,
    equityAllocation,
    debtAllocation,
    cashAllocation,
  }
}
