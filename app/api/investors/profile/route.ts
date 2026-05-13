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
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    risk_profile: p.riskProfile,
    bio: p.bio,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const data = await prisma.investorProfile.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ success: true, data: data ? serializeProfile(data) : null })
  } catch (error) {
    console.error('Investor profile GET error:', error)
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
      phone_number,
      date_of_birth,
      gender,
      city,
      state,
      pincode,
    } = body

    const data = await prisma.investorProfile.update({
      where: { userId: user.id },
      data: {
        displayName: display_name || null,
        bio: bio || null,
        phoneNumber: phone_number || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: serializeProfile(data),
    })
  } catch (error) {
    console.error('Investor profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
