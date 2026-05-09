import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET - List published articles (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('articles')
      .select(
        `
        *,
        author:users(id, email, full_name)
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')

    if (category) {
      query = query.eq('category', category)
    }

    query = query.order('published_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: articles, error, count } = await query

    if (error) {
      console.error('Error fetching articles:', error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: articles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create draft article (advisor only)
export async function POST(request: NextRequest) {
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
    const { title, content, category, tags } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('articles')
      .insert({
        author_id: userId,
        title,
        content,
        category: category || null,
        tags: tags || [],
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating article:', error)
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Article created as draft',
      data,
    })
  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
