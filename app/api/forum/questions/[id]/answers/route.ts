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

    const questionId = params.id
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Create answer
    const { data: answer, error: aError } = await supabase
      .from('forum_answers')
      .insert({
        author_id: userId,
        question_id: questionId,
        content,
        votes_count: 0,
        is_best_answer: false,
      })
      .select('id, content, votes_count, is_best_answer, created_at, author:users(id, email, full_name)')
      .single()

    if (aError) {
      console.error('Insert answer error:', aError)
      return NextResponse.json({ error: 'Failed to create answer' }, { status: 500 })
    }

    // Get current answer count
    const { data: questionData } = await supabase
      .from('forum_questions')
      .select('answer_count')
      .eq('id', questionId)
      .single()

    if (questionData) {
      await supabase
        .from('forum_questions')
        .update({ answer_count: (questionData.answer_count || 0) + 1 })
        .eq('id', questionId)
    }

    return NextResponse.json({
      success: true,
      message: 'Answer created',
      data: answer,
    })
  } catch (error) {
    console.error('Create answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
