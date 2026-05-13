import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// POST /api/admin/users/[id]/roles
//   body: { action: 'add' | 'remove', roleName: string }
//
// Add or remove a single role assignment. Both directions are idempotent
// (re-adding an existing role or removing a missing one is a no-op).
//
// Removing the last admin role from the only-remaining admin would leave the
// system unrecoverable, so we guard against it: if the target is the only
// user with the 'admin' role, removing 'admin' fails with 409.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission('manage_users')
    if ('error' in auth) return auth.error

    const body = (await request.json().catch(() => null)) as {
      action?: 'add' | 'remove'
      roleName?: string
    } | null

    if (!body || (body.action !== 'add' && body.action !== 'remove') || !body.roleName) {
      return NextResponse.json(
        { error: 'Body must include { action: "add" | "remove", roleName: string }' },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = await prisma.role.findUnique({
      where: { name: body.roleName },
      select: { id: true, name: true },
    })
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: target.id, roleId: role.id } },
      select: { id: true },
    })

    if (body.action === 'add') {
      if (existing) {
        return NextResponse.json({ success: true, message: 'Role already assigned' })
      }
      await prisma.userRole.create({
        data: { userId: target.id, roleId: role.id },
      })
      await recordAdminAudit({
        actorUserId: auth.user.id,
        action: 'user.role.add',
        targetType: 'user',
        targetId: target.id,
        metadata: { role: role.name, target_email: target.email },
      })
      return NextResponse.json({ success: true, message: `Role '${role.name}' added` })
    }

    // remove
    if (!existing) {
      return NextResponse.json({ success: true, message: 'Role not assigned' })
    }

    if (role.name === 'admin') {
      const adminCount = await prisma.userRole.count({
        where: { role: { name: 'admin' } },
      })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin' },
          { status: 409 }
        )
      }
    }

    await prisma.userRole.delete({ where: { id: existing.id } })
    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'user.role.remove',
      targetType: 'user',
      targetId: target.id,
      metadata: { role: role.name, target_email: target.email },
    })
    return NextResponse.json({ success: true, message: `Role '${role.name}' removed` })
  } catch (error) {
    console.error('admin/users/[id]/roles POST error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
