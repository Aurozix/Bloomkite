import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/advisor/shared-plans/:shareId
// Advisor opens one shared plan. Returns the full plan inputs/results plus
// every comment THIS advisor has authored on it. BRD §8.5 — we deliberately
// never include other advisors' shares or comments in the response.
//
// First view side-effect: if status is NEW, flip to VIEWED and set viewedAt.
// Subsequent views are read-only.

export async function GET(
  _request: NextRequest,
  { params }: { params: { shareId: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const share = await prisma.planShare.findUnique({
    where: { id: params.shareId },
    include: {
      plan: {
        select: {
          id: true,
          userId: true,
          name: true,
          calculatorType: true,
          inputs: true,
          results: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              investorProfile: {
                select: {
                  displayName: true,
                  city: true,
                  state: true,
                  riskProfile: true,
                },
              },
            },
          },
        },
      },
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (share.advisorId !== user.id) {
    // Critical access check: the advisor reading the share must be its
    // intended recipient. Anything else returns 404 (not 403) so we don't
    // confirm the share's existence to non-recipients.
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (share.status === 'REVOKED') {
    return NextResponse.json(
      { error: 'This share has been revoked by the investor' },
      { status: 410 },
    )
  }

  if (share.status === 'NEW') {
    await prisma.planShare.update({
      where: { id: share.id },
      data: { status: 'VIEWED', viewedAt: new Date() },
    })
  }

  return NextResponse.json({
    success: true,
    share: {
      id: share.id,
      permission: share.permission,
      status: share.status === 'NEW' ? 'VIEWED' : share.status,
      message: share.message,
      sharedAt: share.createdAt,
    },
    plan: {
      id: share.plan.id,
      name: share.plan.name,
      calculatorType: share.plan.calculatorType,
      inputs: share.plan.inputs,
      results: share.plan.results,
      savedAt: share.plan.createdAt,
    },
    investor: {
      id: share.plan.user.id,
      name:
        share.plan.user.investorProfile?.displayName ||
        share.plan.user.name ||
        share.plan.user.email,
      city: share.plan.user.investorProfile?.city ?? null,
      state: share.plan.user.investorProfile?.state ?? null,
      riskProfile: share.plan.user.investorProfile?.riskProfile ?? null,
    },
    comments: share.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
    })),
  })
}
