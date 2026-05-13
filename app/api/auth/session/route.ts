import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// Back-compat shim around NextAuth's session. Pages that haven't been migrated
// to useSession() still call this endpoint and expect the legacy Supabase shape.
// Phase 5/7 cleanup should migrate consumers to useSession() and delete this.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ user: null })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      investorProfile: true,
      advisorProfile: true,
    },
  })

  if (!dbUser) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      roles: session.user.roles,
      current_role: session.user.currentRole,
      user_metadata: { full_name: dbUser.name },
      investor_profile: dbUser.investorProfile,
      advisor_profile: dbUser.advisorProfile,
    },
  })
}
