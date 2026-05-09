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

    const { data, error } = await supabase
      .from('advisor_credentials')
      .select(
        'id, credential_type, issuer, license_number, file_url, status, created_at, user:users(id, display_name, email)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.map((c: any) => ({
        ...c,
        advisor: c.user,
      })) || [],
    })
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
