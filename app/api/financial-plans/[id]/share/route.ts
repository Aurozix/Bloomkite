import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { MAX_ADVISORS_PER_PLAN } from '@/lib/plan-sharing'

// POST /api/financial-plans/:id/share
// Investor shares one of their saved FinancialPlans with one or more advisors.
// BRD §8.1 caps the number of *active* (non-revoked) advisor shares at 5.
//
// Re-sharing after revoke: when (planId, advisorId) already has a REVOKED row,
// we flip its status back to NEW and apply the new permission/message rather
// than inserting a duplicate. The unique index makes this a clean upsert.

const bodySchema = z.object({
  advisorIds: z.array(z.string().uuid()).min(1).max(MAX_ADVISORS_PER_PLAN),
  permission: z.enum(['VIEW', 'COMMENT']).default('COMMENT'),
  message: z.string().trim().max(2000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const planId = params.id
  if (!planId) {
    return NextResponse.json({ error: 'Missing plan id' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const plan = await prisma.financialPlan.findUnique({
    where: { id: planId },
    select: { id: true, userId: true, isDraft: true },
  })
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }
  if (plan.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (plan.isDraft) {
    return NextResponse.json(
      { error: 'Cannot share a draft. Save the plan first.' },
      { status: 400 },
    )
  }

  const advisorIds = Array.from(new Set(parsed.data.advisorIds))
  if (advisorIds.includes(user.id)) {
    return NextResponse.json(
      { error: 'Cannot share a plan with yourself' },
      { status: 400 },
    )
  }

  // Validate every advisorId points at an actually-approved AdvisorProfile.
  // Without this, the unique-index error below would be a confusing 500.
  const validAdvisors = await prisma.advisorProfile.findMany({
    where: {
      userId: { in: advisorIds },
      workflowStatus: 'approved',
    },
    select: { userId: true },
  })
  const validAdvisorIds = new Set(validAdvisors.map((a) => a.userId))
  const invalid = advisorIds.filter((id) => !validAdvisorIds.has(id))
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: 'One or more advisors are not approved', invalid },
      { status: 400 },
    )
  }

  // BRD §8.1 cap. Combine the advisors already actively shared (NEW/VIEWED/
  // REVIEWED) with the *new* ones in this request. A re-share of an existing
  // active row doesn't grow the count; flipping a REVOKED row back to active
  // does. We compute the prospective count and reject before any writes.
  const existing = await prisma.planShare.findMany({
    where: { planId },
    select: { advisorId: true, status: true },
  })

  const currentlyActive = new Set(
    existing.filter((s) => s.status !== 'REVOKED').map((s) => s.advisorId),
  )
  const willBeActive = new Set(currentlyActive)
  for (const aid of advisorIds) willBeActive.add(aid)

  if (willBeActive.size > MAX_ADVISORS_PER_PLAN) {
    return NextResponse.json(
      {
        error: `A plan can be actively shared with at most ${MAX_ADVISORS_PER_PLAN} advisors. Revoke an existing share to free a slot.`,
        currentActive: currentlyActive.size,
        cap: MAX_ADVISORS_PER_PLAN,
      },
      { status: 409 },
    )
  }

  const now = new Date()
  const message = parsed.data.message?.trim() || null

  await prisma.$transaction(async (tx) => {
    for (const advisorId of advisorIds) {
      await tx.planShare.upsert({
        where: { planId_advisorId: { planId, advisorId } },
        update: {
          // Re-share: reset workflow back to NEW. Permission/message
          // overwritten with the latest investor intent.
          status: 'NEW',
          permission: parsed.data.permission,
          message,
          revokedAt: null,
          viewedAt: null,
          reviewedAt: null,
          updatedAt: now,
        },
        create: {
          planId,
          advisorId,
          permission: parsed.data.permission,
          message,
        },
      })
    }
  })

  return NextResponse.json({ success: true, shared: advisorIds.length })
}
