import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/admin/kyc?status=pending|all
// Admin queue of KYC records awaiting verification (BRD §12.4).

export async function GET(request: NextRequest) {
  const auth = await requirePermission('manage_users')
  if ('error' in auth) return auth.error

  const status = request.nextUrl.searchParams.get('status') ?? 'pending'
  const where: Record<string, unknown> = {}
  if (status === 'pending') where.status = 'PENDING'

  const records = await prisma.kycRecord.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  })

  return NextResponse.json({
    success: true,
    records: records.map((r) => ({
      id: r.id,
      userId: r.userId,
      panLast4: r.panLast4,
      aadhaarLast4: r.aadhaarLast4,
      fullNameOnPan: r.fullNameOnPan,
      status: r.status,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      verifiedAt: r.verifiedAt,
      user: r.user,
    })),
  })
}
