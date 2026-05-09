import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', payload.sub)

    const isAdmin = userRoles?.some((ur: any) => ur.role?.name === 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get verified advisors count
    const { count: totalAdvisors } = await supabase
      .from('advisor_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)

    // Get pending credentials count
    const { count: pendingCredentials } = await supabase
      .from('advisor_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get pending articles count
    const { count: pendingArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalAdvisors: totalAdvisors || 0,
        pendingCredentials: pendingCredentials || 0,
        pendingArticles: pendingArticles || 0,
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
