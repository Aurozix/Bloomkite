// Seed for the DB-driven risk-profile questionnaire (BRD §6.3 / Calculators §6).
//
// Mirrors the previously hard-coded set in app/calculators/risk-profiler/page.tsx.
// Run once on a fresh DB; subsequent runs are idempotent (upsert by slug,
// answers re-created in lockstep with each upsert so wording edits propagate).
//
// Run with:
//   npx dotenv -e .env.local -- ts-node database/seed-risk-profile.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AnswerSeed {
  text: string
  score: number
}

interface QuestionSeed {
  slug: string
  questionNumber: number
  text: string
  /// Per-question max for the score-inversion algorithm. Most are 5; Q3 is
  /// 0 (binary, neither answer scores), Q6 is 6.
  maxScoreForInversion: number
  conditionalOnSlug?: string
  conditionalOnAnswerScore?: number
  answers: AnswerSeed[]
}

const QUESTIONS: QuestionSeed[] = [
  {
    slug: 'q1-willingness-to-take-risk',
    questionNumber: 1,
    text: 'In comparison to your peer groups, how would you rate your willingness to take risk while making financial decisions?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'I enjoy taking very high risk as the same rewards high return' },
      { score: 2, text: 'I am comfortable taking high risk as I want to make more returns' },
      { score: 3, text: 'I am ok with moderate risk my objective is to beat inflation' },
      { score: 4, text: 'I generally take low risk options to understand new financial scheme' },
      { score: 5, text: 'I donot take risk at all better to be safe and secured' },
    ],
  },
  {
    slug: 'q2-familiarity-with-schemes',
    questionNumber: 2,
    text: 'How familiar are you with investment schemes and financial markets in India?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'I have experience with multiple schemes like Fixed deposits, Insurance, Mutual funds, Stocks' },
      { score: 2, text: 'I understand that different schemes give different income, growth and taxation' },
      { score: 4, text: 'I have some experience to understand some aspects of investment schemes/markets' },
      { score: 5, text: 'I have very little understanding of investment markets and have not invested till date' },
    ],
  },
  {
    slug: 'q3-have-you-invested',
    questionNumber: 3,
    text: 'Have you ever invested before in stock markets, mutual funds and unit linked insurance?',
    maxScoreForInversion: 0,
    answers: [
      { score: 0, text: 'Yes' },
      { score: 0, text: 'No' },
    ],
  },
  {
    slug: 'q3a-investment-experience-quality',
    questionNumber: 3.1,
    text: 'How would you describe your experience with such investment schemes?',
    maxScoreForInversion: 5,
    conditionalOnSlug: 'q3-have-you-invested',
    conditionalOnAnswerScore: 0,
    answers: [
      { score: 1, text: 'I have positive experiences and never get misguided in my investment decision' },
      { score: 3, text: 'I am not familiar with investment hence I am more cautious to avoid mistakes' },
      { score: 5, text: 'I have previously lost money as an investor and am very cautious about investing' },
    ],
  },
  {
    slug: 'q4-market-downturn-response',
    questionNumber: 4,
    text: 'Assuming that you are investing in stocks or mutual funds now: six months later you found that your investment value is decreased in value by 20%. What would be your reaction?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Considering this as an opportunity I would make additional investments for future growth' },
      { score: 2, text: 'I would make additional investments to the extent of loss, expecting future growth' },
      { score: 3, text: 'I would leave the investment as it is and wait to see if the investment improves' },
      { score: 5, text: 'I would withdraw all my investments at current loss and transfer into secured schemes' },
    ],
  },
  {
    slug: 'q5-most-aggressive-investment',
    questionNumber: 5,
    text: 'What is the most aggressive investment you have made?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Direct shares' },
      { score: 2, text: 'Mutual funds' },
      { score: 3, text: 'Investment in real estate / Gold / Insurance' },
      { score: 4, text: 'Own home for staying purpose' },
      { score: 5, text: 'Bank savings account or Recurring deposits' },
    ],
  },
  {
    slug: 'q6-tolerance-for-volatility',
    questionNumber: 6,
    text: 'Most investments can fluctuate both up and down (i.e. volatility). How much could your investment fall in value over a 12 month period before you feel concerned and anxious?',
    maxScoreForInversion: 6,
    answers: [
      { score: 1, text: 'More than 50%' },
      { score: 2, text: 'Up to 50%' },
      { score: 3, text: 'Up to 25%' },
      { score: 4, text: 'Up to 10%' },
      { score: 5, text: 'Up to 5%' },
      { score: 6, text: 'Any fall in the value of my investments would make me feel concerned and anxious' },
    ],
  },
  {
    slug: 'q7-investment-horizon',
    questionNumber: 7,
    text: 'Once investments have been placed, how long would it be before you would need to access your capital?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Longer than 7 years' },
      { score: 2, text: 'Between 5 and 7 years' },
      { score: 3, text: 'Between 3 and 5 years' },
      { score: 4, text: 'Between 2 and 3 years' },
      { score: 5, text: 'Less than 2 years (parking)' },
    ],
  },
  {
    slug: 'q8-emergency-fund',
    questionNumber: 8,
    text: 'How much money have you set aside (outside of your superannuation) to handle emergencies?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Less than 1 month of living expenses' },
      { score: 3, text: 'Between 3 and 6 months of living expenses' },
      { score: 5, text: 'More than 6 months of living expenses' },
    ],
  },
  {
    slug: 'q9-inflation-risk-tolerance',
    questionNumber: 9,
    text: 'Inflation is a rise in the general level of prices of goods over time, which can reduce your spending power. How much risk are you prepared to take to counteract the effects of inflation?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'I am comfortable with short to medium term losses in order to beat inflation over the longer term' },
      { score: 3, text: 'I am conscious of the effects of inflation, but would prefer a position that limits short to medium-term losses' },
      { score: 5, text: 'Inflation may erode my savings over the long-term, but I have little tolerance for short to medium term losses' },
    ],
  },
  {
    slug: 'q10-focus-in-decision',
    questionNumber: 10,
    text: 'Would you be more concerned about the potential gains or possible losses when you are considering your investment options?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Potential gains' },
      { score: 3, text: 'Equally interested in the possible losses and potential gains' },
      { score: 5, text: 'Possible losses' },
    ],
  },
  {
    slug: 'q11-expected-return',
    questionNumber: 11,
    text: 'Over the longer term, what return do you reasonably expect to achieve from your investment portfolio?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: '8% or above per annum' },
      { score: 2, text: '6-8% per annum' },
      { score: 3, text: '4-6% per annum' },
      { score: 4, text: '2-4% per annum' },
      { score: 5, text: '0-2% per annum' },
    ],
  },
  {
    slug: 'q12-past-loss-experience',
    questionNumber: 12,
    text: 'Have you had an investment fall in value? If so, how did it make you feel?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Unconcerned but anticipating future investment opportunities' },
      { score: 2, text: 'Unconcerned but not making any further investments' },
      { score: 3, text: 'Concerned' },
      { score: 4, text: 'Very concerned and asking friends and family about what I should do' },
      { score: 5, text: 'I have never experienced an investment fall in value and would not want to' },
    ],
  },
  {
    slug: 'q13-risk-acceptance',
    questionNumber: 13,
    text: 'What degree of risk are you prepared to take to achieve your desired return?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'I want to maximise potential returns regardless of risk' },
      { score: 2, text: 'A high degree of risk would be acceptable for a large increase in potential returns' },
      { score: 3, text: 'A moderate degree of risk would be acceptable for a medium increase in potential returns' },
      { score: 4, text: 'A limited degree of risk would be acceptable for a slight increase in potential returns' },
      { score: 5, text: 'Security of capital is required regardless of potential returns' },
    ],
  },
  {
    slug: 'q14-income-vs-growth',
    questionNumber: 14,
    text: 'What are your future income requirements from your investments?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'I require no amount of investment income as the focus should only be on capital growth' },
      { score: 2, text: 'I require a small amount of investment income as I am mainly concerned with capital growth' },
      { score: 3, text: 'I require an equal combination of investment income and capital growth' },
      { score: 4, text: 'I require a large amount of investment income with only some capital growth' },
      { score: 5, text: 'I require all of my investments to have a focus on income as capital growth is not required' },
    ],
  },
  {
    slug: 'q15-borrowing-to-invest',
    questionNumber: 15,
    text: 'Have you ever borrowed money to make an investment?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'I have borrowed money to invest in managed funds or direct shares or structured products' },
      { score: 3, text: 'I have only borrowed money to invest in an investment or rental property' },
      { score: 5, text: 'I have never borrowed money to invest outside my own home' },
    ],
  },
  {
    slug: 'q16-comfort-with-leverage',
    questionNumber: 16,
    text: 'Based on your answer to the previous question, how did borrowing to invest make you feel?',
    maxScoreForInversion: 5,
    answers: [
      { score: 1, text: 'Very confident' },
      { score: 2, text: 'Confident' },
      { score: 3, text: 'Concerned' },
      { score: 4, text: 'Very concerned' },
      { score: 5, text: 'I have never borrowed money outside my own home' },
    ],
  },
]

