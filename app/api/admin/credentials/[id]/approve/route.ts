import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole('admin')
    if ('error' in auth) return auth.error

    const credentialId = params.id

    // Only approve if currently pending. Use updateMany to filter on status,
    // then re-read.
    const result = await prisma.advisorCredential.updateMany({
      where: { id: credentialId, status: 'pending' },
      data: { status: 'approved', updatedAt: new Date() },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Credential not found or already processed' }, { status: 404 })
    }

    const data = await prisma.advisorCredential.findUnique({ where: { id: credentialId } })

    return NextResponse.json({
      success: true,
      message: 'Credential approved',
      data: data
        ? {
            id: data.id,
            user_id: data.userId,
            credential_type: data.credentialType,
            issuer: data.issuer,
            license_number: data.licenseNumber,
            expiry_date: data.expiryDate,
            file_url: data.fileUrl,
            status: data.status,
            rejection_reason: data.rejectionReason,
            created_at: data.createdAt,
            updated_at: data.updatedAt,
          }
        : null,
    })
  } catch (error) {
    console.error('Approve credential error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
