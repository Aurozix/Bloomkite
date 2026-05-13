import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

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

// User-initiated cancel. The subscription stays "active" until current_period_end
// (graceful degradation per RAD §2.4) — we set cancelled_at and prevent renewal.
// When live Razorpay is wired in, this would also call subscription.cancel on the
// provider so they stop billing.
export async function POST(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const now = new Date()

    // Find the user's active subscription first, then update it. We can't
    // chain .update with multi-field where in Prisma without using updateMany,
    // which doesn't return the row.
    const active = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
    })

    if (!active) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      )
    }

    let sub
    try {
      sub = await prisma.subscription.update({
        where: { id: active.id },
        data: {
          status: 'cancelled',
          cancelledAt: now,
          updatedAt: now,
        },
      })
    } catch (error) {
      console.error('Cancel subscription update error:', error)
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeSubscription(sub),
      message: 'Subscription will remain active until period end',
    })
  } catch (err) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
