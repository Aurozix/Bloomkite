import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    })

    await supabase.auth.signOut()

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      {
        status: 200,
        headers: {
          'Set-Cookie': [
            'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;',
            'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;',
          ],
        },
      }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
