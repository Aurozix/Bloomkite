// AI feature flag runtime helper.
//
// Application code calls `await isAIFeatureEnabled('slug')` at the top of any
// branch that depends on an AI feature being on. Default is FALSE for any slug
// not in the table — opt-in, never opt-out (see schema doc comment on
// AIFeature in prisma/schema.prisma).
//
// A short in-memory cache absorbs hot-path traffic so we're not hitting the
// DB on every call. Cache is per-process; on toggle, callers should rely on
// the cache TTL (a few seconds) rather than trying to invalidate explicitly
// across the next/runtime worker pool.

import { prisma } from '@/lib/db'

const CACHE_TTL_MS = 10_000

interface CacheEntry {
  value: boolean
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

/**
 * Returns true if the AI feature is currently enabled. Returns false if the
 * feature is disabled, doesn't exist, or the lookup fails. Errors are
 * swallowed and logged — an AI feature outage must never break a non-AI
 * code path.
 */
export async function isAIFeatureEnabled(slug: string): Promise<boolean> {
  const now = Date.now()
  const cached = cache.get(slug)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  let value = false
  try {
    const row = await prisma.aIFeature.findUnique({
      where: { slug },
      select: { isEnabled: true },
    })
    value = row?.isEnabled ?? false
  } catch (error) {
    console.error('isAIFeatureEnabled lookup failed', { slug, error })
    value = false
  }

  cache.set(slug, { value, expiresAt: now + CACHE_TTL_MS })
  return value
}

/**
 * Hint to the cache that a slug was just toggled. Trims the entry so the next
 * `isAIFeatureEnabled` call refetches. Call from the toggle API route after
 * the DB write succeeds.
 */
export function invalidateAIFeatureCache(slug: string): void {
  cache.delete(slug)
}

/**
 * Drop the entire cache. Useful in tests; not used in production paths.
 */
export function _resetAIFeatureCache(): void {
  cache.clear()
}
