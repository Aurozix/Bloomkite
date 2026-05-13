import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const questionId = params.id

    // Fetch question
    const { data: question, error: qError } = await supabaseAnon
      .from('forum_questions')
      .select('id, title, content, status, answer_count, created_at, updated_at, author:users(id, email, full_name)')
      .eq('id', questionId)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Fetch answers ordered by best_answer first, then by votes DESC
    const { data: answers, error: aError } = await supabaseAnon
      .from('forum_answers')
      .select(
        'id, content, votes_count, is_best_answer, created_at, updated_at, author:users(id, email, full_name)'
      )
      .eq('question_id', questionId)
      .order('is_best_answer', { ascending: false })
      .order('votes_count', { ascending: false })

    if (aError) {
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        question,
        answers: answers || [],
      },
    })
  } catch (error) {
    console.error('Get question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
