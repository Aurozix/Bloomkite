import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

function serializeProfile(p: any) {
  if (!p) return null
  return {
    id: p.id,
    user_id: p.userId,
    display_name: p.displayName,
    phone_number: p.phoneNumber,
    date_of_birth: p.dateOfBirth,
    gender: p.gender,
    company_name: p.companyName,
    designation: p.designation,
    pan_number: p.panNumber,
    gst_number: p.gstNumber,
    address_line1: p.addressLine1,
    address_line2: p.addressLine2,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    website_url: p.websiteUrl,
    bio: p.bio,
    profile_image_url: p.profileImageUrl,
    workflow_status: p.workflowStatus,
    approved_by: p.approvedBy,
    approved_at: p.approvedAt,
    is_verified: p.isVerified,
    verified_at: p.verifiedAt,
    follower_count: p.followerCount,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const data = await prisma.advisorProfile.findUnique({
      where: { userId: user.id },
    })

    const expertiseRows = await prisma.advisorExpertise.findMany({
      where: { userId: user.id },
      select: { specialization: true },
    })

    const expertise = expertiseRows.map((r) => r.specialization)

    return NextResponse.json({
      success: true,
      data: data ? { ...serializeProfile(data), expertise } : null,
    })
  } catch (error) {
    console.error('Advisor profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()
    const {
      display_name,
      bio,
      company_name,
      designation,
      city,
      state,
      website_url,
      phone_number,
      expertise,
    } = body

    let data
    try {
      data = await prisma.advisorProfile.update({
        where: { userId: user.id },
        data: {
          displayName: display_name || null,
          bio: bio || null,
          companyName: company_name || null,
          designation: designation || null,
          city: city || null,
          state: state || null,
          websiteUrl: website_url || null,
          phoneNumber: phone_number || null,
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error updating advisor profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Optionally sync expertise tags. Pass `expertise: string[]` to replace
    // the advisor's full tag set; omit the field to leave it untouched.
    if (Array.isArray(expertise)) {
      const cleaned = expertise
        .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => s.length > 0)

      try {
        await prisma.advisorExpertise.deleteMany({ where: { userId: user.id } })
        if (cleaned.length > 0) {
          await prisma.advisorExpertise.createMany({
            data: cleaned.map((specialization) => ({
              userId: user.id,
              specialization,
            })),
            skipDuplicates: true,
          })
        }
      } catch (expError) {
        console.error('Error syncing expertise:', expError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: serializeProfile(data),
    })
  } catch (error) {
    console.error('Advisor profile PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
