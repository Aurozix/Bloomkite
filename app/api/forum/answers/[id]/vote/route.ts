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

    const answerId = params.id
    const body = await request.json()
    const { vote_type } = body

    if (!vote_type || !['helpful', 'unhelpful'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from('forum_answer_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('answer_id', answerId)
      .single()

    if (existingVote) {
      // Update existing vote
      await supabase
        .from('forum_answer_votes')
        .update({ vote_type })
        .eq('user_id', userId)
        .eq('answer_id', answerId)
    } else {
      // Insert new vote
      await supabase
        .from('forum_answer_votes')
        .insert({
          user_id: userId,
          answer_id: answerId,
          vote_type,
        })
    }

    // Recalculate votes_count for answer (only count 'helpful' votes)
    const { data: votes } = await supabase
      .from('forum_answer_votes')
      .select('id', { count: 'exact' })
      .eq('answer_id', answerId)
      .eq('vote_type', 'helpful')

    const votesCount = votes?.length || 0

    await supabase
      .from('forum_answers')
      .update({ votes_count: votesCount })
      .eq('id', answerId)

    return NextResponse.json({
      success: true,
      message: 'Vote recorded',
      votes_count: votesCount,
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Delete vote
    await supabase
      .from('forum_answer_votes')
      .delete()
      .eq('user_id', userId)
      .eq('answer_id', answerId)

    // Recalculate votes_count
    const { data: votes } = await supabase
      .from('forum_answer_votes')
      .select('id', { count: 'exact' })
      .eq('answer_id', answerId)
      .eq('vote_type', 'helpful')

    const votesCount = votes?.length || 0

    await supabase
      .from('forum_answers')
      .update({ votes_count: votesCount })
      .eq('id', answerId)

    return NextResponse.json({
      success: true,
      message: 'Vote removed',
      votes_count: votesCount,
    })
  } catch (error) {
    console.error('Delete vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
