// Data-retention purge jobs (BRD §13.3).
//
// Three retention windows defined by the BRD:
//   24 hours — OTP / verification codes
//   90 days  — chat / forum content (closed-question soft-deletes)
//   7 years  — deleted-account residual (handled at delete-time, not here)
//
// These functions are idempotent: each call deletes only the rows past their
// respective window. Safe to invoke from a cron, a worker, or the admin
// /admin/retention page. The admin trigger writes an audit row; cron-style
// invocations should pass `actor: 'system'` and skip auditing.
//
// PROD wiring: there is no scheduler infra in Bloomkite yet. The intended
// path is a daily cron (Vercel Cron / Supabase Edge Function / external
// scheduler) hitting the admin trigger or running the script in
// scripts/purge-retention.ts. For now, /admin/retention is the manual
// fallback and the only consumer.

import { prisma } from '@/lib/db'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/// Email + phone OTP rows older than 24h are unconditionally purged. They're
/// hashes, not plaintext, but there's no operational reason to keep them
/// past expiry — the verification routes invalidate prior rows on each new
/// send anyway.
export async function purgeExpiredOtps(now = new Date()): Promise<{
  emailDeleted: number
  phoneDeleted: number
}> {
  const cutoff = new Date(now.getTime() - 24 * HOUR_MS)
  const [email, phone] = await Promise.all([
    prisma.emailVerificationOtp.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { createdAt: { lt: cutoff } }] },
    }),
    prisma.phoneVerificationOtp.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { createdAt: { lt: cutoff } }] },
    }),
  ])
  return { emailDeleted: email.count, phoneDeleted: phone.count }
}

/// Forum activity past 90 days that is administratively closed (status=
/// 'closed' — set by the moderation lock). Deletes the question, which
/// cascades to its answers + tags. Open questions are NEVER auto-purged
/// regardless of age — they're considered live community knowledge.
export async function purgeClosedForumPast90d(now = new Date()): Promise<{
  questionsDeleted: number
}> {
  const cutoff = new Date(now.getTime() - 90 * DAY_MS)
  const result = await prisma.forumQuestion.deleteMany({
    where: { status: 'closed', updatedAt: { lt: cutoff } },
  })
  return { questionsDeleted: result.count }
}

/// Hard-purge users whose deletion was COMPLETED more than 7 years ago.
/// In practice the COMPLETED flow already deleted the user row immediately
/// (see /api/admin/data-deletion/[id] complete branch); the request row
/// cascades with the user. So today this function is a no-op safety net —
/// but the audit-log entries (admin_audit) ARE retained, and once we add
/// the future "soft-delete then hard-purge later" two-stage flow, this is
/// where the second stage will run.
export async function purgeDeletedAccountsPast7y(now = new Date()): Promise<{
  auditEntriesPurged: number
}> {
  // 7 years = 7 * 365.25 days, rounded down to whole days.
  const cutoff = new Date(now.getTime() - Math.floor(7 * 365.25 * DAY_MS))
  // Future-proof: when soft-delete lands, query users with disabledAt < cutoff
  // and a completed deletion request, then hard-delete. For now, prune
  // ai_feature.create / .toggle audit rows that name now-removed flags? No —
  // audit log is append-only by policy.
  // Conservative no-op return.
  void cutoff
  return { auditEntriesPurged: 0 }
}

export type PurgeJobName =
  | 'purge-otps'
  | 'purge-closed-forum'
  | 'purge-deleted-accounts'

export async function runPurgeJob(name: PurgeJobName): Promise<unknown> {
  switch (name) {
    case 'purge-otps':
      return await purgeExpiredOtps()
    case 'purge-closed-forum':
      return await purgeClosedForumPast90d()
    case 'purge-deleted-accounts':
      return await purgeDeletedAccountsPast7y()
  }
}
