// Admin audit-log writer.
//
// Every admin-side mutation that affects another user, a role assignment,
// or a feature flag MUST write one row here. The trail is append-only and
// required by BRD §8.3 + §13.2 (audit trail / dispute resolution / SEBI
// compliance).
//
// Action strings are dot-separated verbs (`user.disable`, `user.role.add`,
// `ai_feature.toggle`). Keep them stable — the admin UI groups + filters by
// these strings, and downstream analytics depends on them.

import { prisma } from '@/lib/db'

export type AdminAuditAction =
  | 'user.disable'
  | 'user.enable'
  | 'user.role.add'
  | 'user.role.remove'
  | 'ai_feature.create'
  | 'ai_feature.toggle'

export interface AdminAuditPayload {
  actorUserId: string
  action: AdminAuditAction
  targetType?: 'user' | 'ai_feature'
  targetId?: string
  /**
   * Free-form JSON. By convention: `{ before, after }` for state transitions,
   * or `{ context: '...' }` for descriptive notes. Not read by app code.
   */
  metadata?: Record<string, unknown>
}

/**
 * Append an entry to the admin audit log. Returns the created row's id so
 * callers can correlate with downstream actions; never throws into the caller
 * (audit failures should not block the action they're auditing).
 */
export async function recordAdminAudit(
  payload: AdminAuditPayload
): Promise<string | null> {
  try {
    const row = await prisma.adminAudit.create({
      data: {
        actorUserId: payload.actorUserId,
        action: payload.action,
        targetType: payload.targetType ?? null,
        targetId: payload.targetId ?? null,
        metadata: (payload.metadata ?? null) as never,
      },
      select: { id: true },
    })
    return row.id
  } catch (error) {
    console.error('admin-audit write failed', { payload, error })
    return null
  }
}
