import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

function serializeAnswer(a: any) {
  const { author, ...rest } = a
  return {
    id: rest.id,
    content: rest.content,
    votes_count: rest.votesCount,
    is_best_answer: rest.isBestAnswer,
    created_at: rest.createdAt,
    author: author
      ? { id: author.id, email: author.email, full_name: author.name }
      : null,
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const questionId = params.id
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Create answer
    let answer
    try {
      answer = await prisma.forumAnswer.create({
        data: {
          authorId: user.id,
          questionId,
          content,
          votesCount: 0,
          isBestAnswer: false,
        },
        include: {
          author: { select: { id: true, email: true, name: true } },
        },
      })
    } catch (error) {
      console.error('Insert answer error:', error)
      return NextResponse.json({ error: 'Failed to create answer' }, { status: 500 })
    }

    // Bump answer_count on the question.
    try {
      await prisma.forumQuestion.update({
        where: { id: questionId },
        data: { answerCount: { increment: 1 } },
      })
    } catch (countErr) {
      console.error('Failed to bump answer_count:', countErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Answer created',
      data: serializeAnswer(answer),
    })
  } catch (error) {
    console.error('Create answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
