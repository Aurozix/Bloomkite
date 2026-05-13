import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'
import { invalidateAIFeatureCache } from '@/lib/ai-features'

// POST /api/admin/ai-features/[slug]/toggle
//   body: { enabled: boolean }
//
// Flip the on/off state. Idempotent: setting to the current state is a no-op
// (no audit row, no cache invalidation). Audit row written on real change.
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await requirePermission('manage_ai_features')
    if ('error' in auth) return auth.error

    const body = (await request.json().catch(() => null)) as { enabled?: boolean } | null
    if (!body || typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'body must include { enabled: boolean }' },
        { status: 400 }
      )
    }

    const feature = await prisma.aIFeature.findUnique({
      where: { slug: params.slug },
    })
    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    if (feature.isEnabled === body.enabled) {
      return NextResponse.json({
        success: true,
        message: `Already ${body.enabled ? 'enabled' : 'disabled'}`,
        data: { slug: feature.slug, is_enabled: feature.isEnabled },
      })
    }

    const updated = await prisma.aIFeature.update({
      where: { slug: params.slug },
      data: {
        isEnabled: body.enabled,
        updatedBy: auth.user.id,
      },
    })

    invalidateAIFeatureCache(params.slug)

    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'ai_feature.toggle',
      targetType: 'ai_feature',
      targetId: feature.slug,
      metadata: {
        before: { is_enabled: feature.isEnabled },
        after: { is_enabled: updated.isEnabled },
        feature_name: feature.name,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Feature ${updated.isEnabled ? 'enabled' : 'disabled'}`,
      data: { slug: updated.slug, is_enabled: updated.isEnabled },
    })
  } catch (error) {
    console.error('admin/ai-features toggle POST error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
