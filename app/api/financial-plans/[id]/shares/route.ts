import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/financial-plans/:id/shares
// Investor lists every share row for one of their plans (active + revoked).
// Used by the "manage shares" panel on the share dialog so the investor can
// see who already has access and revoke as needed.

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const planId = params.id
  const plan = await prisma.financialPlan.findUnique({
    where: { id: planId },
    select: { id: true, userId: true, name: true, calculatorType: true },
  })
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }
  if (plan.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const shares = await prisma.planShare.findMany({
    where: { planId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      advisor: {
        select: {
          id: true,
          name: true,
          email: true,
          advisorProfile: {
            select: {
              displayName: true,
              companyName: true,
              profileImageUrl: true,
            },
          },
        },
      },
      _count: { select: { comments: true } },
    },
  })

  return NextResponse.json({
    success: true,
    plan: { id: plan.id, name: plan.name, calculatorType: plan.calculatorType },
    shares: shares.map((s) => ({
      id: s.id,
      advisorId: s.advisorId,
      advisorName:
        s.advisor.advisorProfile?.displayName ||
        s.advisor.name ||
        s.advisor.email,
      advisorCompany: s.advisor.advisorProfile?.companyName ?? null,
      advisorImage: s.advisor.advisorProfile?.profileImageUrl ?? null,
      permission: s.permission,
      status: s.status,
      message: s.message,
      viewedAt: s.viewedAt,
      reviewedAt: s.reviewedAt,
      revokedAt: s.revokedAt,
      createdAt: s.createdAt,
      commentCount: s._count.comments,
    })),
  })
}
