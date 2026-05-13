import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { normalisePhone, sendPhoneOtp } from '@/lib/auth/phone-otp'

const schema = z.object({
  phoneNumber: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'phoneNumber required' }, { status: 400 })
  }

  const normalised = normalisePhone(parsed.data.phoneNumber)
  if (!normalised) {
    return NextResponse.json(
      { error: 'Enter a valid phone number with country code' },
      { status: 400 },
    )
  }

  try {
    const result = await sendPhoneOtp(user.id, normalised)
    if (!result.sent) {
      return NextResponse.json(
        { error: 'Could not send code. Please try again shortly.' },
        { status: 502 },
      )
    }
    return NextResponse.json({
      success: true,
      phoneNumber: normalised,
      // Dev-only convenience for the stub provider: returning the code lets
      // local sign-ups complete without a real SMS gateway. Production code
      // never sees `debugCode` because the stub refuses to send there.
      ...(result.debugCode ? { debugCode: result.debugCode } : {}),
    })
  } catch (err) {
    console.error('phone-otp send failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
