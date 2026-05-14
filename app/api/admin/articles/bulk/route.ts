import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST /api/admin/articles/bulk
//   body: { action: 'approve' | 'reject', ids: string[], rejectionReason?: string }
//
// Bulk variant of the per-article approve/reject routes. Same gate (status
// must be 'pending' — already-published or already-rejected rows are
// silently skipped). Rejection requires a reason; one reason applies to all
// the rejected articles in this batch.

const bodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  ids: z.array(z.string().uuid()).min(1).max(200),
  rejectionReason: z.string().trim().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const ids = Array.from(new Set(parsed.data.ids))

  if (parsed.data.action === 'reject' && !parsed.data.rejectionReason?.trim()) {
    return NextResponse.json(
      { error: 'rejectionReason is required for bulk reject' },
      { status: 400 }
    )
  }

  const now = new Date()

  const result =
    parsed.data.action === 'approve'
      ? await prisma.article.updateMany({
          where: { id: { in: ids }, status: 'pending' },
          data: { status: 'published', publishedAt: now, updatedAt: now },
        })
      : await prisma.article.updateMany({
          where: { id: { in: ids }, status: 'pending' },
          data: {
            status: 'rejected',
            rejectionReason: parsed.data.rejectionReason!.trim(),
            updatedAt: now,
          },
        })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: parsed.data.action === 'approve' ? 'article.bulk_approve' : 'article.bulk_reject',
    targetType: 'article',
    // targetId is per-row; for bulk we drop it and stash the id list in
    // metadata so the audit row still tells the full story.
    metadata: {
      requested: ids,
      processed: result.count,
      rejection_reason: parsed.data.rejectionReason?.trim(),
    },
  })

  return NextResponse.json({
    success: true,
    requested: ids.length,
    processed: result.count,
    skipped: ids.length - result.count,
  })
}
