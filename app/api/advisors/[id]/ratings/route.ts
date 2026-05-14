import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser, requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { isValidStars, RATING_MAX, RATING_MIN } from '@/lib/advisor-engagement'

// BRD §7.1 high-priority. One rating per (investor, advisor) pair — the
// upsert path lets investors edit their stars or review without juggling
// "have I rated yet?" state in the UI. Aggregates on advisor_profiles
// (ratingCount / ratingAverage) are recomputed inside the same transaction
// as the write so the public profile card is always exact. Eligibility is
// intentionally permissive at MVP (any signed-in non-self user) — see the
// schema doc on AdvisorRating for the eligibility-tightening rationale.

const upsertSchema = z.object({
  stars: z.number().int().min(RATING_MIN).max(RATING_MAX),
  reviewBody: z.string().trim().max(4000).optional().nullable(),
})

async function recomputeAdvisorAggregate(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  advisorId: string,
) {
  // Aggregate from canonical source. _avg returns Decimal | null when count
  // is 0; we coerce to a 2-decimal-string for storage as DECIMAL(3,2).
  const agg = await tx.advisorRating.aggregate({
    where: { advisorId },
    _count: true,
    _avg: { stars: true },
  })
  const avgRaw = agg._avg.stars
  const avg =
    avgRaw === null || avgRaw === undefined
      ? null
      : Number(Number(avgRaw).toFixed(2))

  // Update by userId — the AdvisorProfile FK target. Use updateMany so a
  // missing profile (shouldn't happen for an approved advisor, but defensive)
  // doesn't 500 the rating write.
  await tx.advisorProfile.updateMany({
    where: { userId: advisorId },
    data: {
      ratingCount: agg._count,
      ratingAverage: avg as never,
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const advisorId = params.id

  // Profile snapshot for the rating card: aggregate + recent reviews. Any
  // signed-in user can read; ratings are public to support advisor discovery.
  const profile = await prisma.advisorProfile.findUnique({
    where: { userId: advisorId },
    select: { ratingCount: true, ratingAverage: true },
  })
  if (!profile) {
    return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
  }

  const ratings = await prisma.advisorRating.findMany({
    where: { advisorId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      investor: {
        select: {
          id: true,
          name: true,
          email: true,
          investorProfile: { select: { displayName: true, city: true } },
        },
      },
    },
  })

  const currentUser = await getCurrentUser()
  const myRating = currentUser
    ? ratings.find((r) => r.investorId === currentUser.id)
    : undefined

  return NextResponse.json({
    success: true,
    summary: {
      ratingCount: profile.ratingCount,
      ratingAverage: profile.ratingAverage ? Number(profile.ratingAverage) : null,
    },
    ratings: ratings.map((r) => ({
      id: r.id,
      stars: r.stars,
      reviewBody: r.reviewBody,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      investorId: r.investorId,
      investorName:
        r.investor.investorProfile?.displayName ||
        r.investor.name ||
        r.investor.email,
      investorCity: r.investor.investorProfile?.city ?? null,
    })),
    myRating: myRating
      ? {
          id: myRating.id,
          stars: myRating.stars,
          reviewBody: myRating.reviewBody,
          updatedAt: myRating.updatedAt,
        }
      : null,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const advisorId = params.id
  if (advisorId === user.id) {
    return NextResponse.json(
      { error: 'You cannot rate yourself' },
      { status: 400 },
    )
  }

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  if (!isValidStars(parsed.data.stars)) {
    return NextResponse.json({ error: 'stars must be 1..5' }, { status: 400 })
  }

  const advisorProfile = await prisma.advisorProfile.findUnique({
    where: { userId: advisorId },
    select: { workflowStatus: true },
  })
  if (!advisorProfile) {
    return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
  }
  if (advisorProfile.workflowStatus !== 'approved') {
    return NextResponse.json(
      { error: 'Advisor is not yet approved for ratings' },
      { status: 400 },
    )
  }

  const reviewBody = parsed.data.reviewBody?.trim() || null

  const result = await prisma.$transaction(async (tx) => {
    const upserted = await tx.advisorRating.upsert({
      where: { investorId_advisorId: { investorId: user.id, advisorId } },
      update: { stars: parsed.data.stars, reviewBody },
      create: {
        advisorId,
        investorId: user.id,
        stars: parsed.data.stars,
        reviewBody,
      },
    })
    await recomputeAdvisorAggregate(tx, advisorId)
    return upserted
  })

  return NextResponse.json({
    success: true,
    rating: {
      id: result.id,
      stars: result.stars,
      reviewBody: result.reviewBody,
      updatedAt: result.updatedAt,
    },
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const advisorId = params.id
  await prisma.$transaction(async (tx) => {
    await tx.advisorRating.deleteMany({
      where: { investorId: user.id, advisorId },
    })
    await recomputeAdvisorAggregate(tx, advisorId)
  })

  return NextResponse.json({ success: true })
}
