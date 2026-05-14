import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/admin/support?status=open|all&category=...
// Admin queue of grievance/support requests (BRD §12.5).

export async function GET(request: NextRequest) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') ?? 'open'
  const category = sp.get('category')?.trim()
  const where: Record<string, unknown> = {}
  if (status === 'open') where.status = 'OPEN'
  if (category) where.category = category

  const requests = await prisma.supportRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true } },
      resolver: { select: { id: true, email: true, name: true } },
    },
  })

  return NextResponse.json({
    success: true,
    requests: requests.map((r) => ({
      id: r.id,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      category: r.category,
      subject: r.subject,
      body: r.body,
      status: r.status,
      resolverNote: r.resolverNote,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      user: r.user,
      resolver: r.resolver,
    })),
  })
}
