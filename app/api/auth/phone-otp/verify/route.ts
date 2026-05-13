import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { verifyPhoneOtp } from '@/lib/auth/phone-otp'

const schema = z.object({
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: '6-digit code required' }, { status: 400 })
  }

  const result = await verifyPhoneOtp(user.id, parsed.data.code)
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === 'no_active_otp'
            ? 'Code expired. Request a new one.'
            : 'Incorrect code',
        code: result.reason,
        attemptsRemaining: result.attemptsRemaining,
      },
      { status: 400 },
    )
  }

  // Persist the verified phone on the user row. Don't mirror to profile here
  // — profile activation (POST /api/auth/select-role) copies from User into
  // the role-specific profile in one transaction.
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneNumber: result.phoneNumber,
        phoneVerifiedAt: new Date(),
      },
    })
  } catch (err) {
    console.error('phone-otp verify update failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, phoneNumber: result.phoneNumber })
}
