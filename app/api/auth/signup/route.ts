import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'

const signupSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  name: z.string().trim().max(255).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email and password (min 8 chars) required' },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data
    const existing = await prisma.user.findUnique({ where: { email } })

    // Anti-enumeration: if email is already in use, return generic success.
    // The user gets a "check your email" page either way; the email itself
    // (sent only to new accounts) tells the recipient if they actually have a
    // new account or not.
    if (existing) {
      return NextResponse.json({ success: true })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    })

    await sendVerificationEmail(user.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
