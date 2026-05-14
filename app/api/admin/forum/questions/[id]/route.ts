import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// DELETE /api/admin/forum/questions/:id
// Hard-delete a question and (via Cascade FKs on ForumAnswer +
// ForumQuestionAdvisorTag) its answers and tag rows. Reserved for clearly-
// off-topic / abusive content; the soft "lock" path on /lock is the usual
// moderation primitive and preserves the discussion as historical record.

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const before = await prisma.forumQuestion.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, authorId: true },
  })
  if (!before) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'forum.question.delete',
    targetType: 'forum_question',
    targetId: before.id,
    metadata: { title: before.title, author_id: before.authorId },
  })

  await prisma.forumQuestion.delete({ where: { id: before.id } })

  return NextResponse.json({ success: true })
}
