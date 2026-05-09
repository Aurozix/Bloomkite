import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check ownership and draft status
    const { data: existing } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!existing || existing.author_id !== userId || existing.status !== 'draft') {
      return NextResponse.json({ error: 'Article not found or not in draft status' }, { status: 404 })
    }

    // Update status to pending
    const { data, error } = await supabase
      .from('articles')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', articleId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to submit article' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Article submitted for review',
      data,
    })
  } catch (error) {
    console.error('Submit article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
