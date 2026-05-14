import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// BRD §3.1 step 5 — financial accounts. Unlike investor interests (where the
// payload is a set of category ids), this resource has row-level identity:
// the same accountType can appear twice with different institution names
// ("HDFC Bank Savings" + "ICICI Bank Savings"). PUT semantics here are
// full-replace on the array; the route assigns fresh ids server-side.

const accountSchema = z.object({
  accountTypeId: z.string().uuid(),
  institutionName: z.string().trim().max(200).optional().nullable(),
})

const bodySchema = z.object({
  accounts: z.array(accountSchema).max(30),
})

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const rows = await prisma.investorFinancialAccount.findMany({
    where: { userId: user.id },
    include: {
      accountType: { select: { id: true, slug: true, name: true, sortOrder: true } },
    },
    orderBy: [{ accountType: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
  })

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      accountTypeId: r.accountTypeId,
      slug: r.accountType.slug,
      accountTypeName: r.accountType.name,
      institutionName: r.institutionName,
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

  try {
    await prisma.$transaction(async (tx) => {
      await tx.investorFinancialAccount.deleteMany({ where: { userId: user.id } })
      if (parsed.data.accounts.length > 0) {
        await tx.investorFinancialAccount.createMany({
          data: parsed.data.accounts.map((a) => ({
            userId: user.id,
            accountTypeId: a.accountTypeId,
            institutionName: a.institutionName || null,
          })),
        })
      }
    })
  } catch (err) {
    console.error('Investor financial accounts PUT failed:', err)
    return NextResponse.json({ error: 'Failed to save accounts' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
