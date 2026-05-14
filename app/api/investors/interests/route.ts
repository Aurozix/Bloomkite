import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// BRD §3.1 step 4 — investment interests. Full-replace PUT semantics: send
// the canonical list of category ids the investor wants to express interest
// in; we replace the whole set in one transaction.

const bodySchema = z.object({
  categoryIds: z.array(z.string().uuid()).max(50),
})

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const rows = await prisma.investorInvestmentInterest.findMany({
    where: { userId: user.id },
    include: {
      category: { select: { id: true, slug: true, name: true, sortOrder: true } },
    },
    orderBy: { category: { sortOrder: 'asc' } },
  })

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      categoryId: r.categoryId,
      slug: r.category.slug,
      name: r.category.name,
    })),
  })
}

export async function PUT(request: NextRequest) {
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

  const { categoryIds } = parsed.data
  const deduped = Array.from(new Set(categoryIds))

  try {
    await prisma.$transaction(async (tx) => {
      await tx.investorInvestmentInterest.deleteMany({ where: { userId: user.id } })
      if (deduped.length > 0) {
        await tx.investorInvestmentInterest.createMany({
          data: deduped.map((categoryId) => ({ userId: user.id, categoryId })),
        })
      }
    })
  } catch (err) {
    console.error('Investor interests PUT failed:', err)
    return NextResponse.json({ error: 'Failed to save interests' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
