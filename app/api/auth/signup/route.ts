import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { sendVerificationOtpEmail } from '@/lib/email'
import { isAtLeast18, parseISODate } from '@/lib/auth/age'

// dateOfBirth is OPTIONAL at signup (BRD §3.1 / §8.1 — user chose
// optional-at-signup + required-at-activation). When provided, it MUST pass
// the 18+ gate; we don't store an underage DOB and then check later.
const signupSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  name: z.string().trim().max(255).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

    const { email, password, name, dateOfBirth } = parsed.data

    // Validate DOB up front, before any DB write — if it's invalid or
    // underage we reject immediately and the user fixes it before account
    // creation.
    let dobDate: Date | null = null
    if (dateOfBirth) {
      dobDate = parseISODate(dateOfBirth)
      if (!dobDate) {
        return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
      }
      if (!isAtLeast18(dobDate)) {
        return NextResponse.json(
          { error: 'You must be 18 or older to use Bloomkite' },
          { status: 400 }
        )
      }
    }

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
        dateOfBirth: dobDate,
      },
    })

    await sendVerificationOtpEmail(user.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
