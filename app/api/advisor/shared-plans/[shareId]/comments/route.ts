import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// POST /api/advisor/shared-plans/:shareId/comments
// Advisor posts a comment / recommendation on a shared plan. Requires the
// share to (a) belong to this advisor, (b) be active (not revoked), (c) carry
// COMMENT permission (VIEW-only shares accept reads but reject comments).
// First successful comment promotes the share to status=REVIEWED.

const bodySchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(10000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { shareId: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const share = await prisma.planShare.findUnique({
    where: { id: params.shareId },
    select: {
      id: true,
      advisorId: true,
      permission: true,
      status: true,
      reviewedAt: true,
    },
  })

  if (!share || share.advisorId !== user.id) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (share.status === 'REVOKED') {
    return NextResponse.json(
      { error: 'Cannot comment on a revoked share' },
      { status: 410 },
    )
  }
  if (share.permission !== 'COMMENT') {
    return NextResponse.json(
      { error: 'You only have view-only access to this plan' },
      { status: 403 },
    )
  }

  const now = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.planComment.create({
      data: {
        shareId: share.id,
        authorId: user.id,
        body: parsed.data.body,
      },
    })

    // Promote NEW/VIEWED → REVIEWED on first comment. Don't keep flipping
    // reviewedAt back on subsequent comments — first-comment timestamp is the
    // useful "did the advisor get back" signal for the investor's inbox.
    if (share.status !== 'REVIEWED') {
      await tx.planShare.update({
        where: { id: share.id },
        data: {
          status: 'REVIEWED',
          reviewedAt: share.reviewedAt ?? now,
        },
      })
    }

    return created
  })

  return NextResponse.json({
    success: true,
    comment: {
      id: result.id,
      body: result.body,
      createdAt: result.createdAt,
    },
  })
}
