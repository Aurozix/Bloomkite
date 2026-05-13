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

    // Base query against advisor_profiles. PostgREST can't traverse the
    // implicit advisor_profiles -> users <- advisor_followers chain (both
    // advisor_followers.advisor_id and advisor_expertise.user_id reference
    // users.id, not advisor_profiles.user_id), so we fetch profiles here and
    // load expertise in a second batched query below.
    //
    // follower_count comes from the denormalized column on advisor_profiles
    // maintained by the trigger in migration 005.
    let query = supabase
      .from('advisor_profiles')
      .select('*', { count: 'exact' })
      .eq('is_verified', true)
      .eq('workflow_status', 'approved')

    if (q) {
      query = query.or(
        `display_name.ilike.%${q}%,company_name.ilike.%${q}%,bio.ilike.%${q}%`
      )
    }

    if (city) {
      query = query.eq('city', city)
    }

    // Both sort branches use a deterministic created_at tiebreaker so equal
    // counts produce a stable order across pages.
    if (sort === 'followers') {
      query = query
        .order('follower_count', { ascending: false })
        .order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: advisors, error, count } = await query

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search advisors' }, { status: 500 })
    }

    const advisorList = advisors ?? []

    // Batch-fetch expertise rows for the visible advisors so the page can
    // render their specialisation tags. One query per request, regardless of
    // result-set size.
    const userIds = advisorList.map((a: any) => a.user_id).filter(Boolean)
    const expertiseByUser = new Map<string, string[]>()
    if (userIds.length > 0) {
      const { data: expertiseRows } = await supabase
        .from('advisor_expertise')
        .select('user_id, specialization')
        .in('user_id', userIds)
      for (const row of expertiseRows ?? []) {
        const arr = expertiseByUser.get((row as any).user_id) ?? []
        arr.push((row as any).specialization)
        expertiseByUser.set((row as any).user_id, arr)
      }
    }

    // Specialization filter is post-fetch (the embedded query was the same).
    // Acceptable at MVP volumes; revisit if advisor count gets large.
    let filtered = advisorList
    if (specialization) {
      filtered = filtered.filter((advisor: any) => {
        const tags = expertiseByUser.get(advisor.user_id) ?? []
        return tags.some((t) => t.toLowerCase().includes(specialization))
      })
    }

    const formattedAdvisors = filtered.map((advisor: any) => ({
      ...advisor,
      follower_count: advisor.follower_count ?? 0,
      expertise: expertiseByUser.get(advisor.user_id) ?? [],
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
