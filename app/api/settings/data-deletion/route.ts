import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// User-side right-to-delete (BRD §13.3).
//   POST  - submit a deletion request
//   GET   - see my own requests + their statuses
//
// We do NOT delete the account on POST. An admin reviews, and the existing
// user.delete admin path (with last-admin guard etc.) does the actual hard
// delete. This protects against accidental loss + lets us check for tax-
// retention obligations before we drop rows.

const postSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Reject if there's already a PENDING request — duplicates cause queue
  // confusion and the user can edit / withdraw the existing one (withdraw
  // path is a follow-up; for now they just wait).
  const existing = await prisma.dataDeletionRequest.findFirst({
    where: { userId: user.id, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json(
      {
        error: 'You already have a pending deletion request.',
        request: { id: existing.id, createdAt: existing.createdAt },
      },
      { status: 409 },
    )
  }

  const created = await prisma.dataDeletionRequest.create({
    data: {
      userId: user.id,
      reason: parsed.data.reason?.trim() || null,
    },
  })

  return NextResponse.json({
    success: true,
    request: { id: created.id, status: created.status, createdAt: created.createdAt },
  })
}

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const requests = await prisma.dataDeletionRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      reason: true,
      reviewerNote: true,
      createdAt: true,
      reviewedAt: true,
      completedAt: true,
    },
  })

  return NextResponse.json({ success: true, requests })
}
