import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// PATCH/DELETE on a single subscription plan.
//
// DELETE soft-removes by flipping isActive=false. We deliberately don't
// support hard-delete: live subscriptions reference the plan via FK, and a
// hard delete would break the user's billing history. Inactive plans simply
// stop appearing in the customer-facing pricing page (PaywallGate filters
// on isActive).

const PERIOD_VALUES = ['monthly', 'yearly'] as const
const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  priceInrPaise: z.number().int().min(0).optional(),
  billingPeriod: z.enum(PERIOD_VALUES).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

function serialize(p: {
  id: string
  slug: string
  name: string
  priceInrPaise: bigint
  billingPeriod: string
  features: unknown
  isActive: boolean
  createdAt: Date | null
  updatedAt: Date | null
}) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceInrPaise: Number(p.priceInrPaise),
    billingPeriod: p.billingPeriod,
    features: p.features,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const before = await prisma.subscriptionPlan.findUnique({
    where: { id: params.id },
  })
  if (!before) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.priceInrPaise !== undefined)
    data.priceInrPaise = BigInt(parsed.data.priceInrPaise)
  if (parsed.data.billingPeriod !== undefined) data.billingPeriod = parsed.data.billingPeriod
  if (parsed.data.features !== undefined) data.features = parsed.data.features
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: true, data: serialize(before), noChange: true })
  }

  const updated = await prisma.subscriptionPlan.update({
    where: { id: params.id },
    data,
  })

  // Build a JSON-safe diff for the audit trail (BigInts elided).
  const changes: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) changes.name = parsed.data.name
  if (parsed.data.priceInrPaise !== undefined)
    changes.priceInrPaise = parsed.data.priceInrPaise
  if (parsed.data.billingPeriod !== undefined)
    changes.billingPeriod = parsed.data.billingPeriod
  if (parsed.data.features !== undefined) changes.features = parsed.data.features
  if (parsed.data.isActive !== undefined) changes.isActive = parsed.data.isActive

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'plan.update',
    targetType: 'plan',
    targetId: updated.id,
    metadata: { slug: before.slug, changes },
  })

  return NextResponse.json({ success: true, data: serialize(updated) })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const before = await prisma.subscriptionPlan.findUnique({
    where: { id: params.id },
  })
  if (!before) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }
  if (!before.isActive) {
    return NextResponse.json({ success: true, alreadyInactive: true })
  }

  await prisma.subscriptionPlan.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'plan.delete',
    targetType: 'plan',
    targetId: before.id,
    metadata: { slug: before.slug, name: before.name },
  })

  return NextResponse.json({ success: true })
}
