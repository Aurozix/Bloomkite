import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// POST /api/support
// Public endpoint — anyone (signed in or not) can reach support / file a
// grievance per BRD §12.5. When the submitter is signed in, we auto-link to
// their user row; otherwise contactEmail is the only reachback channel.

const SUPPORT_CATEGORIES = [
  'account',
  'billing',
  'privacy',
  'advisor-issue',
  'content-issue',
  'bug',
  'other',
] as const

const bodySchema = z.object({
  contactName: z.string().trim().min(1).max(150),
  contactEmail: z.string().email().max(255),
  category: z.enum(SUPPORT_CATEGORIES),
  subject: z.string().trim().min(3).max(300),
  body: z.string().trim().min(10).max(10000),
})

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const currentUser = await getCurrentUser()

  const created = await prisma.supportRequest.create({
    data: {
      userId: currentUser?.id ?? null,
      contactName: parsed.data.contactName.trim(),
      contactEmail: parsed.data.contactEmail.toLowerCase().trim(),
      category: parsed.data.category,
      subject: parsed.data.subject.trim(),
      body: parsed.data.body.trim(),
    },
    select: { id: true, createdAt: true },
  })

  return NextResponse.json({
    success: true,
    request: created,
    // The friendly "we got it" message the UI shows. No SLAs over-promised.
    acknowledgement:
      'Thanks — we have received your request and will respond by email.',
  })
}
