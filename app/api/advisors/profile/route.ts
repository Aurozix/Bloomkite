import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Decode JWT to get user ID
    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    const body = await request.json()
    const { display_name, bio, company_name, designation, city, state, website_url, phone_number } = body

    const { data, error } = await supabase
      .from('advisor_profiles')
      .update({
        display_name: display_name || null,
        bio: bio || null,
        company_name: company_name || null,
        designation: designation || null,
        city: city || null,
        state: state || null,
        website_url: website_url || null,
        phone_number: phone_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating advisor profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data,
    })
  } catch (error) {
    console.error('Advisor profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
