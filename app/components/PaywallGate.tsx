'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type TierSlug = 'free' | 'silver' | 'gold'

const RANK: Record<TierSlug, number> = { free: 0, silver: 1, gold: 2 }

interface CurrentTier {
  slug: TierSlug
  name: string
  features: {
    max_calculators: number
    plan_sharing: boolean
    priority_support: boolean
    consultation_credits: number
  }
}

interface Props {
  requires: TierSlug
  children: React.ReactNode
  /**
   * Optional explainer shown in the paywall card when the user's tier is
   * insufficient. Defaults to a generic Silver/Gold-required message.
   */
  reason?: string
}

/**
 * Client-side feature gate. Wrap a section that should only render for paid
 * tiers; falls back to a paywall card with an upgrade CTA. Server-side gating
 * still lives in the API routes — this is just to keep the UI honest.
 */
export function PaywallGate({ requires, children, reason }: Props) {
  const router = useRouter()
  const [tier, setTier] = useState<CurrentTier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscriptions/current')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTier(d?.data ?? null))
      .catch(() => setTier(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-6 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    )
  }

  const actual: TierSlug = tier?.slug ?? 'free'
  if (RANK[actual] >= RANK[requires]) {
    return <>{children}</>
  }

  return (
    <div className="card p-8 text-center border-2 border-dashed border-blue-200 bg-blue-50">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {requires === 'silver' ? 'Silver' : 'Gold'} plan required
      </h3>
      <p className="text-gray-600 mb-6">
        {reason ??
          (requires === 'silver'
            ? 'Upgrade to Silver to unlock this feature.'
            : 'Upgrade to Gold to unlock this feature.')}
      </p>
      <button
        onClick={() => router.push('/subscriptions')}
        className="btn-primary px-6 py-2"
      >
        See plans
      </button>
    </div>
  )
}
