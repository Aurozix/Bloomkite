import crypto from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

// Razorpay webhook handler. Validates signature, then drives subscription
// status transitions based on event type. Idempotent — re-posting the same
// event won't double-activate or double-charge.
//
// In mock mode (no RAZORPAY_WEBHOOK_SECRET), the signature check is skipped
// to allow local testing via curl. Set the secret as soon as live keys exist.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature') || ''

    if (webhookSecret) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')
      if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn(
        'Razorpay webhook: no RAZORPAY_WEBHOOK_SECRET set — signature check skipped.'
      )
    }

    const payload = JSON.parse(rawBody)
    const eventType: string | undefined = payload?.event
    const paymentEntity = payload?.payload?.payment?.entity
    const orderEntity = payload?.payload?.order?.entity

    if (!eventType) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    const orderId = orderEntity?.id || paymentEntity?.order_id

    if (!orderId) {
      // Acknowledge to prevent retries — non-payment events don't concern us.
      return NextResponse.json({ success: true, ignored: true })
    }

    const sub = await prisma.subscription.findFirst({
      where: { razorpayOrderId: orderId },
      include: { plan: { select: { billingPeriod: true } } },
    })

    if (!sub) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const now = new Date()

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (sub.status !== 'active') {
        const periodEnd = new Date(now)
        if (sub.plan?.billingPeriod === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'active',
            razorpayPaymentId: paymentEntity?.id,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: now,
          },
        })

        await prisma.invoice.create({
          data: {
            subscriptionId: sub.id,
            userId: sub.userId,
            amountInrPaise: BigInt(paymentEntity?.amount ?? 0),
            razorpayPaymentId: paymentEntity?.id,
          },
        })
      }
    } else if (eventType === 'payment.failed') {
      if (sub.status === 'pending') {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'failed', updatedAt: now },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Razorpay webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
