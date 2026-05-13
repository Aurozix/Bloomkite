import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { consumeEmailOtp, findActiveEmailOtp, OTP_MAX_ATTEMPTS } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Transitional handler: anyone clicking a pre-OTP-rollout link gets sent to
// the new code-entry page with a helpful explainer rather than a dead URL.
// Remove this after the migration grace window (1-2 weeks).
export function GET(_request: NextRequest) {
  return NextResponse.redirect(
    new URL('/auth/verify-email?error=link_no_longer_supported', APP_URL),
  )
}

const schema = z.object({
  email: z.string().email().toLowerCase(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email and 6-digit code required' }, { status: 400 })
  }
  const { email, code } = parsed.data

  // Pre-check: if there's no active OTP at all, distinguish that from a
  // wrong code so the UI can hint "request a new code" rather than nag.
  const active = await findActiveEmailOtp(email)
  if (!active) {
    return NextResponse.json(
      { error: 'Code expired or used. Request a new one.', code: 'no_active_otp' },
      { status: 400 },
    )
  }

  const ok = await consumeEmailOtp(email, code)
  if (!ok) {
    // Re-read to surface a useful attempts-remaining hint without a second
    // round-trip. The DB write inside consume already incremented attempts.
    const after = await findActiveEmailOtp(email)
    const remaining = after ? Math.max(0, OTP_MAX_ATTEMPTS - after.attempts) : 0
    return NextResponse.json(
      {
        error: 'Incorrect code',
        code: 'wrong_code',
        attemptsRemaining: remaining,
      },
      { status: 400 },
    )
  }

  // Code valid — mark the user verified. If the user row was deleted between
  // signup and verify, bail without error to avoid leaking enumeration data.
  try {
    await prisma.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    })
  } catch (err) {
    console.error('Verify email update failed:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
