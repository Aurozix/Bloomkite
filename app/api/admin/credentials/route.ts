import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('admin')
    if ('error' in auth) return auth.error

    let data
    try {
      data = await prisma.advisorCredential.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    } catch (error) {
      console.error('Get credentials error:', error)
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
    }

    const formatted = data.map((c) => {
      const userShape = c.user
        ? { id: c.user.id, display_name: c.user.name, email: c.user.email }
        : null
      return {
        id: c.id,
        credential_type: c.credentialType,
        issuer: c.issuer,
        license_number: c.licenseNumber,
        file_url: c.fileUrl,
        status: c.status,
        created_at: c.createdAt,
        user: userShape,
        advisor: userShape,
      }
    })

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
