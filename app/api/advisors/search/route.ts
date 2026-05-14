import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// Faceted advisor search (BRD §3.4 / §5).
//
// Query params:
//   q                  — full-text contains over name/company/bio (case-insens)
//   city               — exact match (case-insensitive)
//   specialization     — substring match on advisor_expertise.specialization
//   product            — repeatable; product UUID. Matches advisors whose
//                        advisor_products carries the row.
//   service            — repeatable; service UUID.
//   brand              — repeatable; brand UUID.
//   sort               — 'rating' | 'followers' | 'newest' (default newest).
//                        rating uses (ratingAverage DESC NULLS LAST,
//                        ratingCount DESC) so unrated advisors aren't ahead
//                        of mid-rated ones.
//   page, limit        — pagination
//
// Multi-value facets are AND across dimensions, OR within one dimension
// (e.g. product=A&product=B → "offers A OR B"; product=A&service=X →
// "offers A AND service X"). This matches the affordance the sidebar UI
// gives the user: ticking two products in one panel widens the result;
// ticking across panels narrows it.

const collectMulti = (sp: URLSearchParams, key: string): string[] => {
  const values = sp.getAll(key)
  // Allow comma-separated as a fallback shape for clients that prefer it.
  return Array.from(
    new Set(
      values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean),
    ),
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase().trim()
    const city = searchParams.get('city')?.toLowerCase().trim()
    const specialization = searchParams.get('specialization')?.toLowerCase().trim()
    const productIds = collectMulti(searchParams, 'product')
    const serviceIds = collectMulti(searchParams, 'service')
    const brandIds = collectMulti(searchParams, 'brand')
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {
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
      where.city = { equals: city, mode: 'insensitive' }
    }

    // Facet AND-across-dimensions, OR-within-dimension. Each non-empty facet
    // becomes a `user: { advisor<X>s: { some: { <Y>Id: { in: [...] } } } }`
    // — Prisma compiles to a correlated EXISTS subquery on the join table.
    const userAnd: Array<Record<string, unknown>> = []
    if (productIds.length > 0) {
      userAnd.push({ advisorProducts: { some: { productId: { in: productIds } } } })
    }
    if (serviceIds.length > 0) {
      userAnd.push({ advisorServices: { some: { serviceId: { in: serviceIds } } } })
    }
    if (brandIds.length > 0) {
      userAnd.push({ advisorBrands: { some: { brandId: { in: brandIds } } } })
    }
    if (specialization) {
      userAnd.push({
        advisorExpertise: {
          some: { specialization: { contains: specialization, mode: 'insensitive' } },
        },
      })
    }
    if (userAnd.length > 0) {
      where.user = { AND: userAnd }
    }

    // Sort branches all carry a deterministic createdAt tiebreaker so equal
    // primaries produce stable pagination.
    const orderBy: Array<Record<string, unknown>> =
      sort === 'rating'
        ? [
            { ratingAverage: { sort: 'desc', nulls: 'last' } },
            { ratingCount: 'desc' },
            { createdAt: 'desc' },
          ]
        : sort === 'followers'
          ? [{ followerCount: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }]

    const [advisors, count] = await Promise.all([
      prisma.advisorProfile.findMany({
        where: where as never,
        orderBy: orderBy as never,
        skip: offset,
        take: limit,
      }),
      prisma.advisorProfile.count({ where: where as never }),
    ])

    // Batch-fetch expertise for the visible advisors. One query.
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

    const formattedAdvisors = advisors.map((advisor) => ({
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
      rating_count: advisor.ratingCount ?? 0,
      rating_average: advisor.ratingAverage ? Number(advisor.ratingAverage) : null,
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
      facets: {
        // Echo the applied facet selection so the UI can reconcile its state
        // with the URL on first paint.
        productIds,
        serviceIds,
        brandIds,
        specialization: specialization || null,
        city: city || null,
        q: q || null,
        sort,
      },
    })
  } catch (error) {
    console.error('Advisor search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
