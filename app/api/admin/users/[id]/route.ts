import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { recordAdminAudit } from '@/lib/admin-audit'

// GET /api/admin/users/[id]
// Detail view: user core, profile (investor or advisor), role assignments,
// recent audit entries (last 25, scoped to this user as the target).
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission('manage_users')
    if ('error' in auth) return auth.error

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        disabledAt: true,
        disabledBy: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            createdAt: true,
            role: { select: { id: true, name: true, description: true } },
          },
        },
        investorProfile: {
          select: {
            displayName: true,
            phoneNumber: true,
            city: true,
            state: true,
            riskProfile: true,
          },
        },
        advisorProfile: {
          select: {
            displayName: true,
            companyName: true,
            designation: true,
            workflowStatus: true,
            isVerified: true,
            followerCount: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recentAudits = await prisma.adminAudit.findMany({
      where: { targetType: 'user', targetId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, email: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        email_verified: user.emailVerified,
        disabled_at: user.disabledAt,
        disabled_by: user.disabledBy,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        roles: user.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          assigned_at: ur.createdAt,
        })),
        investor_profile: user.investorProfile,
        advisor_profile: user.advisorProfile,
        recent_audits: recentAudits.map((a) => ({
          id: a.id,
          action: a.action,
          metadata: a.metadata,
          created_at: a.createdAt,
          actor: a.actor,
        })),
      },
    })
  } catch (error) {
    console.error('admin/users/[id] GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id]
//
// Hard-delete a user. Most relations cascade via the schema (UserRole,
// AdvisorProfile, Articles, Forum content, Subscriptions, etc. all
// onDelete: Cascade) so a single delete fans out across the user's
// footprint. Use sparingly — disable + retain is the soft path; this is
// reserved for genuine data-deletion requests (BRD §13.3 right-to-delete).
//
// Guards: actor cannot delete themselves; the last admin cannot be deleted
// (would leave the system unrecoverable).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission('manage_users')
    if ('error' in auth) return auth.error

    if (params.id === auth.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        userRoles: { select: { role: { select: { name: true } } } },
      },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = target.userRoles.some((ur) => ur.role.name === 'admin')
    if (isAdmin) {
      const adminCount = await prisma.userRole.count({
        where: { role: { name: 'admin' } },
      })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 409 }
        )
      }
    }

    // Audit BEFORE delete so the FK to actor still resolves (target row will
    // be gone after the delete, but adminAudit.targetId is a string, not an
    // FK, so the trail survives).
    await recordAdminAudit({
      actorUserId: auth.user.id,
      action: 'user.delete',
      targetType: 'user',
      targetId: target.id,
      metadata: {
        target_email: target.email,
        target_name: target.name,
        roles: target.userRoles.map((ur) => ur.role.name),
      },
    })

    await prisma.user.delete({ where: { id: target.id } })

    return NextResponse.json({
      success: true,
      message: `User ${target.email} deleted`,
    })
  } catch (error) {
    console.error('admin/users/[id] DELETE error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
