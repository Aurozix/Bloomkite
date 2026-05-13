import crypto from 'crypto'
import { Resend } from 'resend'
import { render } from '@react-email/components'

import { prisma } from '@/lib/db'
import { VerifyEmail } from '@/emails/verify-email'
import { ResetPassword } from '@/emails/reset-password'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

async function deliver(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set; would have sent to ${to}: ${subject}`)
    return
  }
  const result = await resend.emails.send({ from: FROM, to, subject, html })
  if (result.error) {
    // Log but don't throw — callers use anti-enumeration responses where the
    // client must not be able to tell whether the email landed.
    console.error('[email] Resend send error:', result.error)
  }
}

/**
 * Create a verification token for the given email and send the verification
 * email. The raw token goes in the link; the DB stores the same value (NextAuth
 * VerificationToken convention).
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  const token = generateToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`
  const html = await render(VerifyEmail({ verifyUrl }))
  await deliver(email, 'Verify your Bloomkite email', html)
}

/**
 * Create a password reset token and send the email. The raw token goes in the
 * link; only its SHA-256 hash is stored in the DB so a DB compromise can't
 * leak in-flight tokens.
 */
export async function sendPasswordResetEmail(
  email: string,
  userId: string
): Promise<void> {
  const raw = generateToken()
  const tokenHash = sha256(raw)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(raw)}`
  const html = await render(ResetPassword({ resetUrl }))
  await deliver(email, 'Reset your Bloomkite password', html)
}

/**
 * Look up a password-reset token by its hash. Returns the row if it's not yet
 * used and not expired, else null.
 */
export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = sha256(rawToken)
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!row || row.usedAt || row.expiresAt < new Date()) return null
  return row
}
