import { NextRequest, NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/admin/users
//   ?q=<email-or-name-fragment>
//   &role=<role-name>      (filter to users who hold this role)
//   &status=active|disabled (default: active)
//   &page=N&limit=N
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission('manage_users')
    if ('error' in auth) return auth.error

    const sp = request.nextUrl.searchParams
    const q = sp.get('q')?.trim() || undefined
    const role = sp.get('role')?.trim() || undefined
    const status = sp.get('status') === 'disabled' ? 'disabled' : 'active'
    const page = Math.max(parseInt(sp.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(sp.get('limit') || '25', 10), 1), 100)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      disabledAt: status === 'disabled' ? { not: null } : null,
    }
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.userRoles = { some: { role: { name: role } } }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          disabledAt: true,
          createdAt: true,
          userRoles: { select: { role: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        email_verified: u.emailVerified,
        disabled_at: u.disabledAt,
        created_at: u.createdAt,
        roles: u.userRoles.map((ur) => ur.role.name),
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('admin/users GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
