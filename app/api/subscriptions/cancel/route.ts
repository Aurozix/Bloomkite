import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// User-initiated cancel. The subscription stays "active" until current_period_end
// (graceful degradation per RAD §2.4) — we set cancelled_at and prevent renewal.
// When live Razorpay is wired in, this would also call subscription.cancel on the
// provider so they stop billing.
export async function POST(_request: NextRequest) {
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

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date().toISOString()
    const { data: sub, error } = await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
      })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .select()
      .single()

    if (error || !sub) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sub,
      message: 'Subscription will remain active until period end',
    })
  } catch (err) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
