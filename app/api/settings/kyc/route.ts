import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { processAadhaar, processPan } from '@/lib/kyc'

// User-side KYC capture (BRD §12.4). Required for premium tier; voluntary
// otherwise. Stores hash + last-4; never persists the raw ID. Verification
// is admin-driven — the row lands in PENDING and an admin verifies.

const upsertSchema = z.object({
  pan: z.string().trim().min(1).max(40),
  aadhaar: z.string().trim().max(40).optional(),
  fullNameOnPan: z.string().trim().max(255).optional(),
})

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const record = await prisma.kycRecord.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      panLast4: true,
      aadhaarLast4: true,
      fullNameOnPan: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
      verifiedAt: true,
    },
  })

  return NextResponse.json({ success: true, record })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const pan = processPan(parsed.data.pan)
  if (!pan.ok) {
    return NextResponse.json({ error: pan.error }, { status: 400 })
  }

  let aadhaarFields: { aadhaarHash: string; aadhaarLast4: string } | null = null
  if (parsed.data.aadhaar && parsed.data.aadhaar.trim()) {
    const a = processAadhaar(parsed.data.aadhaar)
    if (!a.ok) {
      return NextResponse.json({ error: a.error }, { status: 400 })
    }
    aadhaarFields = { aadhaarHash: a.hash, aadhaarLast4: a.last4 }
  }

  const data = {
    panHash: pan.hash,
    panLast4: pan.last4,
    fullNameOnPan: parsed.data.fullNameOnPan?.trim() || null,
    // Re-submission flips back to PENDING — admin must re-verify.
    status: 'PENDING',
    rejectionReason: null,
    verifiedById: null,
    verifiedAt: null,
    aadhaarHash: aadhaarFields?.aadhaarHash ?? null,
    aadhaarLast4: aadhaarFields?.aadhaarLast4 ?? null,
  }

  const record = await prisma.kycRecord.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
    select: {
      id: true,
      panLast4: true,
      aadhaarLast4: true,
      fullNameOnPan: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ success: true, record })
}
