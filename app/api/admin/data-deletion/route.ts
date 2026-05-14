import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/admin/data-deletion?status=pending|all
// Admin queue of right-to-delete requests (BRD §13.3).

export async function GET(request: NextRequest) {
  const auth = await requirePermission('manage_users')
  if ('error' in auth) return auth.error

  const status = request.nextUrl.searchParams.get('status') ?? 'pending'
  const where: Record<string, unknown> = {}
  if (status === 'pending') where.status = 'PENDING'

  const requests = await prisma.dataDeletionRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
      reviewer: { select: { id: true, email: true, name: true } },
    },
  })

  return NextResponse.json({
    success: true,
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      reason: r.reason,
      reviewerNote: r.reviewerNote,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      completedAt: r.completedAt,
      user: r.user,
      reviewer: r.reviewer,
    })),
  })
}
