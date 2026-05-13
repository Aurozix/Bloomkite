import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('admin')
    if ('error' in auth) return auth.error

    const [totalUsers, totalAdvisors, pendingCredentials, pendingArticles] =
      await Promise.all([
        prisma.user.count(),
        prisma.advisorProfile.count({ where: { isVerified: true } }),
        prisma.advisorCredential.count({ where: { status: 'pending' } }),
        prisma.article.count({ where: { status: 'pending' } }),
      ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalAdvisors: totalAdvisors || 0,
        pendingCredentials: pendingCredentials || 0,
        pendingArticles: pendingArticles || 0,
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
