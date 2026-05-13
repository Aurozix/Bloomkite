import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email().toLowerCase(),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Anti-enumeration: always return success regardless of input quality.
    return NextResponse.json({ success: true })
  }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  })

  // Only send if the user exists AND has a password (i.e., is not a
  // Google-only account). Google-only accounts can't reset a password they
  // never set. Either way, we return success to the client.
  if (user?.passwordHash) {
    try {
      await sendPasswordResetEmail(email, user.id)
    } catch (err) {
      console.error('Failed to send password reset email:', err)
    }
  }

  return NextResponse.json({ success: true })
}
