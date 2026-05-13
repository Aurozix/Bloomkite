'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'

interface Plan {
  id: string
  slug: 'free' | 'silver' | 'gold'
  name: string
  price_inr_paise: number
  billing_period: string
  features: {
    max_calculators: number
    plan_sharing: boolean
    priority_support: boolean
    consultation_credits: number
  }
}

interface CurrentTier {
  slug: 'free' | 'silver' | 'gold'
  name: string
  currentPeriodEnd: string | null
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [plans, setPlans] = useState<Plan[]>([])
  const [current, setCurrent] = useState<CurrentTier | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [plansResp, currentResp] = await Promise.all([
          fetch('/api/subscriptions/plans'),
          fetch('/api/subscriptions/current'),
        ])
        const plansData = await plansResp.json()
        setPlans(plansData.data ?? [])
        if (currentResp.ok) {
          const currentData = await currentResp.json()
          setCurrent(currentData.data ?? null)
        }
      } catch (err) {
        console.error('Subscriptions page load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubscribe = async (slug: string) => {
    setSubscribing(slug)
    try {
      const resp = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_slug: slug }),
      })

      if (resp.status === 401) {
        router.push(`/auth/signin?next=${encodeURIComponent('/subscriptions')}`)
        return
      }

      const data = await resp.json()
      if (!resp.ok) {
        addToast(data.error ?? 'Failed to start subscription', 'error')
        return
      }

      // Free plan: instant activation. Send the user to their dashboard.
      if (!data.data?.requires_payment) {
        addToast('Free plan activated', 'success')
        router.push('/dashboard/subscription')
        return
      }

      // Mock provider: hop to its completion URL which triggers /verify on
      // the my-subscription page.
      const completionUrl = data.data?.order?.mockCompletionUrl
      if (completionUrl) {
        router.push(completionUrl)
        return
      }

      // Live mode: TODO — open Razorpay Checkout JS here with the orderId.
      addToast(
        'Live payment provider not yet wired up. Talk to the admin.',
        'error'
      )
    } catch (err) {
      console.error('Subscribe error:', err)
      addToast('Subscription failed', 'error')
    } finally {
      setSubscribing(null)
    }
  }

  const formatPrice = (paise: number) => {
    if (paise === 0) return 'Free'
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-3">
          Simple, Transparent Pricing
        </h1>
        <p className="text-center text-xl text-gray-600 mb-12">
          Choose the plan that fits how you use Bloomkite.
        </p>

        {current && current.slug !== 'free' && (
          <div className="card p-4 mb-8 bg-blue-50 border border-blue-200 text-center">
            <p className="text-blue-900">
              You&apos;re on the <strong>{current.name}</strong> plan
              {current.currentPeriodEnd
                ? ` until ${new Date(current.currentPeriodEnd).toLocaleDateString()}`
                : ''}
              .
            </p>
            <a href="/dashboard/subscription" className="text-sm text-blue-700 font-semibold hover:underline">
              Manage subscription →
            </a>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const featured = plan.slug === 'silver'
            const isCurrent = current?.slug === plan.slug
            return (
              <div
                key={plan.id}
                className={`card p-8 relative ${
                  featured ? 'ring-2 ring-blue-600 transform md:scale-105' : ''
                }`}
              >
                {featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-4xl font-bold text-blue-600 mb-6">
                  {formatPrice(plan.price_inr_paise)}
                  {plan.price_inr_paise > 0 && (
                    <span className="text-lg text-gray-600">/{plan.billing_period}</span>
                  )}
                </p>

                <ul className="space-y-3 mb-8">
                  <Feature
                    label={`${plan.features.max_calculators} calculators`}
                    enabled
                  />
                  <Feature
                    label="Unlimited plan sharing"
                    enabled={plan.features.plan_sharing}
                  />
                  <Feature
                    label="Priority 24h response"
                    enabled={plan.features.priority_support}
                  />
                  <Feature
                    label={`${plan.features.consultation_credits} consultation/mo`}
                    enabled={plan.features.consultation_credits > 0}
                  />
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={isCurrent || subscribing !== null}
                  className={`w-full py-3 font-semibold rounded-lg transition ${
                    isCurrent
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : featured
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {isCurrent
                    ? 'Current plan'
                    : subscribing === plan.slug
                    ? 'Working…'
                    : plan.price_inr_paise === 0
                    ? 'Start free'
                    : 'Subscribe'}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Prices in INR. Cancel anytime — your plan stays active until the end of the period.
        </p>
      </div>
    </div>
  )
}

function Feature({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 ${
        enabled ? 'text-gray-800' : 'text-gray-400'
      }`}
    >
      <span className={enabled ? 'text-green-500 text-xl' : 'text-gray-300 text-xl'}>
        {enabled ? '✓' : '—'}
      </span>
      <span>{label}</span>
    </li>
  )
}
