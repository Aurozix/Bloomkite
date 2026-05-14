// Advisor discovery & engagement constants (BRD §3.4, §7.1, §8.1).
//
// Centralised so the cap and the rating bounds can't drift between the route
// handlers + UI validators that touch them.

/// Cap on how many advisors a single forum question can tag. Same anti-spam
/// reasoning as the BRD §8.1 plan-share cap (5). Not in BRD explicitly;
/// adjust if BRD §3.4 ever pins a different number.
export const MAX_TAGGED_ADVISORS_PER_QUESTION = 5

/// Star ratings are integers 1..5. Centralised so the route + the UI form
/// agree.
export const RATING_MIN = 1
export const RATING_MAX = 5

export function isValidStars(n: unknown): n is number {
  return (
    typeof n === 'number' &&
    Number.isInteger(n) &&
    n >= RATING_MIN &&
    n <= RATING_MAX
  )
}
