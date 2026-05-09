import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ user: null })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Get user roles and permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role:roles(id, name)
      `)
      .eq('user_id', user.id)

    // Get investor or advisor profile
    const { data: investorProfile } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: advisorProfile } = await supabase
      .from('advisor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const roles = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []

    return NextResponse.json({
      user: {
        ...user,
        roles,
        investor_profile: investorProfile,
        advisor_profile: advisorProfile,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
