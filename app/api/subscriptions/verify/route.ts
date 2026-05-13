import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { getPaymentProvider } from '@/lib/subscriptions/provider'

// Called after the payment provider's checkout step. In live mode, the
// frontend receives `payment_id`, `order_id`, `signature` from Razorpay
// Checkout and forwards them here for HMAC verification. In mock mode, the
// frontend just calls this with the synthesized order_id.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()
    const orderId: string | undefined = body?.order_id
    const paymentId: string | undefined = body?.payment_id
    const signature: string | undefined = body?.signature
    if (!orderId) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    }

    const provider = getPaymentProvider()
    const verifyResult = await provider.verifyPayment({
      orderId,
      paymentId: paymentId || '',
      signature: signature || '',
    })

    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Find the pending subscription for this order.
    const sub = await prisma.subscription.findFirst({
      where: { razorpayOrderId: orderId, userId: user.id },
      include: { plan: { select: { billingPeriod: true } } },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (sub.status === 'active') {
      return NextResponse.json({
        success: true,
        data: { subscription_id: sub.id, message: 'Already active' },
      })
    }

    const now = new Date()
    const periodEnd = new Date(now)
    const billingPeriod = sub.plan?.billingPeriod
    if (billingPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else if (billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      // 'unlimited' or unknown — 100 years.
      periodEnd.setFullYear(periodEnd.getFullYear() + 100)
    }

    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'active',
          razorpayPaymentId: verifyResult.paymentId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        },
      })
    } catch (updErr) {
      console.error('Subscription activate error:', updErr)
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
    }

    // Best-effort invoice row. Failure here doesn't block activation —
    // operations can backfill later.
    try {
      await prisma.invoice.create({
        data: {
          subscriptionId: sub.id,
          userId: user.id,
          amountInrPaise: BigInt(0), // updated by webhook if real provider
          razorpayPaymentId: verifyResult.paymentId,
        },
      })
    } catch (invoiceErr) {
      console.error('Invoice insert error (non-fatal):', invoiceErr)
    }

    return NextResponse.json({
      success: true,
      data: { subscription_id: sub.id, status: 'active' },
    })
  } catch (err) {
    console.error('Subscription verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
