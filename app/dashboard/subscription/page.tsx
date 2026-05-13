'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'

interface Tier {
  slug: 'free' | 'silver' | 'gold'
  name: string
  features: {
    max_calculators: number
    plan_sharing: boolean
    priority_support: boolean
    consultation_credits: number
  }
  subscriptionId: string | null
  currentPeriodEnd: string | null
}

function SubscriptionDashboard() {
  const router = useRouter()
  const params = useSearchParams()
  const { addToast } = useToast()

  const [tier, setTier] = useState<Tier | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const mockOrder = params.get('mock_order')

  useEffect(() => {
    const run = async () => {
      // If the mock provider redirected us back with an order id, complete the
      // verification step so the pending row flips to active.
      if (mockOrder) {
        setVerifying(true)
        try {
          const resp = await fetch('/api/subscriptions/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: mockOrder }),
          })
          if (resp.ok) {
            addToast('Subscription activated', 'success')
            // Strip query param so reload doesn't re-verify.
            router.replace('/dashboard/subscription')
          } else {
            const data = await resp.json()
            addToast(data.error ?? 'Verification failed', 'error')
          }
        } catch (err) {
          console.error('Verify error:', err)
          addToast('Verification failed', 'error')
        } finally {
          setVerifying(false)
        }
      }

      try {
        const resp = await fetch('/api/subscriptions/current')
        if (resp.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (resp.ok) {
          const data = await resp.json()
          setTier(data.data ?? null)
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [mockOrder, router, addToast])

  const handleCancel = async () => {
    if (!tier?.subscriptionId) return
    setCancelling(true)
    try {
      const resp = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })
      const data = await resp.json()
      if (!resp.ok) {
        addToast(data.error ?? 'Cancel failed', 'error')
        return
      }
      addToast(data.message ?? 'Cancelled', 'success')
      // Reload current tier; the row may still be "active" until period end.
      const fresh = await fetch('/api/subscriptions/current')
      if (fresh.ok) {
        const f = await fresh.json()
        setTier(f.data ?? null)
      }
    } finally {
      setCancelling(false)
    }
  }

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <a
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
        >
          ← Back to Dashboard
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Subscription</h1>

        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-3xl font-bold text-gray-900">
                {tier?.name ?? 'Free'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                tier?.slug === 'gold'
                  ? 'bg-amber-100 text-amber-700'
                  : tier?.slug === 'silver'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tier?.slug?.toUpperCase() ?? 'FREE'}
            </span>
          </div>

          {tier?.currentPeriodEnd && (
            <p className="text-sm text-gray-600 mb-6">
              Renews on{' '}
              <strong>
                {new Date(tier.currentPeriodEnd).toLocaleDateString()}
              </strong>
            </p>
          )}

          <ul className="space-y-2 text-sm text-gray-700 mb-6">
            <li>✓ {tier?.features.max_calculators ?? 5} calculators</li>
            {tier?.features.plan_sharing && <li>✓ Plan sharing with advisors</li>}
            {tier?.features.priority_support && <li>✓ Priority 24h response</li>}
            {(tier?.features.consultation_credits ?? 0) > 0 && (
              <li>
                ✓ {tier?.features.consultation_credits} consultation/month
              </li>
            )}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/subscriptions" className="btn-primary flex-1 text-center py-3">
              {tier?.slug === 'free' ? 'Upgrade' : 'Change Plan'}
            </a>
            {tier?.subscriptionId && tier.slug !== 'free' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-outline flex-1 py-3 disabled:opacity-60"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MySubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
        </div>
      }
    >
      <SubscriptionDashboard />
    </Suspense>
  )
}
