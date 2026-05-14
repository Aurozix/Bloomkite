import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { ACTIVE_SHARE_STATUSES } from '@/lib/plan-sharing'

// GET /api/advisor/shared-plans
// Advisor inbox: every plan an investor has shared with me. Revoked shares
// hidden by default. BRD §8.5 — comments belong to a single share row, so
// listing by my advisorId means I can never accidentally see another advisor's
// feedback. The plan and investor info come along for the inbox row.

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const includeRevoked = new URL(request.url).searchParams.get('includeRevoked') === '1'

  const shares = await prisma.planShare.findMany({
    where: {
      advisorId: user.id,
      ...(includeRevoked ? {} : { status: { in: ACTIVE_SHARE_STATUSES } }),
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          calculatorType: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              investorProfile: {
                select: { displayName: true, city: true, riskProfile: true },
              },
            },
          },
        },
      },
      _count: { select: { comments: true } },
    },
  })

  return NextResponse.json({
    success: true,
    shares: shares.map((s) => ({
      id: s.id,
      planId: s.planId,
      planName: s.plan.name,
      calculatorType: s.plan.calculatorType,
      sharedAt: s.createdAt,
      permission: s.permission,
      status: s.status,
      message: s.message,
      viewedAt: s.viewedAt,
      reviewedAt: s.reviewedAt,
      revokedAt: s.revokedAt,
      myCommentCount: s._count.comments,
      investor: {
        id: s.plan.user.id,
        name:
          s.plan.user.investorProfile?.displayName ||
          s.plan.user.name ||
          s.plan.user.email,
        city: s.plan.user.investorProfile?.city ?? null,
        riskProfile: s.plan.user.investorProfile?.riskProfile ?? null,
      },
    })),
  })
}
