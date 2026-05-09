import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const advisorId = params.id
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    // Get current user (if authenticated)
    let currentUserId = null
    if (accessToken) {
      const parts = accessToken.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
      currentUserId = payload.sub
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    })

    // Fetch advisor profile
    const { data: profile, error: profileError } = await supabase
      .from('advisor_profiles')
      .select('*')
      .eq('user_id', advisorId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    // Fetch approved credentials
    const { data: credentials } = await supabase
      .from('advisor_credentials')
      .select('*')
      .eq('user_id', advisorId)
      .eq('status', 'approved')

    // Fetch expertise
    const { data: expertise } = await supabase
      .from('advisor_expertise')
      .select('specialization')
      .eq('user_id', advisorId)

    // Fetch follower count
    const supabaseServiceRole = createClient(supabaseUrl, supabaseKey)
    const { count: followerCount } = await supabaseServiceRole
      .from('advisor_followers')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisorId)

    // Check if current user is following
    let isFollowing = false
    if (currentUserId) {
      const { data: followData } = await supabase
        .from('advisor_followers')
        .select('*')
        .eq('investor_id', currentUserId)
        .eq('advisor_id', advisorId)
        .single()

      isFollowing = !!followData
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        credentials: credentials || [],
        expertise: expertise?.map((e) => e.specialization) || [],
        follower_count: followerCount || 0,
        is_following: isFollowing,
      },
    })
  } catch (error) {
    console.error('Get advisor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
