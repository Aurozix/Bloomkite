import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

function serializeQuestion(q: any) {
  const { author, ...rest } = q
  return {
    id: rest.id,
    title: rest.title,
    content: rest.content,
    status: rest.status,
    answer_count: rest.answerCount,
    created_at: rest.createdAt,
    updated_at: rest.updatedAt,
    author: author
      ? { id: author.id, email: author.email, full_name: author.name }
      : null,
  }
}

function serializeAnswer(a: any) {
  const { author, ...rest } = a
  return {
    id: rest.id,
    content: rest.content,
    votes_count: rest.votesCount,
    is_best_answer: rest.isBestAnswer,
    created_at: rest.createdAt,
    updated_at: rest.updatedAt,
    author: author
      ? { id: author.id, email: author.email, full_name: author.name }
      : null,
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const questionId = params.id

    // Fetch question
    const question = await prisma.forumQuestion.findUnique({
      where: { id: questionId },
      include: {
        author: { select: { id: true, email: true, name: true } },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Fetch answers ordered by best_answer first, then by votes DESC
    const answers = await prisma.forumAnswer.findMany({
      where: { questionId },
      include: {
        author: { select: { id: true, email: true, name: true } },
      },
      orderBy: [{ isBestAnswer: 'desc' }, { votesCount: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      data: {
        question: serializeQuestion(question),
        answers: answers.map(serializeAnswer),
      },
    })
  } catch (error) {
    console.error('Get question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
