import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

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

    // Base query against advisor_profiles. follower_count comes from the
    // denormalized column maintained by the trigger in migration 005.
    const where: any = {
      isVerified: true,
      workflowStatus: 'approved',
    }

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (city) {
      where.city = city
    }

    // Both sort branches use a deterministic created_at tiebreaker so equal
    // counts produce a stable order across pages.
    const orderBy: any =
      sort === 'followers'
        ? [{ followerCount: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }]

    const [advisors, count] = await Promise.all([
      prisma.advisorProfile.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.advisorProfile.count({ where }),
    ])

    // Batch-fetch expertise rows for the visible advisors so the page can
    // render their specialisation tags. One query per request, regardless of
    // result-set size.
    const userIds = advisors.map((a) => a.userId).filter(Boolean)
    const expertiseByUser = new Map<string, string[]>()
    if (userIds.length > 0) {
      const expertiseRows = await prisma.advisorExpertise.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, specialization: true },
      })
      for (const row of expertiseRows) {
        const arr = expertiseByUser.get(row.userId) ?? []
        arr.push(row.specialization)
        expertiseByUser.set(row.userId, arr)
      }
    }

    // Specialization filter is post-fetch (the embedded query was the same).
    // Acceptable at MVP volumes; revisit if advisor count gets large.
    let filtered = advisors
    if (specialization) {
      filtered = filtered.filter((advisor) => {
        const tags = expertiseByUser.get(advisor.userId) ?? []
        return tags.some((t) => t.toLowerCase().includes(specialization))
      })
    }

    // Map Prisma camelCase back to snake_case for API compatibility.
    const formattedAdvisors = filtered.map((advisor) => ({
      id: advisor.id,
      user_id: advisor.userId,
      display_name: advisor.displayName,
      phone_number: advisor.phoneNumber,
      date_of_birth: advisor.dateOfBirth,
      gender: advisor.gender,
      company_name: advisor.companyName,
      designation: advisor.designation,
      pan_number: advisor.panNumber,
      gst_number: advisor.gstNumber,
      address_line1: advisor.addressLine1,
      address_line2: advisor.addressLine2,
      city: advisor.city,
      state: advisor.state,
      pincode: advisor.pincode,
      website_url: advisor.websiteUrl,
      bio: advisor.bio,
      profile_image_url: advisor.profileImageUrl,
      workflow_status: advisor.workflowStatus,
      approved_by: advisor.approvedBy,
      approved_at: advisor.approvedAt,
      is_verified: advisor.isVerified,
      verified_at: advisor.verifiedAt,
      follower_count: advisor.followerCount ?? 0,
      created_at: advisor.createdAt,
      updated_at: advisor.updatedAt,
      expertise: expertiseByUser.get(advisor.userId) ?? [],
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
