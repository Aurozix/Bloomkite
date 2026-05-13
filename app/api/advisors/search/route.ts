import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase()
    const city = searchParams.get('city')?.toLowerCase()
    const specialization = searchParams.get('specialization')?.toLowerCase()
    const sort = searchParams.get('sort') || 'newest' // 'followers' | 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Build base query
    let query = supabase
      .from('advisor_profiles')
      .select(
        `
        *,
        advisor_followers:advisor_followers(count),
        advisor_expertise(specialization)
      `,
        { count: 'exact' }
      )
      .eq('is_verified', true)
      .eq('workflow_status', 'approved')

    // Apply text search
    if (q) {
      query = query.or(
        `display_name.ilike.%${q}%,company_name.ilike.%${q}%,bio.ilike.%${q}%`
      )
    }

    // Apply city filter
    if (city) {
      query = query.eq('city', city)
    }

    // Apply sorting. Both branches use a deterministic created_at tiebreaker
    // so equal counts produce a stable order across pages.
    if (sort === 'followers') {
      query = query
        .order('follower_count', { ascending: false })
        .order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: advisors, error, count } = await query

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search advisors' }, { status: 500 })
    }

    // Post-process to filter by specialization and format response
    let filtered = advisors || []

    if (specialization) {
      filtered = filtered.filter((advisor: any) =>
        advisor.advisor_expertise?.some((exp: any) =>
          exp.specialization?.toLowerCase().includes(specialization)
        )
      )
    }

    // Format advisors. follower_count is now denormalized on advisor_profiles
    // (kept in sync by a trigger); the advisor_followers aggregate is kept as
    // a fallback in case the trigger hasn't backfilled an older row.
    const formattedAdvisors = filtered.map((advisor: any) => ({
      ...advisor,
      follower_count:
        advisor.follower_count ?? advisor.advisor_followers?.[0]?.count ?? 0,
      expertise:
        advisor.advisor_expertise?.map((e: any) => e.specialization) || [],
    }))

    return NextResponse.json({
      success: true,
      data: formattedAdvisors,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Advisor search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
