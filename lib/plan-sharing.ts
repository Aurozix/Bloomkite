// Plan-sharing constants and helpers (BRD §3.3, §5.3, §8.1, §8.5).
//
// Centralised so the cap, permission set, and status set can't drift between
// the four routes that touch them.

/// BRD §8.1 — investor can share a plan with at most 5 advisors at a time.
/// REVOKED shares don't count toward the cap (revoking frees a slot).
export const MAX_ADVISORS_PER_PLAN = 5

export type PlanSharePermission = 'VIEW' | 'COMMENT'
export type PlanShareStatus = 'NEW' | 'VIEWED' | 'REVIEWED' | 'REVOKED'

export const ACTIVE_SHARE_STATUSES: PlanShareStatus[] = ['NEW', 'VIEWED', 'REVIEWED']

export function isPermission(v: unknown): v is PlanSharePermission {
  return v === 'VIEW' || v === 'COMMENT'
}
