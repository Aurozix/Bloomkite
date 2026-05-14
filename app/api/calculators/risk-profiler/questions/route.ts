import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/calculators/risk-profiler/questions
// Returns the active risk-profile questionnaire as a flat list of questions
// with nested answer options. Auth-required (matches the calculator page's
// access control). Conditional questions carry the `conditionalOnQuestion`
// reference + the answer-score that triggers them so the UI can branch
// without making a second round-trip.

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const questions = await prisma.riskProfileQuestion.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { questionNumber: 'asc' }],
    include: {
      answers: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      conditionalOnQuestion: { select: { questionNumber: true } },
    },
  })

  return NextResponse.json({
    success: true,
    questions: questions.map((q) => ({
      id: q.id,
      slug: q.slug,
      // Stringify the Decimal so the UI doesn't have to think about it; client
      // parses with Number() since the precision is well within JS-safe range.
      questionNumber: Number(q.questionNumber),
      text: q.text,
      maxScoreForInversion: q.maxScoreForInversion,
      conditional: q.conditionalOnQuestion
        ? {
            onQuestionNumber: Number(q.conditionalOnQuestion.questionNumber),
            onAnswerScore: q.conditionalOnAnswerScore,
          }
        : null,
      options: q.answers.map((a) => ({ score: a.score, label: a.text })),
    })),
  })
}
