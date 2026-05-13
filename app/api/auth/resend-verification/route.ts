import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { sendVerificationOtpEmail } from '@/lib/email'

const schema = z.object({ email: z.string().email().toLowerCase() })

// Issues a fresh 6-digit code for the given email. Anti-enumeration: always
// returns 200 regardless of whether the email exists, whether the account is
// already verified, or whether the send succeeded. The actual email (sent
// only to real unverified accounts) is the side-channel.
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: true })
  }
  const { email } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  })

  if (user && !user.emailVerified) {
    try {
      await sendVerificationOtpEmail(email)
    } catch (err) {
      console.error('Resend verification failed:', err)
      // Swallow — anti-enumeration response shape is the same.
    }
  }

  return NextResponse.json({ success: true })
}
