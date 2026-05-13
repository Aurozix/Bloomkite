import crypto from 'crypto'
import { Resend } from 'resend'
import { render } from '@react-email/components'

import { prisma } from '@/lib/db'
import { VerifyEmailOtp } from '@/emails/verify-email-otp'
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

// 6-digit numeric OTP. crypto.randomInt is cryptographically random and
// avoids modulo bias that a naive `% 1000000` on getRandomValues would have.
function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes — short window for code entry.
export const OTP_MAX_ATTEMPTS = 5

/**
 * Generate a 6-digit code, store its SHA-256 hash, and email the raw code to
 * the user. Replaces the link-based flow per BRD §3.1. Each call deletes any
 * prior unverified OTP rows for the same email — we never have two
 * outstanding codes for one address.
 */
export async function sendVerificationOtpEmail(email: string): Promise<void> {
  const code = generateOtpCode()
  const codeHash = sha256(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  // Wipe any prior outstanding codes for this email before inserting the new
  // one. Keeps the table clean and guarantees only one valid code at a time.
  await prisma.$transaction([
    prisma.emailVerificationOtp.deleteMany({ where: { email } }),
    prisma.emailVerificationOtp.create({ data: { email, codeHash, expiresAt } }),
  ])

  const html = await render(VerifyEmailOtp({ code }))
  await deliver(email, 'Your Bloomkite verification code', html)
}

/**
 * Look up the active OTP row for `email`. Returns null if no row exists, if
 * the row is expired, or if it's been exhausted (attempts >= MAX). Does not
 * delete the row — callers consume on success / increment attempts on failure.
 */
export async function findActiveEmailOtp(email: string) {
  const row = await prisma.emailVerificationOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return null
  if (row.expiresAt < new Date()) return null
  if (row.attempts >= OTP_MAX_ATTEMPTS) return null
  return row
}

/**
 * Verify a code against the stored hash for `email`. On match: deletes the
 * row (single-use), returns true. On mismatch: increments the attempts
 * counter (caller must check < MAX before calling), returns false.
 */
export async function consumeEmailOtp(email: string, code: string): Promise<boolean> {
  const row = await findActiveEmailOtp(email)
  if (!row) return false

  if (row.codeHash !== sha256(code)) {
    await prisma.emailVerificationOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    })
    return false
  }

  await prisma.emailVerificationOtp.delete({ where: { id: row.id } })
  return true
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
