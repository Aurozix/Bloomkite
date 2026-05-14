import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/admin/audit
//   ?actor=<user-id>      — filter to actions by one admin
//   ?action=<verb>        — exact match on the dot-separated action verb
//   ?targetType=<type>    — 'user' | 'plan' | 'master_data' | ...
//   ?targetId=<id>        — opaque string match
//   ?from=<iso-date>      — created_at >= from
//   ?to=<iso-date>        — created_at < to (exclusive)
//   ?page=N&limit=N
//
// BRD §8.5 + §13.2 audit trail. Append-only by convention; this read-only
// endpoint is the compliance-officer-friendly view.

export async function GET(request: NextRequest) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const sp = request.nextUrl.searchParams
  const actor = sp.get('actor')?.trim()
  const action = sp.get('action')?.trim()
  const targetType = sp.get('targetType')?.trim()
  const targetId = sp.get('targetId')?.trim()
  const fromRaw = sp.get('from')?.trim()
  const toRaw = sp.get('to')?.trim()
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '50', 10)))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (actor) where.actorUserId = actor
  if (action) where.action = action
  if (targetType) where.targetType = targetType
  if (targetId) where.targetId = targetId

  if (fromRaw || toRaw) {
    const range: Record<string, Date> = {}
    if (fromRaw) {
      const d = new Date(fromRaw)
      if (!isNaN(d.getTime())) range.gte = d
    }
    if (toRaw) {
      const d = new Date(toRaw)
      if (!isNaN(d.getTime())) range.lt = d
    }
    if (Object.keys(range).length > 0) where.createdAt = range
  }

  const [rows, total] = await Promise.all([
    prisma.adminAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.adminAudit.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      action: r.action,
      target_type: r.targetType,
      target_id: r.targetId,
      metadata: r.metadata,
      created_at: r.createdAt,
      actor: r.actor
        ? { id: r.actor.id, email: r.actor.email, name: r.actor.name }
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
