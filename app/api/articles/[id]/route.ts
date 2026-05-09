import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET - Get single article
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const articleId = params.id
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: article, error } = await supabase
      .from('articles')
      .select(
        `
        *,
        author:users(id, email, full_name)
      `
      )
      .eq('id', articleId)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Allow viewing published articles or own drafts
    if (article.status !== 'published') {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get('sb-access-token')?.value

      if (!accessToken) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }

      const parts = accessToken.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
      const userId = payload.sub

      if (article.author_id !== userId) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
    }

    return NextResponse.json({
      success: true,
      data: article,
    })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update article (author only, drafts only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    const articleId = params.id
    const body = await request.json()
    const { title, content, category, tags } = body

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check ownership and status
    const { data: existing } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!existing || existing.author_id !== userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only update draft articles' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('articles')
      .update({
        title: title || existing.title,
        content: content || existing.content,
        category: category !== undefined ? category : existing.category,
        tags: tags || existing.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating article:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Article updated',
      data,
    })
  } catch (error) {
    console.error('Update article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
