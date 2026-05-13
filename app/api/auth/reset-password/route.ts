import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { consumePasswordResetToken } from '@/lib/email'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Token and a password of at least 8 characters are required' },
      { status: 400 }
    )
  }

  const { token, password } = parsed.data
  const row = await consumePasswordResetToken(token)
  if (!row) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link' },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
