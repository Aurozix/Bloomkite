import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST /api/admin/kyc/:id
//   body: { action: 'verify' | 'reject', reason?: string }

const bodySchema = z.object({
  action: z.enum(['verify', 'reject']),
  reason: z.string().trim().max(2000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requirePermission('manage_users')
  if ('error' in auth) return auth.error

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  if (parsed.data.action === 'reject' && !parsed.data.reason?.trim()) {
    return NextResponse.json({ error: 'reason required when rejecting' }, { status: 400 })
  }

  const record = await prisma.kycRecord.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, status: true },
  })
  if (!record) {
    return NextResponse.json({ error: 'KYC record not found' }, { status: 404 })
  }

  const now = new Date()
  if (parsed.data.action === 'verify') {
    await prisma.kycRecord.update({
      where: { id: record.id },
      data: {
        status: 'VERIFIED',
        verifiedById: auth.user.id,
        verifiedAt: now,
        rejectionReason: null,
      },
    })
    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'kyc.verify',
      targetType: 'kyc_record',
      targetId: record.id,
      metadata: { user_id: record.userId },
    })
    return NextResponse.json({ success: true, status: 'VERIFIED' })
  }

  await prisma.kycRecord.update({
    where: { id: record.id },
    data: {
      status: 'REJECTED',
      verifiedById: auth.user.id,
      verifiedAt: now,
      rejectionReason: parsed.data.reason!.trim(),
    },
  })
  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'kyc.reject',
    targetType: 'kyc_record',
    targetId: record.id,
    metadata: { user_id: record.userId, reason: parsed.data.reason },
  })
  return NextResponse.json({ success: true, status: 'REJECTED' })
}
