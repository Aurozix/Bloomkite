import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export type AuthedUser = {
  id: string
  email: string
  roles: string[]
}

/**
 * Get the current user session in a server component or route handler.
 * Returns null if not signed in.
 */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return null
  return {
    id: session.user.id,
    email: session.user.email,
    roles: session.user.roles ?? [],
  }
}

/**
 * Use in API route handlers. Returns { user } on success, or a NextResponse
 * with the appropriate error to be returned to the client.
 *
 *   const result = await requireAuth()
 *   if ('error' in result) return result.error
 *   const { user } = result
 */
export async function requireAuth(): Promise<
  { user: AuthedUser } | { error: NextResponse }
> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { user }
}

/**
 * Use in API route handlers. Requires the signed-in user to have at least
 * one of the given roles.
 *
 *   const result = await requireRole('admin')
 *   if ('error' in result) return result.error
 *   const { user } = result
 */
export async function requireRole(
  ...roles: string[]
): Promise<{ user: AuthedUser } | { error: NextResponse }> {
  const result = await requireAuth()
  if ('error' in result) return result
  const hasRole = result.user.roles.some((r) => roles.includes(r))
  if (!hasRole) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return result
}

/**
 * Use in API route handlers. Requires the signed-in user to have a specific
 * permission. Hits the DB once per call — cheap, but cache externally if
 * called repeatedly in a hot path.
 */
export async function requirePermission(
  permission: string
): Promise<{ user: AuthedUser } | { error: NextResponse }> {
  const result = await requireAuth()
  if ('error' in result) return result

  const match = await prisma.rolePermission.findFirst({
    where: {
      role: { userRoles: { some: { userId: result.user.id } } },
      permission: { name: permission },
    },
    select: { id: true },
  })

  if (!match) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return result
}
