import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { getActiveTier } from '@/lib/subscriptions/tier'

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const tier = await getActiveTier(user.id)
    return NextResponse.json({ success: true, data: tier })
  } catch (err) {
    console.error('Current subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
