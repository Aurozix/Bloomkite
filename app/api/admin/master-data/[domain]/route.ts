import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireRole } from '@/lib/auth-helpers'
import { recordAdminAudit } from '@/lib/admin-audit'
import { getDomain, listDomains } from '@/lib/admin-master-data'

// GET /api/admin/master-data/:domain
//   Returns ALL rows (active + inactive) for the admin CRUD UI. Differs from
//   the public /api/master-data/:domain (auth-required, active-only).
//
// POST /api/admin/master-data/:domain
//   Create a new row. Slug uniqueness enforced by the DB. Returns 409 on
//   conflict so the UI can show a clear error.

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(99999).default(0),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const spec = getDomain(params.domain)
  if (!spec) {
    return NextResponse.json(
      { error: 'Unknown domain', valid: listDomains().map((d) => d.slug) },
      { status: 404 }
    )
  }

  const data = (await spec.delegate.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })) as Array<{
    id: string
    slug: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
    updatedAt: Date
  }>

  return NextResponse.json({ success: true, data, label: spec.label })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  const spec = getDomain(params.domain)
  if (!spec) {
    return NextResponse.json({ error: 'Unknown domain' }, { status: 404 })
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const created = (await spec.delegate.create({
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description || null,
        sortOrder: parsed.data.sortOrder,
      },
    })) as { id: string }

    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'master_data.create',
      targetType: 'master_data',
      targetId: created.id,
      metadata: {
        domain: params.domain,
        slug: parsed.data.slug,
        name: parsed.data.name,
      },
    })

    return NextResponse.json({ success: true, data: created })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'A row with this slug already exists' },
        { status: 409 }
      )
    }
    console.error('admin master-data create failed:', err)
    return NextResponse.json({ error: 'Failed to create row' }, { status: 500 })
  }
}
