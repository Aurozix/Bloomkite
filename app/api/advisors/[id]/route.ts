import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

function serializeProfile(p: any) {
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const advisorId = params.id

    // Get current user (if authenticated)
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id ?? null

    // Fetch advisor profile
    const profile = await prisma.advisorProfile.findUnique({
      where: { userId: advisorId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    // Fetch approved credentials
    const credentials = await prisma.advisorCredential.findMany({
      where: { userId: advisorId, status: 'approved' },
    })

    // Expertise is now derived from AdvisorService → MasterDataService.name
    // (§9 master-data migration). Legacy free-text rows in AdvisorExpertise
    // are unioned in until that table is dropped.
    const [serviceRows, legacyRows] = await Promise.all([
      prisma.advisorService.findMany({
        where: { userId: advisorId },
        orderBy: { priority: 'asc' },
        include: { service: { select: { name: true } } },
      }),
      prisma.advisorExpertise.findMany({
        where: { userId: advisorId },
        select: { specialization: true },
      }),
    ])
    const expertiseSet = new Set<string>()
    for (const r of serviceRows) expertiseSet.add(r.service.name)
    for (const r of legacyRows) expertiseSet.add(r.specialization)
    const expertise = Array.from(expertiseSet).map((name) => ({ specialization: name }))

    // Fetch follower count
    const followerCount = await prisma.advisorFollower.count({
      where: { advisorId },
    })

    // Check if current user is following
    let isFollowing = false
    if (currentUserId) {
      const followData = await prisma.advisorFollower.findUnique({
        where: {
          investorId_advisorId: {
            investorId: currentUserId,
            advisorId,
          },
        },
      })
      isFollowing = !!followData
    }

    return NextResponse.json({
      success: true,
      data: {
        ...serializeProfile(profile),
        credentials: credentials.map(serializeCredential),
        expertise: expertise.map((e) => e.specialization),
        follower_count: followerCount || 0,
        is_following: isFollowing,
      },
    })
  } catch (error) {
    console.error('Get advisor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
