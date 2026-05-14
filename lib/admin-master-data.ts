// Admin master-data dispatcher.
//
// Seven master-data tables share the exact same shape (slug + name +
// description + sortOrder + isActive). One admin route serves all of them
// via a domain-slug → Prisma delegate registry instead of seven near-
// identical routes.
//
// The public /api/master-data/[domain] route (already shipped) serves a
// reduced read view to authenticated investors/advisors. The admin endpoints
// in /api/admin/master-data are a superset: include inactive rows, expose
// create/update/deactivate, and write audit entries.

import { prisma } from '@/lib/db'

type Delegate = {
  findMany: (args: object) => Promise<unknown[]>
  findUnique: (args: object) => Promise<unknown | null>
  create: (args: object) => Promise<unknown>
  update: (args: object) => Promise<unknown>
}

interface DomainSpec {
  label: string
  /// Prisma delegate. `as Delegate` keeps callers tidy without the verbose
  /// generic types you'd otherwise need to span seven different model types.
  delegate: Delegate
}

export const ADMIN_MASTER_DATA_DOMAINS: Record<string, DomainSpec> = {
  'investment-categories': {
    label: 'Investment categories',
    delegate: prisma.masterDataInvestmentCategory as unknown as Delegate,
  },
  products: {
    label: 'Products',
    delegate: prisma.masterDataProduct as unknown as Delegate,
  },
  services: {
    label: 'Services',
    delegate: prisma.masterDataService as unknown as Delegate,
  },
  brands: {
    label: 'Brands',
    delegate: prisma.masterDataBrand as unknown as Delegate,
  },
  'account-types': {
    label: 'Account types',
    delegate: prisma.masterDataAccountType as unknown as Delegate,
  },
  'urgency-levels': {
    label: 'Urgency levels',
    delegate: prisma.masterDataUrgencyLevel as unknown as Delegate,
  },
  'calculator-categories': {
    label: 'Calculator categories',
    delegate: prisma.masterDataCalculatorCategory as unknown as Delegate,
  },
}

export type AdminMasterDataDomainKey = keyof typeof ADMIN_MASTER_DATA_DOMAINS

export function getDomain(domain: string): DomainSpec | null {
  return ADMIN_MASTER_DATA_DOMAINS[domain] ?? null
}

export function listDomains(): Array<{ slug: string; label: string }> {
  return Object.entries(ADMIN_MASTER_DATA_DOMAINS).map(([slug, spec]) => ({
    slug,
    label: spec.label,
  }))
}
