import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST   /api/admin/forum/questions/:id/lock   — set status='closed'
// DELETE /api/admin/forum/questions/:id/lock   — set status='open'
//
// Locking hides the question from new answers + the public forum list (the
// public GET filters status='open'). Existing answers are preserved.

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const before = await prisma.forumQuestion.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, status: true },
  })
  if (!before) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }
  if (before.status === 'closed') {
    return NextResponse.json({ success: true, alreadyClosed: true })
  }

  await prisma.forumQuestion.update({
    where: { id: before.id },
    data: { status: 'closed' },
  })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'forum.question.lock',
    targetType: 'forum_question',
    targetId: before.id,
    metadata: { title: before.title, prior_status: before.status },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const before = await prisma.forumQuestion.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, status: true },
  })
  if (!before) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }
  if (before.status === 'open') {
    return NextResponse.json({ success: true, alreadyOpen: true })
  }

  await prisma.forumQuestion.update({
    where: { id: before.id },
    data: { status: 'open' },
  })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'forum.question.unlock',
    targetType: 'forum_question',
    targetId: before.id,
    metadata: { title: before.title, prior_status: before.status },
  })

  return NextResponse.json({ success: true })
}
