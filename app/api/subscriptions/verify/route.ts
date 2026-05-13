import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPaymentProvider } from '@/lib/subscriptions/provider'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Called after the payment provider's checkout step. In live mode, the
// frontend receives `payment_id`, `order_id`, `signature` from Razorpay
// Checkout and forwards them here for HMAC verification. In mock mode, the
// frontend just calls this with the synthesized order_id.
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // Find the pending subscription for this order.
    const { data: sub, error: lookupErr } = await admin
      .from('subscriptions')
      .select('id, plan_id, user_id, status, plan:subscription_plans(billing_period)')
      .eq('razorpay_order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (lookupErr || !sub) {
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
    const planRecord: any = (sub as any).plan
    const planInfo = Array.isArray(planRecord) ? planRecord[0] : planRecord
    const billingPeriod = planInfo?.billing_period
    if (billingPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else if (billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      // 'unlimited' or unknown — 100 years.
      periodEnd.setFullYear(periodEnd.getFullYear() + 100)
    }

    const { error: updErr } = await admin
      .from('subscriptions')
      .update({
        status: 'active',
        razorpay_payment_id: verifyResult.paymentId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', sub.id)

    if (updErr) {
      console.error('Subscription activate error:', updErr)
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
    }

    // Best-effort invoice row. Failure here doesn't block activation —
    // operations can backfill later.
    await admin.from('invoices').insert({
      subscription_id: sub.id,
      user_id: user.id,
      amount_inr_paise: 0, // updated by webhook if real provider
      razorpay_payment_id: verifyResult.paymentId,
    })

    return NextResponse.json({
      success: true,
      data: { subscription_id: sub.id, status: 'active' },
    })
  } catch (err) {
    console.error('Subscription verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
