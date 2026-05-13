import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// GET /api/admin/ai-features
// Returns all features grouped by category.
export async function GET(_request: NextRequest) {
  try {
    const auth = await requirePermission('manage_ai_features')
    if ('error' in auth) return auth.error

    const features = await prisma.aIFeature.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Bucket by category for the admin UI.
    const grouped: Record<string, typeof features> = {}
    for (const f of features) {
      const key = f.category
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(f)
    }

    return NextResponse.json({
      success: true,
      data: features.map((f) => ({
        slug: f.slug,
        category: f.category,
        name: f.name,
        description: f.description,
        is_enabled: f.isEnabled,
        updated_at: f.updatedAt,
        updated_by: f.updatedBy,
      })),
      grouped,
    })
  } catch (error) {
    console.error('admin/ai-features GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/ai-features
//   body: { slug, category, name, description }
//
// Register a new AI feature. Default `is_enabled = false` — see schema docs.
// Slug is the immutable identifier; if it already exists, returns 409.
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission('manage_ai_features')
    if ('error' in auth) return auth.error

    const body = (await request.json().catch(() => null)) as {
      slug?: string
      category?: string
      name?: string
      description?: string
    } | null

    if (!body?.slug || !body.category || !body.name || !body.description) {
      return NextResponse.json(
        { error: 'slug, category, name, description are all required' },
        { status: 400 }
      )
    }

    const slug = body.slug.trim().toLowerCase()
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'slug must be lowercase letters, digits, and hyphens only' },
        { status: 400 }
      )
    }

    const existing = await prisma.aIFeature.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A feature with this slug already exists' },
        { status: 409 }
      )
    }

    const created = await prisma.aIFeature.create({
      data: {
        slug,
        category: body.category.trim(),
        name: body.name.trim(),
        description: body.description.trim(),
        // isEnabled defaults to false in the schema
        updatedBy: auth.user.id,
      },
    })

    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'ai_feature.create',
      targetType: 'ai_feature',
      targetId: created.slug,
      metadata: {
        category: created.category,
        name: created.name,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        slug: created.slug,
        category: created.category,
        name: created.name,
        description: created.description,
        is_enabled: created.isEnabled,
      },
    })
  } catch (error) {
    console.error('admin/ai-features POST error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
