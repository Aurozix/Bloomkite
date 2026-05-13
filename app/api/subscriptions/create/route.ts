import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPaymentProvider } from '@/lib/subscriptions/provider'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create a pending subscription + a payment-provider order. The frontend then
// either:
//   - mock mode: redirects to mockCompletionUrl, which calls /api/subscriptions/verify
//   - live mode: hands the orderId to the Razorpay Checkout JS SDK
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
    const planSlug: string | undefined = body?.plan_slug
    if (!planSlug) {
      return NextResponse.json({ error: 'plan_slug is required' }, { status: 400 })
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: plan, error: planErr } = await admin
      .from('subscription_plans')
      .select('id, slug, name, price_inr_paise')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single()

    if (planErr || !plan) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 404 })
    }

    // Free tier: no payment needed; mark a subscription active for 100 years
    // so the gating layer sees it. (We could also just rely on the free
    // default in tier.ts — but writing a row keeps history coherent.)
    if (plan.price_inr_paise === 0) {
      const now = new Date()
      const farFuture = new Date(now)
      farFuture.setFullYear(farFuture.getFullYear() + 100)

      const { data: sub, error: subErr } = await admin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: farFuture.toISOString(),
        })
        .select()
        .single()

      if (subErr) {
        console.error('Free subscription insert error:', subErr)
        return NextResponse.json({ error: 'Failed to activate free plan' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: { subscription: sub, requires_payment: false },
      })
    }

    const provider = getPaymentProvider()
    const receipt = `bk_${user.id.slice(0, 8)}_${Date.now()}`
    const order = await provider.createOrder({
      amountPaise: plan.price_inr_paise,
      currency: 'INR',
      receipt,
      notes: { plan_slug: plan.slug, user_id: user.id },
    })

    const { data: sub, error: subErr } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'pending',
        razorpay_order_id: order.orderId,
      })
      .select()
      .single()

    if (subErr) {
      console.error('Pending subscription insert error:', subErr)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: sub,
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
