// Age gate for BRD §8.1 (Adults Only — 18+).
//
// Two callers:
//   - signup route, where DOB is optional. If provided, must be ≥18.
//   - profile-activation route, where DOB is required and must be ≥18.

export const MINIMUM_AGE_YEARS = 18

/**
 * Returns true if `dob` represents an age of at least `MINIMUM_AGE_YEARS`
 * on the given reference date (defaults to now). Birthday-on-reference-date
 * counts as "of age" (>=, not >).
 */
export function isAtLeast18(dob: Date, now: Date = new Date()): boolean {
  if (!(dob instanceof Date) || Number.isNaN(dob.getTime())) return false

  // Compute age by subtracting years, then adjusting if the birthday hasn't
  // occurred yet this year. Pure local-date arithmetic — no timezone games.
  let age = now.getFullYear() - dob.getFullYear()
  const monthDelta = now.getMonth() - dob.getMonth()
  const dayDelta = now.getDate() - dob.getDate()
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1
  }

  return age >= MINIMUM_AGE_YEARS
}

/**
 * Parse a YYYY-MM-DD string into a Date at local midnight, or return null if
 * the input is not a well-formed date. We accept only ISO-date strings (no
 * datetimes) to match what HTML `<input type="date">` produces.
 */
export function parseISODate(input: unknown): Date | null {
  if (typeof input !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null
  const [y, m, d] = input.split('-').map((n) => parseInt(n, 10))
  // Reject obviously absurd values; allow narrow validation downstream.
  if (y < 1900 || y > 2100) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  const date = new Date(y, m - 1, d)
  // Reject e.g. "2024-02-31" which would silently roll over to March.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null
  }
  return date
}
