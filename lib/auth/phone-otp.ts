// Phone OTP helpers. Mirrors the email-OTP discipline:
//   - 6-digit code, SHA-256 hashed at rest
//   - 10-min TTL
//   - 5-attempt cap before the row is dead
//   - each new send for a user invalidates prior outstanding codes

import crypto from 'crypto'

import { prisma } from '@/lib/db'
import { getSmsProvider } from '@/lib/sms/provider'

const OTP_TTL_MS = 10 * 60 * 1000
export const PHONE_OTP_MAX_ATTEMPTS = 5

function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

// Lightweight E.164 normaliser. Accepts +91XXXXXXXXXX or 0091XXXXXXXXXX or
// 10-digit Indian numbers (prepending +91). Rejects anything else.
export function normalisePhone(input: string): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.replace(/[\s\-()]/g, '')
  if (/^\+\d{8,15}$/.test(trimmed)) return trimmed
  if (/^00\d{8,15}$/.test(trimmed)) return '+' + trimmed.slice(2)
  // 10-digit Indian mobile (starts 6-9). BRD audience is India-first per
  // Business_Requirements.md §1; everyone else types the country code.
  if (/^[6-9]\d{9}$/.test(trimmed)) return '+91' + trimmed
  return null
}

export interface SendPhoneOtpResult {
  sent: boolean
  // In dev (stub provider), surfaces the code so a developer can finish the
  // signup flow without a real SMS round-trip. Always undefined in prod.
  debugCode?: string
}

/**
 * Generate a 6-digit code, store the hash against this user + phone, and ask
 * the SMS provider to deliver it. Wipes any prior outstanding codes for the
 * user so only one is ever valid.
 */
export async function sendPhoneOtp(
  userId: string,
  phoneNumber: string,
): Promise<SendPhoneOtpResult> {
  const code = generateOtpCode()
  const codeHash = sha256(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await prisma.$transaction([
    prisma.phoneVerificationOtp.deleteMany({ where: { userId } }),
    prisma.phoneVerificationOtp.create({
      data: { userId, phoneNumber, codeHash, expiresAt },
    }),
  ])

  const result = await getSmsProvider().send({
    to: phoneNumber,
    body: `Your Bloomkite verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
  })

  return {
    sent: result.delivered,
    // Only expose the raw code in dev. The stub provider populates debugBody
    // from the message we just sent; we extract the digits as a convenience.
    debugCode:
      process.env.NODE_ENV !== 'production' && result.debugBody
        ? code
        : undefined,
  }
}

/**
 * Verify a code against the stored hash for the given user. On success:
 * deletes the row and returns { ok: true, phoneNumber } so the caller can
 * write the verified phone onto User. On failure: increments attempts.
 */
export async function verifyPhoneOtp(
  userId: string,
  code: string,
): Promise<
  | { ok: true; phoneNumber: string }
  | { ok: false; reason: 'no_active_otp' | 'wrong_code'; attemptsRemaining: number }
> {
  const row = await prisma.phoneVerificationOtp.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (!row || row.expiresAt < new Date() || row.attempts >= PHONE_OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: 'no_active_otp', attemptsRemaining: 0 }
  }

  if (row.codeHash !== sha256(code)) {
    const updated = await prisma.phoneVerificationOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    })
    return {
      ok: false,
      reason: 'wrong_code',
      attemptsRemaining: Math.max(0, PHONE_OTP_MAX_ATTEMPTS - updated.attempts),
    }
  }

  await prisma.phoneVerificationOtp.delete({ where: { id: row.id } })
  return { ok: true, phoneNumber: row.phoneNumber }
}
