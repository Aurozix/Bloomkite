import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { isPermission } from '@/lib/plan-sharing'

// PATCH/DELETE on a single share. PATCH lets the investor change the
// permission grant (VIEW ↔ COMMENT) without re-sharing. DELETE is a soft
// revoke — we keep the row + comments for audit, just flip status to REVOKED.

const patchSchema = z.object({
  permission: z.enum(['VIEW', 'COMMENT']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; shareId: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !parsed.data.permission) {
    return NextResponse.json({ error: 'permission required' }, { status: 400 })
  }
  if (!isPermission(parsed.data.permission)) {
    return NextResponse.json({ error: 'invalid permission' }, { status: 400 })
  }

  const share = await prisma.planShare.findUnique({
    where: { id: params.shareId },
    select: { id: true, planId: true, plan: { select: { userId: true } } },
  })
  if (!share || share.planId !== params.id) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (share.plan.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.planShare.update({
    where: { id: share.id },
    data: { permission: parsed.data.permission },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; shareId: string } },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const share = await prisma.planShare.findUnique({
    where: { id: params.shareId },
    select: { id: true, planId: true, status: true, plan: { select: { userId: true } } },
  })
  if (!share || share.planId !== params.id) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (share.plan.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (share.status === 'REVOKED') {
    return NextResponse.json({ success: true, alreadyRevoked: true })
  }

  await prisma.planShare.update({
    where: { id: share.id },
    data: { status: 'REVOKED', revokedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
