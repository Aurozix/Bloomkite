import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

const DOMAIN_LOADERS: Record<string, () => Promise<Array<{ id: string; slug: string; name: string; sortOrder: number }>>> = {
  'investment-categories': () =>
    prisma.masterDataInvestmentCategory.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  products: () =>
    prisma.masterDataProduct.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  services: () =>
    prisma.masterDataService.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  brands: () =>
    prisma.masterDataBrand.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  'account-types': () =>
    prisma.masterDataAccountType.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  'urgency-levels': () =>
    prisma.masterDataUrgencyLevel.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  'income-categories': () =>
    prisma.masterDataIncomeCategory.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  'expense-categories': () =>
    prisma.masterDataExpenseCategory.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  'asset-types': () =>
    prisma.masterDataAssetType.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  'liability-types': () =>
    prisma.masterDataLiabilityType.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
}

// Lists active master-data rows for a given domain. Auth-required since this
// is profile-form fodder for signed-in users; not anonymous-public to avoid
// scraping. Returns only fields the picker UIs need — full description and
// admin-edit metadata are off-table for non-admin callers.
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ domain: string }> },
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const { domain } = await context.params
  const loader = DOMAIN_LOADERS[domain]
  if (!loader) {
    return NextResponse.json(
      { error: 'Unknown master-data domain', valid: Object.keys(DOMAIN_LOADERS) },
      { status: 404 },
    )
  }

  try {
    const data = await loader()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(`master-data ${domain} fetch failed:`, err)
    return NextResponse.json({ error: 'Failed to load master data' }, { status: 500 })
  }
}
