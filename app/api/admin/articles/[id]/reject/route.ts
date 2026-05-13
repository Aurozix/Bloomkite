import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
const supabase = createClient(supabaseUrl, supabaseKey)

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

    const articleId = params.id
    const body = await request.json()
    const { rejection_reason } = body

    const { data, error } = await supabase
      .from('articles')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Article not found or already processed' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Article rejected',
      data,
    })
  } catch (error) {
    console.error('Reject article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
