import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const userId = auth.user.id

    const answerId = params.id

    // Get the answer and its question
    const answer = await prisma.forumAnswer.findUnique({
      where: { id: answerId },
      select: { questionId: true },
    })

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    // Check if user is the question author
    const question = await prisma.forumQuestion.findUnique({
      where: { id: answer.questionId },
      select: { authorId: true },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (question.authorId !== userId) {
      return NextResponse.json({ error: 'Only question author can mark best answer' }, { status: 403 })
    }

    // Remove best answer from any other answers for this question, and mark
    // this one. Run as a transaction so the question never has two best answers.
    await prisma.$transaction([
      prisma.forumAnswer.updateMany({
        where: { questionId: answer.questionId },
        data: { isBestAnswer: false },
      }),
      prisma.forumAnswer.update({
        where: { id: answerId },
        data: { isBestAnswer: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Answer marked as best',
    })
  } catch (error) {
    console.error('Mark best answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
