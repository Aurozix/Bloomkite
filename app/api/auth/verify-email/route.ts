import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, APP_URL))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return redirectTo('/auth/signin?error=invalid_link')
  }

  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  })

  if (!row || row.expires < new Date()) {
    return redirectTo('/auth/signin?error=invalid_or_expired_link')
  }

  // Atomic verify + delete-token. If the user doesn't exist (e.g., they were
  // deleted between sign-up and verify), bail.
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      }),
    ])
  } catch (err) {
    console.error('Verify email error:', err)
    return redirectTo('/auth/signin?error=verification_failed')
  }

  return redirectTo('/auth/signin?verified=1')
}
