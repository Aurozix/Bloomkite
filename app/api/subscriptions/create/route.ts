import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { getPaymentProvider } from '@/lib/subscriptions/provider'

function serializeSubscription(s: any) {
  return {
    id: s.id,
    user_id: s.userId,
    plan_id: s.planId,
    status: s.status,
    razorpay_order_id: s.razorpayOrderId,
    razorpay_subscription_id: s.razorpaySubscriptionId,
    razorpay_payment_id: s.razorpayPaymentId,
    current_period_start: s.currentPeriodStart,
    current_period_end: s.currentPeriodEnd,
    cancelled_at: s.cancelledAt,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }
}

// Create a pending subscription + a payment-provider order. The frontend then
// either:
//   - mock mode: redirects to mockCompletionUrl, which calls /api/subscriptions/verify
//   - live mode: hands the orderId to the Razorpay Checkout JS SDK
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()
    const planSlug: string | undefined = body?.plan_slug
    if (!planSlug) {
      return NextResponse.json({ error: 'plan_slug is required' }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { slug: planSlug, isActive: true },
      select: { id: true, slug: true, name: true, priceInrPaise: true },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 404 })
    }

    const priceInrPaise = Number(plan.priceInrPaise)

    // Free tier: no payment needed; mark a subscription active for 100 years
    // so the gating layer sees it. (We could also just rely on the free
    // default in tier.ts — but writing a row keeps history coherent.)
    if (priceInrPaise === 0) {
      const now = new Date()
      const farFuture = new Date(now)
      farFuture.setFullYear(farFuture.getFullYear() + 100)

      let sub
      try {
        sub = await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: farFuture,
          },
        })
      } catch (subErr) {
        console.error('Free subscription insert error:', subErr)
        return NextResponse.json({ error: 'Failed to activate free plan' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: { subscription: serializeSubscription(sub), requires_payment: false },
      })
    }

    const provider = getPaymentProvider()
    const receipt = `bk_${user.id.slice(0, 8)}_${Date.now()}`
    const order = await provider.createOrder({
      amountPaise: priceInrPaise,
      currency: 'INR',
      receipt,
      notes: { plan_slug: plan.slug, user_id: user.id },
    })

    let sub
    try {
      sub = await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: 'pending',
          razorpayOrderId: order.orderId,
        },
      })
    } catch (subErr) {
      console.error('Pending subscription insert error:', subErr)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: serializeSubscription(sub),
        order,
        provider: provider.name,
        requires_payment: true,
      },
    })
  } catch (err) {
    console.error('Subscription create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
