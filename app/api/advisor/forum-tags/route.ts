import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/advisor/forum-tags
// Advisor's "you were tagged in" feed (BRD §3.4). Until §10 (notifications)
// lands, this endpoint is the surface advisors check to see what investors
// are asking them — fetched + rendered alongside the plan-share inbox at
// /advisor/inbox.
//
// Returns the questions newest-tag-first, with author and answer count so
// the advisor can decide whether to jump in.

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const tags = await prisma.forumQuestionAdvisorTag.findMany({
    where: { advisorId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      question: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              investorProfile: {
                select: { displayName: true, city: true },
              },
            },
          },
        },
      },
    },
  })

  return NextResponse.json({
    success: true,
    tags: tags.map((t) => ({
      questionId: t.questionId,
      taggedAt: t.createdAt,
      title: t.question.title,
      contentPreview: t.question.content.slice(0, 240),
      status: t.question.status,
      answerCount: t.question.answerCount,
      askerName:
        t.question.author.investorProfile?.displayName ||
        t.question.author.name ||
        t.question.author.email,
      askerCity: t.question.author.investorProfile?.city ?? null,
      askedAt: t.question.createdAt,
    })),
  })
}
