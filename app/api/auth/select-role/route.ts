import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

const schema = z.object({
  role: z.enum(['investor', 'advisor']),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if ('error' in authResult) return authResult.error
  const { user } = authResult

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Role must be investor or advisor' }, { status: 400 })
  }
  const { role } = parsed.data

  try {
    const roleRow = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRow) {
      return NextResponse.json({ error: 'Role not found' }, { status: 500 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
        create: { userId: user.id, roleId: roleRow.id },
        update: {},
      })

      if (role === 'investor') {
        await tx.investorProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, displayName: '' },
          update: {},
        })
      } else {
        await tx.advisorProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, displayName: '', workflowStatus: 'pending' },
          update: {},
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Select role error:', error)
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
  }
}
