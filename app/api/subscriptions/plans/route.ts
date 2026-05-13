import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, slug, name, price_inr_paise, billing_period, features')
      .eq('is_active', true)
      .order('price_inr_paise', { ascending: true })

    if (error) {
      console.error('Plans fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (err) {
    console.error('Plans error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
