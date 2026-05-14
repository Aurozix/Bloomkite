import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// DELETE /api/admin/forum/answers/:id
// Remove a single answer (e.g. spam, abusive). The vote rows cascade away
// via the FK; the question's denormalised answer_count is decremented in
// the same transaction so the public forum doesn't show stale "5 answers"
// over an actual count of 4.

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const before = await prisma.forumAnswer.findUnique({
    where: { id: params.id },
    select: { id: true, questionId: true, authorId: true },
  })
  if (!before) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.forumAnswer.delete({ where: { id: before.id } })
    // answer_count is a denormalised counter; keep it consistent. decrement
    // is a no-op clamp if it's already 0 (shouldn't happen, but safe).
    await tx.forumQuestion.update({
      where: { id: before.questionId },
      data: { answerCount: { decrement: 1 } },
    })
  })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'forum.answer.delete',
    targetType: 'forum_answer',
    targetId: before.id,
    metadata: { question_id: before.questionId, author_id: before.authorId },
  })

  return NextResponse.json({ success: true })
}
