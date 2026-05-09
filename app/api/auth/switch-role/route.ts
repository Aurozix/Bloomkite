import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()

    if (!role) {
      return NextResponse.json({ error: 'Role required' }, { status: 400 })
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
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Verify user has this role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role:roles(name)
      `)
      .eq('user_id', user.id)

    const roles = userRoles?.map((ur: any) => ur.role?.name) || []
    if (!roles.includes(role)) {
      return NextResponse.json({ error: 'User does not have this role' }, { status: 403 })
    }

    // Update user metadata with current_role
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        current_role: role,
      },
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      current_role: role,
    })
  } catch (error) {
    console.error('Switch role error:', error)
    return NextResponse.json({ error: 'Failed to switch role' }, { status: 500 })
  }
}
