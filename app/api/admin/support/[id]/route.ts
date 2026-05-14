import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST /api/admin/support/:id
//   body: { action: 'resolve' | 'reopen', note?: string }

const bodySchema = z.object({
  action: z.enum(['resolve', 'reopen']),
  note: z.string().trim().max(2000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const req = await prisma.supportRequest.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, contactEmail: true, subject: true },
  })
  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const now = new Date()
  if (parsed.data.action === 'resolve') {
    await prisma.supportRequest.update({
      where: { id: req.id },
      data: {
        status: 'RESOLVED',
        resolverId: auth.user.id,
        resolverNote: parsed.data.note?.trim() || null,
        resolvedAt: now,
      },
    })
    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'support.resolve',
      targetType: 'support_request',
      targetId: req.id,
      metadata: { contact_email: req.contactEmail, subject: req.subject },
    })
    return NextResponse.json({ success: true, status: 'RESOLVED' })
  }

  // reopen
  await prisma.supportRequest.update({
    where: { id: req.id },
    data: {
      status: 'OPEN',
      resolvedAt: null,
    },
  })
  return NextResponse.json({ success: true, status: 'OPEN' })
}
