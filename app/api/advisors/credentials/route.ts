import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const VALID_CLASSES = ['CERTIFICATION', 'AWARD', 'EDUCATION', 'EXPERIENCE'] as const
type CredentialClass = (typeof VALID_CLASSES)[number]

function serializeCredential(c: any) {
  return {
    id: c.id,
    user_id: c.userId,
    credential_class: c.credentialClass,
    credential_type: c.credentialType,
    issuer: c.issuer,
    license_number: c.licenseNumber,
    expiry_date: c.expiryDate,
    award_year: c.awardYear,
    start_date: c.startDate,
    end_date: c.endDate,
    file_url: c.fileUrl,
    status: c.status,
    rejection_reason: c.rejectionReason,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

// Per-class required-field validation. BRD §3.2 step 4 distinguishes the
// four credential kinds; each carries different load-bearing fields and we
// reject incomplete submissions early so the moderation queue doesn't fill
// with half-filled rows.
function validateClassFields(
  credentialClass: CredentialClass,
  body: {
    credential_type?: unknown
    issuer?: unknown
    license_number?: unknown
    expiry_date?: unknown
    award_year?: unknown
    start_date?: unknown
    end_date?: unknown
  },
): string | null {
  const requireString = (v: unknown, name: string) =>
    typeof v === 'string' && v.trim() ? null : `${name} is required`

  // Title (`credential_type`) + issuer are required for every class.
  const baseError =
    requireString(body.credential_type, 'credential_type') ??
    requireString(body.issuer, 'issuer')
  if (baseError) return baseError

  switch (credentialClass) {
    case 'CERTIFICATION':
      return (
        requireString(body.license_number, 'license_number') ??
        requireString(body.expiry_date, 'expiry_date')
      )
    case 'AWARD':
    case 'EDUCATION': {
      const yr = Number(body.award_year)
      if (!Number.isInteger(yr) || yr < 1900 || yr > new Date().getFullYear() + 1) {
        return 'award_year must be a 4-digit year between 1900 and next year'
      }
      return null
    }
    case 'EXPERIENCE': {
      const startOk =
        typeof body.start_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.start_date)
      if (!startOk) return 'start_date must be YYYY-MM-DD'
      // end_date is optional (null = current role); only validate format when present.
      if (
        body.end_date &&
        !(typeof body.end_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.end_date))
      ) {
        return 'end_date must be YYYY-MM-DD when supplied'
      }
      return null
    }
    default:
      return 'Unknown credential class'
  }
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const data = await prisma.advisorCredential.findMany({
      where: { userId: user.id },
      orderBy: [{ credentialClass: 'asc' }, { createdAt: 'desc' }],
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
    const credentialClassRaw = body.credential_class || 'CERTIFICATION'
    if (!VALID_CLASSES.includes(credentialClassRaw)) {
      return NextResponse.json(
        { error: `credential_class must be one of ${VALID_CLASSES.join(', ')}` },
        { status: 400 },
      )
    }
    const credentialClass = credentialClassRaw as CredentialClass

    const validationError = validateClassFields(credentialClass, body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const {
      credential_type,
      issuer,
      license_number,
      expiry_date,
      award_year,
      start_date,
      end_date,
      file_base64,
      file_name,
    } = body

    // Upload file to Supabase Storage if provided
    let file_url: string | null = null
    if (file_base64 && file_name) {
      const supabaseStorage = createClient(supabaseUrl, supabaseKey)
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

      const { data: publicUrl } = supabaseStorage.storage
        .from('credentials')
        .getPublicUrl(uploadData.path)

      file_url = publicUrl.publicUrl
    }

    // Only populate the class-specific columns the row actually uses; leave
    // the rest null so the queryable schema reflects which kind of credential
    // each row is.
    const classSpecific: {
      licenseNumber?: string | null
      expiryDate?: Date | null
      awardYear?: number | null
      startDate?: Date | null
      endDate?: Date | null
    } = {}

    if (credentialClass === 'CERTIFICATION') {
      classSpecific.licenseNumber = license_number || null
      classSpecific.expiryDate = expiry_date ? new Date(expiry_date) : null
    } else if (credentialClass === 'AWARD' || credentialClass === 'EDUCATION') {
      classSpecific.awardYear = award_year ? Number(award_year) : null
    } else if (credentialClass === 'EXPERIENCE') {
      classSpecific.startDate = start_date ? new Date(start_date) : null
      classSpecific.endDate = end_date ? new Date(end_date) : null
    }

    const data = await prisma.advisorCredential.create({
      data: {
        userId,
        credentialClass,
        credentialType: credential_type,
        issuer,
        fileUrl: file_url,
        status: 'pending',
        ...classSpecific,
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
