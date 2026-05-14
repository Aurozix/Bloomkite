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
    // BRD §3.2 step 3 — Professional Information.
    years_of_experience: p.yearsOfExperience,
    license_registration_number: p.licenseRegistrationNumber,
    license_registration_body: p.licenseRegistrationBody,
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

    // Derive expertise from declared services (§9 master-data migration).
    // Legacy free-text rows in AdvisorExpertise are unioned in until the
    // table is dropped in a follow-up cleanup commit.
    const [serviceRows, legacyRows] = await Promise.all([
      prisma.advisorService.findMany({
        where: { userId: user.id },
        orderBy: { priority: 'asc' },
        include: { service: { select: { name: true } } },
      }),
      prisma.advisorExpertise.findMany({
        where: { userId: user.id },
        select: { specialization: true },
      }),
    ])
    const expertiseSet = new Set<string>()
    for (const r of serviceRows) expertiseSet.add(r.service.name)
    for (const r of legacyRows) expertiseSet.add(r.specialization)
    const expertise = Array.from(expertiseSet)

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
      years_of_experience,
      license_registration_number,
      license_registration_body,
      expertise,
    } = body

    // Validate years_of_experience if supplied — non-negative integer, plus a
    // sanity upper bound so a typo doesn't write "1990" instead of "19".
    let parsedYears: number | null | undefined = undefined
    if (years_of_experience !== undefined) {
      if (years_of_experience === null || years_of_experience === '') {
        parsedYears = null
      } else {
        const n = Number(years_of_experience)
        if (!Number.isInteger(n) || n < 0 || n > 70) {
          return NextResponse.json(
            { error: 'years_of_experience must be an integer 0-70' },
            { status: 400 },
          )
        }
        parsedYears = n
      }
    }

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
          // Only update the three new fields when the client included them —
          // lets a partial save (e.g. just bio + city) leave them untouched.
          ...(parsedYears !== undefined ? { yearsOfExperience: parsedYears } : {}),
          ...(license_registration_number !== undefined
            ? { licenseRegistrationNumber: license_registration_number || null }
            : {}),
          ...(license_registration_body !== undefined
            ? { licenseRegistrationBody: license_registration_body || null }
            : {}),
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error updating advisor profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // The free-text `expertise` payload field is deprecated as of the §9
    // master-data migration. Expertise is now derived from the advisor's
    // declared services (PUT /api/advisors/declarations). Accept the field
    // silently for back-compat with older clients but no longer write to
    // the AdvisorExpertise table; new tags should be created by adding the
    // matching service to the advisor's declarations.
    void expertise

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
