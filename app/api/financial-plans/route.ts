import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { ACTIVE_SHARE_STATUSES } from '@/lib/plan-sharing'

// GET /api/financial-plans
// Investor lists their own saved (non-draft) FinancialPlans, with active-share
// counts so the UI can show a "shared with N advisor(s)" badge per row.

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const plans = await prisma.financialPlan.findMany({
    where: { userId: user.id, isDraft: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      calculatorType: true,
      createdAt: true,
      updatedAt: true,
      shares: {
        where: { status: { in: ACTIVE_SHARE_STATUSES } },
        select: { id: true, status: true },
      },
    },
  })

  return NextResponse.json({
    success: true,
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      calculatorType: p.calculatorType,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      activeShareCount: p.shares.length,
      reviewedShareCount: p.shares.filter((s) => s.status === 'REVIEWED').length,
    })),
  })
}
