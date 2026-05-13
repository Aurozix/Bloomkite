// Subscription tier resolution and feature gating.
//
// `getActiveTier` returns the highest-priority tier currently in force for a
// user. Free is the default when no paid subscription is active or known.
//
// `hasFeature` is the only API callers should use to gate features.

import { prisma } from '@/lib/db'

export type TierSlug = 'free' | 'silver' | 'gold'

export interface TierFeatures {
  max_calculators: number
  plan_sharing: boolean
  priority_support: boolean
  consultation_credits: number
}

export interface ResolvedTier {
  slug: TierSlug
  name: string
  features: TierFeatures
  subscriptionId: string | null
  currentPeriodEnd: string | null
}

const DEFAULT_FREE: ResolvedTier = {
  slug: 'free',
  name: 'Free',
  features: {
    max_calculators: 5,
    plan_sharing: false,
    priority_support: false,
    consultation_credits: 0,
  },
  subscriptionId: null,
  currentPeriodEnd: null,
}

const TIER_RANK: Record<TierSlug, number> = {
  free: 0,
  silver: 1,
  gold: 2,
}

export function tierAtLeast(actual: TierSlug, required: TierSlug): boolean {
  return TIER_RANK[actual] >= TIER_RANK[required]
}

/**
 * Look up the user's active subscription and resolve to a tier. Returns
 * DEFAULT_FREE on any miss — never throws into the caller's hot path.
 */
export async function getActiveTier(userId: string): Promise<ResolvedTier> {
  try {
    const now = new Date()
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gt: now },
      },
      orderBy: { currentPeriodEnd: 'desc' },
      include: {
        plan: {
          select: { slug: true, name: true, features: true },
        },
      },
    })

    if (sub && sub.plan?.slug) {
      return {
        slug: sub.plan.slug as TierSlug,
        name: sub.plan.name,
        features: sub.plan.features as unknown as TierFeatures,
        subscriptionId: sub.id,
        currentPeriodEnd: sub.currentPeriodEnd
          ? sub.currentPeriodEnd.toISOString()
          : null,
      }
    }
  } catch {
    // Fall through to free.
  }
  return DEFAULT_FREE
}

/**
 * Returns true if the user's current tier permits `feature`. For numeric
 * features (max_calculators, consultation_credits) the caller must compare
 * the resolved value against their own counter; this helper is for booleans.
 */
export function hasFeature(
  tier: ResolvedTier,
  feature: keyof TierFeatures
): boolean {
  const val = tier.features[feature]
  return typeof val === 'boolean' ? val : Number(val) > 0
}
