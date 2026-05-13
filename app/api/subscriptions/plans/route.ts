import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    const data = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceInrPaise: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        priceInrPaise: true,
        billingPeriod: true,
        features: true,
      },
    })

    const serialized = data.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_inr_paise: Number(p.priceInrPaise),
      billing_period: p.billingPeriod,
      features: p.features,
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (err) {
    console.error('Plans error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
