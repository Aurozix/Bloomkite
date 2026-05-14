import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireRole } from '@/lib/auth-helpers'
import { recordAdminAudit } from '@/lib/admin-audit'
import { getDomain } from '@/lib/admin-master-data'

// PATCH /api/admin/master-data/:domain/:id
//   Update name / description / sortOrder. Slug is intentionally NOT editable
//   from the admin UI — code (e.g. account-type lookups) hard-codes slugs and
//   renaming would silently break runtime lookups.
//
// DELETE /api/admin/master-data/:domain/:id
//   Soft-delete = set isActive=false. The public read view filters on it,
//   so deactivated rows immediately disappear from picker dropdowns while
//   historical FK references on advisor_products etc. continue to resolve.
//
// POST /api/admin/master-data/:domain/:id?action=reactivate
//   Flip isActive back to true.

const patchSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(99999).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { domain: string; id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const spec = getDomain(params.domain)
  if (!spec) {
    return NextResponse.json({ error: 'Unknown domain' }, { status: 404 })
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const before = (await spec.delegate.findUnique({ where: { id: params.id } })) as
    | { id: string; slug: string; name: string }
    | null
  if (!before) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 })
  }

  // Only build the update payload from explicitly-set fields so callers can
  // PATCH a single column without nulling out the others.
  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.description !== undefined)
    data.description = parsed.data.description || null
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: true, data: before, noChange: true })
  }

  const updated = (await spec.delegate.update({
    where: { id: params.id },
    data,
  })) as { id: string }

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'master_data.update',
    targetType: 'master_data',
    targetId: updated.id,
    metadata: { domain: params.domain, slug: before.slug, changes: data },
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { domain: string; id: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const spec = getDomain(params.domain)
  if (!spec) {
    return NextResponse.json({ error: 'Unknown domain' }, { status: 404 })
  }

  const before = (await spec.delegate.findUnique({ where: { id: params.id } })) as
    | { id: string; slug: string; isActive: boolean }
    | null
  if (!before) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 })
  }
  if (!before.isActive) {
    return NextResponse.json({ success: true, alreadyInactive: true })
  }

  await spec.delegate.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'master_data.deactivate',
    targetType: 'master_data',
    targetId: before.id,
    metadata: { domain: params.domain, slug: before.slug },
  })

  return NextResponse.json({ success: true })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string; id: string } }
) {
  // Reactivate path. Kept as a POST with ?action=reactivate so DELETE remains
  // the canonical "remove" verb.
  const action = new URL(request.url).searchParams.get('action')
  if (action !== 'reactivate') {
    return NextResponse.json(
      { error: 'Unknown action; supported: ?action=reactivate' },
      { status: 400 }
    )
  }

  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const spec = getDomain(params.domain)
  if (!spec) {
    return NextResponse.json({ error: 'Unknown domain' }, { status: 404 })
  }

  const before = (await spec.delegate.findUnique({ where: { id: params.id } })) as
    | { id: string; slug: string; isActive: boolean }
    | null
  if (!before) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 })
  }
  if (before.isActive) {
    return NextResponse.json({ success: true, alreadyActive: true })
  }

  await spec.delegate.update({
    where: { id: params.id },
    data: { isActive: true },
  })

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: 'master_data.reactivate',
    targetType: 'master_data',
    targetId: before.id,
    metadata: { domain: params.domain, slug: before.slug },
  })

  return NextResponse.json({ success: true })
}
