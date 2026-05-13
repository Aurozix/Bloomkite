import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { isAtLeast18, parseISODate } from '@/lib/auth/age'

// At profile-activation time, DOB is REQUIRED — BRD §8.1 forbids creating
// usable profiles for under-18s. If the user supplied DOB at signup we use
// that (the client doesn't need to re-send it); otherwise the client must
// include `dateOfBirth` in this request.
const schema = z.object({
  role: z.enum(['investor', 'advisor']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  const { role, dateOfBirth } = parsed.data

  // Resolve the canonical DOB: prefer the one already on User; fall back to
  // the request payload. We require one or the other; we never proceed
  // without verifying 18+.
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { dateOfBirth: true },
  })

  let dobDate: Date | null = existing?.dateOfBirth ?? null

  if (!dobDate && dateOfBirth) {
    dobDate = parseISODate(dateOfBirth)
    if (!dobDate) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
    }
  }

  if (!dobDate) {
    return NextResponse.json(
      { error: 'Date of birth is required to activate your profile', code: 'dob_required' },
      { status: 400 }
    )
  }

  if (!isAtLeast18(dobDate)) {
    return NextResponse.json(
      { error: 'You must be 18 or older to use Bloomkite' },
      { status: 400 }
    )
  }

  try {
    const roleRow = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRow) {
      return NextResponse.json({ error: 'Role not found' }, { status: 500 })
    }

    await prisma.$transaction(async (tx) => {
      // Backfill DOB onto User if the client supplied a new one; never
      // overwrite an existing DOB (it's identity-level, not editable here).
      if (!existing?.dateOfBirth && dobDate) {
        await tx.user.update({
          where: { id: user.id },
          data: { dateOfBirth: dobDate },
        })
      }

      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
        create: { userId: user.id, roleId: roleRow.id },
        update: {},
      })

      if (role === 'investor') {
        await tx.investorProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, displayName: '', dateOfBirth: dobDate },
          update: { dateOfBirth: dobDate },
        })
      } else {
        await tx.advisorProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            displayName: '',
            workflowStatus: 'pending',
            dateOfBirth: dobDate,
          },
          update: { dateOfBirth: dobDate },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Select role error:', error)
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
  }
}
