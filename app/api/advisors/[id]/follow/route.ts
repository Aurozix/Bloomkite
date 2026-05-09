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

    // Decode JWT to get investor ID
    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const investorId = payload.sub

    const advisorId = params.id

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('advisor_followers')
      .select('id')
      .eq('investor_id', investorId)
      .eq('advisor_id', advisorId)
      .single()

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this advisor' },
        { status: 400 }
      )
    }

    // Create follow
    const { data, error } = await supabase
      .from('advisor_followers')
      .insert({
        investor_id: investorId,
        advisor_id: advisorId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating follow:', error)
      return NextResponse.json({ error: 'Failed to follow advisor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Now following this advisor',
      data,
    })
  } catch (error) {
    console.error('Follow error:', error)
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

    // Decode JWT to get investor ID
    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const investorId = payload.sub

    const advisorId = params.id

    // Delete follow
    const { error } = await supabase
      .from('advisor_followers')
      .delete()
      .eq('investor_id', investorId)
      .eq('advisor_id', advisorId)

    if (error) {
      console.error('Error deleting follow:', error)
      return NextResponse.json({ error: 'Failed to unfollow advisor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Unfollowed advisor',
    })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
