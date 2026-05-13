import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST /api/admin/users/[id]/disable
//   body: { enable?: boolean }   // pass enable:true to re-enable
//
// Soft-disables (or re-enables) a user account. Disabled accounts cannot
// sign in — see the signIn callback in auth.ts. Writes an audit row in both
// directions. The acting admin cannot disable their own account; that's a
// trivial foot-gun and the UI should not surface the option, but we guard
// here too.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission('manage_users')
    if ('error' in auth) return auth.error

    if (params.id === auth.user.id) {
      return NextResponse.json(
        { error: 'You cannot disable your own account' },
        { status: 400 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as { enable?: boolean }
    const enable = body.enable === true

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, disabledAt: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const wasDisabled = target.disabledAt != null
    if (enable && !wasDisabled) {
      return NextResponse.json({ success: true, message: 'Already enabled' })
    }
    if (!enable && wasDisabled) {
      return NextResponse.json({ success: true, message: 'Already disabled' })
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: enable
        ? { disabledAt: null, disabledBy: null }
        : { disabledAt: new Date(), disabledBy: auth.user.id },
      select: { id: true, disabledAt: true },
    })

    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: enable ? 'user.enable' : 'user.disable',
      targetType: 'user',
      targetId: target.id,
      metadata: {
        before: { disabled_at: target.disabledAt },
        after: { disabled_at: updated.disabledAt },
        target_email: target.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: enable ? 'User enabled' : 'User disabled',
      data: { id: updated.id, disabled_at: updated.disabledAt },
    })
  } catch (error) {
    console.error('admin/users/[id]/disable POST error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
