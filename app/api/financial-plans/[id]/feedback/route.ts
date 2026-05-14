import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/financial-plans/:id/feedback
// Investor's "compare advisor feedback" view (BRD UC-7). Returns all comments
// from every advisor the plan was shared with, grouped per advisor so the UI
// can render side-by-side cards. Revoked shares are still included in the
// response (greyed-out in the UI) — investors who revoked someone may still
// want to see what they had said.

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const plan = await prisma.financialPlan.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      name: true,
      calculatorType: true,
      inputs: true,
      results: true,
    },
  })
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }
  if (plan.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const shares = await prisma.planShare.findMany({
    where: { planId: plan.id },
    orderBy: [{ createdAt: 'asc' }],
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
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })

  return NextResponse.json({
    success: true,
    plan: {
      id: plan.id,
      name: plan.name,
      calculatorType: plan.calculatorType,
      inputs: plan.inputs,
      results: plan.results,
    },
    advisors: shares.map((s) => ({
      shareId: s.id,
      advisorId: s.advisorId,
      advisorName:
        s.advisor.advisorProfile?.displayName ||
        s.advisor.name ||
        s.advisor.email,
      advisorCompany: s.advisor.advisorProfile?.companyName ?? null,
      advisorImage: s.advisor.advisorProfile?.profileImageUrl ?? null,
      permission: s.permission,
      status: s.status,
      sharedAt: s.createdAt,
      viewedAt: s.viewedAt,
      reviewedAt: s.reviewedAt,
      revokedAt: s.revokedAt,
      comments: s.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
      })),
    })),
  })
}
