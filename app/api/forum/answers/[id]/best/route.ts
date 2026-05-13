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

    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    const answerId = params.id

    // Get the answer and its question
    const { data: answer, error: aError } = await supabase
      .from('forum_answers')
      .select('question_id')
      .eq('id', answerId)
      .single()

    if (aError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    // Check if user is the question author
    const { data: question, error: qError } = await supabase
      .from('forum_questions')
      .select('author_id')
      .eq('id', answer.question_id)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (question.author_id !== userId) {
      return NextResponse.json({ error: 'Only question author can mark best answer' }, { status: 403 })
    }

    // Remove best answer from any other answers for this question
    await supabase
      .from('forum_answers')
      .update({ is_best_answer: false })
      .eq('question_id', answer.question_id)

    // Mark this answer as best
    await supabase
      .from('forum_answers')
      .update({ is_best_answer: true })
      .eq('id', answerId)

    return NextResponse.json({
      success: true,
      message: 'Answer marked as best',
    })
  } catch (error) {
    console.error('Mark best answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
