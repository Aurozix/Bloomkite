import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const userId = auth.user.id

    const answerId = params.id
    const body = await request.json()
    const { vote_type } = body

    if (!vote_type || !['helpful', 'unhelpful'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    // Upsert vote (one vote per user/answer)
    await prisma.forumAnswerVote.upsert({
      where: { userId_answerId: { userId, answerId } },
      create: { userId, answerId, voteType: vote_type },
      update: { voteType: vote_type },
    })

    // Recalculate votes_count for answer (only count 'helpful' votes)
    const votesCount = await prisma.forumAnswerVote.count({
      where: { answerId, voteType: 'helpful' },
    })

    await prisma.forumAnswer.update({
      where: { id: answerId },
      data: { votesCount },
    })

    return NextResponse.json({
      success: true,
      message: 'Vote recorded',
      votes_count: votesCount,
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const userId = auth.user.id

    const answerId = params.id

    // Delete vote
    await prisma.forumAnswerVote.deleteMany({ where: { userId, answerId } })

    // Recalculate votes_count
    const votesCount = await prisma.forumAnswerVote.count({
      where: { answerId, voteType: 'helpful' },
    })

    await prisma.forumAnswer.update({
      where: { id: answerId },
      data: { votesCount },
    })

    return NextResponse.json({
      success: true,
      message: 'Vote removed',
      votes_count: votesCount,
    })
  } catch (error) {
    console.error('Delete vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
