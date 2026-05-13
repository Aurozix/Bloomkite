// Subscription tier resolution and feature gating.
//
// `getActiveTier` returns the highest-priority tier currently in force for a
// user. Free is the default when no paid subscription is active or known.
//
// `hasFeature` is the only API callers should use to gate features.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
export async function getActiveTier(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedTier> {
  try {
    const now = new Date().toISOString()
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, plan_id, current_period_end, status, plan:subscription_plans(slug, name, features)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', now)
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single()

    if (sub && (sub as any).plan) {
      const planRecord = (sub as any).plan
      const plan = Array.isArray(planRecord) ? planRecord[0] : planRecord
      if (plan?.slug) {
        return {
          slug: plan.slug as TierSlug,
          name: plan.name,
          features: plan.features as TierFeatures,
          subscriptionId: (sub as any).id,
          currentPeriodEnd: (sub as any).current_period_end,
        }
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

/**
 * Convenience: build a service-role supabase client for use in API routes
 * after the request has been authorized. (Anon clients can also be used; this
 * is just a shortcut for routes that need to read subscription data without
 * RLS getting in the way.)
 */
export function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}