async function main() {
  let createdQ = 0
  let updatedQ = 0
  // Two passes: first all questions (so conditional FKs can resolve in pass 2);
  // then a second pass to set conditionalOnQuestionId now that all rows exist.
  for (const q of QUESTIONS) {
    const existing = await prisma.riskProfileQuestion.findUnique({
      where: { slug: q.slug },
    })
    const data = {
      questionNumber: q.questionNumber,
      text: q.text,
      maxScoreForInversion: q.maxScoreForInversion,
      sortOrder: Math.round(q.questionNumber * 10),
      isActive: true,
    }
    let row
    if (existing) {
      row = await prisma.riskProfileQuestion.update({
        where: { slug: q.slug },
        data,
      })
      updatedQ++
    } else {
      row = await prisma.riskProfileQuestion.create({
        data: { slug: q.slug, ...data },
      })
      createdQ++
    }

    // Re-create answers in lockstep so wording edits propagate.
    await prisma.riskProfileAnswer.deleteMany({ where: { questionId: row.id } })
    for (let i = 0; i < q.answers.length; i++) {
      await prisma.riskProfileAnswer.create({
        data: {
          questionId: row.id,
          text: q.answers[i].text,
          score: q.answers[i].score,
          sortOrder: (i + 1) * 10,
        },
      })
    }
  }

  // Pass 2: hook up conditional FKs.
  for (const q of QUESTIONS) {
    if (!q.conditionalOnSlug) continue
    const target = await prisma.riskProfileQuestion.findUnique({
      where: { slug: q.conditionalOnSlug },
      select: { id: true },
    })
    if (!target) {
      console.warn(`  ⚠ ${q.slug} references missing ${q.conditionalOnSlug}`)
      continue
    }
    await prisma.riskProfileQuestion.update({
      where: { slug: q.slug },
      data: {
        conditionalOnQuestionId: target.id,
        conditionalOnAnswerScore: q.conditionalOnAnswerScore ?? null,
      },
    })
  }

  console.log(`  ✓ risk_profile_questions: ${createdQ} created, ${updatedQ} updated, ${QUESTIONS.length} answered-sets recreated`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Risk profile seed complete.')
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
