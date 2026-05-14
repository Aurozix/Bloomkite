import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// GET  /api/admin/plans   — list every plan (active + inactive) for editing.
// POST /api/admin/plans   — create a new plan.
//
// `features` is an admin-defined JSON blob. The PaywallGate code that reads
// it is permissive — unknown keys are ignored — so admins can experiment
// with feature shapes without breaking older subscribers.

const PERIOD_VALUES = ['monthly', 'yearly'] as const
const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  name: z.string().trim().min(2).max(100),
  priceInrPaise: z.number().int().min(0),
  billingPeriod: z.enum(PERIOD_VALUES).default('monthly'),
  features: z.record(z.string(), z.unknown()).optional().default({}),
  isActive: z.boolean().optional().default(true),
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
    // BigInt is JSON-unfriendly; the price is well within Number range.
    priceInrPaise: Number(p.priceInrPaise),
    billingPeriod: p.billingPeriod,
    features: p.features,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export async function GET(_request: NextRequest) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ isActive: 'desc' }, { priceInrPaise: 'asc' }],
  })

  return NextResponse.json({
    success: true,
    data: plans.map(serialize),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const created = await prisma.subscriptionPlan.create({
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        priceInrPaise: BigInt(parsed.data.priceInrPaise),
        billingPeriod: parsed.data.billingPeriod,
        features: parsed.data.features as never,
        isActive: parsed.data.isActive,
      },
    })

    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'plan.create',
      targetType: 'plan',
      targetId: created.id,
      metadata: {
        slug: created.slug,
        name: created.name,
        priceInrPaise: Number(created.priceInrPaise),
      },
    })

    return NextResponse.json({ success: true, data: serialize(created) })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'A plan with this slug already exists' },
        { status: 409 }
      )
    }
    console.error('admin/plans create failed:', err)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
