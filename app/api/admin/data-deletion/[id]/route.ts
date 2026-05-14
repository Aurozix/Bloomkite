import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST /api/admin/data-deletion/:id
//   body: { action: 'approve' | 'reject' | 'complete', note?: string }
//
// Workflow per BRD §13.3:
//   approve  - PENDING → APPROVED (request acknowledged; deletion to follow)
//   reject   - PENDING → REJECTED (with required note)
//   complete - APPROVED → COMPLETED + actually delete the user row
//
// We split approve and complete so a human can do the final irreversible
// step in a separate keystroke. complete cascades via the existing User FKs
// (most are onDelete: Cascade); tax-relevant rows (invoices, audit log
// entries linking the user as actor) are retained — invoices via NoAction
// FK in this case isn't right (subscriptions cascade so invoices cascade
// too). The honest position: this commit ships the request workflow + the
// admin "complete" wired to the same hard-delete as /admin/users — a
// follow-up will add the 7-year retention split for invoice data.

const bodySchema = z.object({
  action: z.enum(['approve', 'reject', 'complete']),
  note: z.string().trim().max(2000).optional(),
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
  if (parsed.data.action === 'reject' && !parsed.data.note?.trim()) {
    return NextResponse.json({ error: 'note required when rejecting' }, { status: 400 })
  }

  const req = await prisma.dataDeletionRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { id: true, email: true } },
    },
  })
  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Self-action guards.
  if (req.userId === auth.user.id) {
    return NextResponse.json(
      { error: 'You cannot review your own deletion request' },
      { status: 400 },
    )
  }

  const now = new Date()

  if (parsed.data.action === 'approve') {
    if (req.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot approve from status ${req.status}` },
        { status: 409 },
      )
    }
    await prisma.dataDeletionRequest.update({
      where: { id: req.id },
      data: {
        status: 'APPROVED',
        reviewerId: auth.user.id,
        reviewerNote: parsed.data.note?.trim() || null,
        reviewedAt: now,
      },
    })
    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'data_deletion.approve',
      targetType: 'data_deletion_request',
      targetId: req.id,
      metadata: { user_id: req.userId, target_email: req.user.email },
    })
    return NextResponse.json({ success: true, status: 'APPROVED' })
  }

  if (parsed.data.action === 'reject') {
    if (req.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot reject from status ${req.status}` },
        { status: 409 },
      )
    }
    await prisma.dataDeletionRequest.update({
      where: { id: req.id },
      data: {
        status: 'REJECTED',
        reviewerId: auth.user.id,
        reviewerNote: parsed.data.note!.trim(),
        reviewedAt: now,
      },
    })
    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'data_deletion.reject',
      targetType: 'data_deletion_request',
      targetId: req.id,
      metadata: { user_id: req.userId, reason: parsed.data.note },
    })
    return NextResponse.json({ success: true, status: 'REJECTED' })
  }

  // complete — perform the actual deletion.
  if (req.status !== 'APPROVED') {
    return NextResponse.json(
      { error: `Cannot complete from status ${req.status}; approve first.` },
      { status: 409 },
    )
  }

  // Audit BEFORE the cascade so the trail survives — admin_audit.actor uses
  // NoAction FK so the row survives even when the actor is the user being
  // deleted (which can't happen here per the self-action guard above, but
  // the property holds in general). The request row itself cascades away
  // with the user; the audit row is the canonical historical record.
  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'data_deletion.complete',
    targetType: 'user',
    targetId: req.userId,
    metadata: {
      target_email: req.user.email,
      via: 'data_deletion_request',
      request_id: req.id,
      request_created_at: now.toISOString(),
    },
  })

  await prisma.user.delete({ where: { id: req.userId } })

  return NextResponse.json({ success: true, status: 'COMPLETED' })
}
