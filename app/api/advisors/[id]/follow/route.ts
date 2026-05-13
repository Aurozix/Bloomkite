import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const investorId = auth.user.id
    const advisorId = params.id

    // Check if already following
    const existingFollow = await prisma.advisorFollower.findUnique({
      where: {
        investorId_advisorId: { investorId, advisorId },
      },
      select: { id: true },
    })

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this advisor' },
        { status: 400 }
      )
    }

    // Create follow
    let data
    try {
      data = await prisma.advisorFollower.create({
        data: { investorId, advisorId },
      })
    } catch (error) {
      console.error('Error creating follow:', error)
      return NextResponse.json({ error: 'Failed to follow advisor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Now following this advisor',
      data: {
        id: data.id,
        investor_id: data.investorId,
        advisor_id: data.advisorId,
        created_at: data.createdAt,
      },
    })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const investorId = auth.user.id
    const advisorId = params.id

    try {
      await prisma.advisorFollower.deleteMany({
        where: { investorId, advisorId },
      })
    } catch (error) {
      console.error('Error deleting follow:', error)
      return NextResponse.json({ error: 'Failed to unfollow advisor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Unfollowed advisor',
    })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
