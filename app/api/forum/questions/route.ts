import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAnon
      .from('forum_questions')
      .select('id, title, content, status, answer_count, created_at, author:users(id, email, full_name)', {
        count: 'exact',
      })
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .insert({
        author_id: userId,
        title,
        content,
        status: 'open',
        answer_count: 0,
      })
      .select('id, title, content, status, answer_count, created_at, author:users(id, email, full_name)')
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Question created',
      data,
    })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
