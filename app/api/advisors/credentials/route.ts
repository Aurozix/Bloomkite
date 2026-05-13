import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function serializeCredential(c: any) {
  return {
    id: c.id,
    user_id: c.userId,
    credential_type: c.credentialType,
    issuer: c.issuer,
    license_number: c.licenseNumber,
    expiry_date: c.expiryDate,
    file_url: c.fileUrl,
    status: c.status,
    rejection_reason: c.rejectionReason,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const data = await prisma.advisorCredential.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: data.map(serializeCredential),
    })
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth
    const userId = user.id

    const body = await request.json()
    const { credential_type, issuer, license_number, expiry_date, file_base64, file_name } = body

    if (!credential_type || !issuer || !license_number || !expiry_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upload file to Supabase Storage if provided
    let file_url: string | null = null
    if (file_base64 && file_name) {
      const supabaseStorage = createClient(supabaseUrl, supabaseKey)

      // Convert base64 to buffer
      const buffer = Buffer.from(file_base64, 'base64')
      const filename = `${userId}/${Date.now()}-${file_name}`

      const { data: uploadData, error: uploadError } = await supabaseStorage.storage
        .from('credentials')
        .upload(filename, buffer, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        console.error('File upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
      }

      // Get public URL
      const { data: publicUrl } = supabaseStorage.storage
        .from('credentials')
        .getPublicUrl(uploadData.path)

      file_url = publicUrl.publicUrl
    }

    // Insert credential record
    const data = await prisma.advisorCredential.create({
      data: {
        userId,
        credentialType: credential_type,
        issuer,
        licenseNumber: license_number,
        expiryDate: expiry_date ? new Date(expiry_date) : null,
        fileUrl: file_url,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Credential uploaded successfully, pending admin approval',
      data: serializeCredential(data),
    })
  } catch (error) {
    console.error('Create credential error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
