import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/admin/forum/questions
//   ?status=open|closed|all
//   ?q=<title-or-content-fragment>
//   ?page=N&limit=N
//
// Admin moderation list — includes closed questions (hidden from the
// public forum) and shows answer counts so moderators can prioritise.

export async function GET(request: NextRequest) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const sp = request.nextUrl.searchParams
  const statusFilter = sp.get('status') || 'all'
  const q = sp.get('q')?.trim()
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '25', 10)))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (statusFilter === 'open') where.status = 'open'
  if (statusFilter === 'closed') where.status = 'closed'
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.forumQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, email: true, name: true } },
        _count: { select: { answers: true, taggedAdvisors: true } },
      },
    }),
    prisma.forumQuestion.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: data.map((q) => ({
      id: q.id,
      title: q.title,
      content: q.content.slice(0, 400),
      status: q.status,
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      answer_count: q._count.answers,
      tagged_advisor_count: q._count.taggedAdvisors,
      author: q.author
        ? { id: q.author.id, email: q.author.email, name: q.author.name }
        : null,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
}
