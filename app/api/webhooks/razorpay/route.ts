import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

    const admin = createClient(supabaseUrl, supabaseServiceKey)
    const orderId = orderEntity?.id || paymentEntity?.order_id

    if (!orderId) {
      // Acknowledge to prevent retries — non-payment events don't concern us.
      return NextResponse.json({ success: true, ignored: true })
    }

    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, user_id, status, plan:subscription_plans(billing_period)')
      .eq('razorpay_order_id', orderId)
      .single()

    if (!sub) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const now = new Date()

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (sub.status !== 'active') {
        const periodEnd = new Date(now)
        const planRecord: any = (sub as any).plan
        const planInfo = Array.isArray(planRecord) ? planRecord[0] : planRecord
        if (planInfo?.billing_period === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        await admin
          .from('subscriptions')
          .update({
            status: 'active',
            razorpay_payment_id: paymentEntity?.id,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', sub.id)

        await admin.from('invoices').insert({
          subscription_id: sub.id,
          user_id: sub.user_id,
          amount_inr_paise: paymentEntity?.amount ?? 0,
          razorpay_payment_id: paymentEntity?.id,
        })
      }
    } else if (eventType === 'payment.failed') {
      if (sub.status === 'pending') {
        await admin
          .from('subscriptions')
          .update({ status: 'failed', updated_at: now.toISOString() })
          .eq('id', sub.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Razorpay webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
