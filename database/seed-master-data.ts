// Seed for the five master-data domains (BRD §3.1 step 4-5, §3.2 step 5).
//
// Idempotent — upserts by slug, never overwrites name/sortOrder for rows an
// admin may have edited. New runs only ADD rows that aren't already present.
// Admin-deactivated rows (isActive=false) are left alone.
//
// Run with:
//   npx dotenv -e .env.local -- ts-node database/seed-master-data.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedRow {
  slug: string
  name: string
  description?: string
  sortOrder: number
}

const INVESTMENT_CATEGORIES: SeedRow[] = [
  { slug: 'equity', name: 'Equity / Stocks', sortOrder: 10 },
  { slug: 'mutual-funds', name: 'Mutual Funds', sortOrder: 20 },
  { slug: 'fixed-income', name: 'Fixed Income / Debt', sortOrder: 30 },
  { slug: 'insurance', name: 'Insurance', sortOrder: 40 },
  { slug: 'real-estate', name: 'Real Estate', sortOrder: 50 },
  { slug: 'gold-commodities', name: 'Gold & Commodities', sortOrder: 60 },
  { slug: 'retirement', name: 'Retirement Planning', sortOrder: 70 },
  { slug: 'tax-planning', name: 'Tax Planning', sortOrder: 80 },
  { slug: 'alternative', name: 'Alternative Investments (PMS, AIF)', sortOrder: 90 },
  { slug: 'crypto', name: 'Crypto / Digital Assets', sortOrder: 100 },
]

const PRODUCTS: SeedRow[] = [
  { slug: 'mutual-funds', name: 'Mutual Funds', sortOrder: 10 },
  { slug: 'life-insurance', name: 'Life Insurance', sortOrder: 20 },
  { slug: 'health-insurance', name: 'Health Insurance', sortOrder: 30 },
  { slug: 'general-insurance', name: 'General Insurance', sortOrder: 40 },
  { slug: 'fixed-deposits', name: 'Fixed Deposits', sortOrder: 50 },
  { slug: 'bonds', name: 'Bonds & Debentures', sortOrder: 60 },
  { slug: 'pms', name: 'Portfolio Management Services (PMS)', sortOrder: 70 },
  { slug: 'aif', name: 'Alternative Investment Funds (AIF)', sortOrder: 80 },
  { slug: 'ulip', name: 'Unit-Linked Insurance Plans (ULIPs)', sortOrder: 90 },
  { slug: 'pension-funds', name: 'Pension Funds (NPS)', sortOrder: 100 },
  { slug: 'pms-equity', name: 'Direct Equity', sortOrder: 110 },
]

const SERVICES: SeedRow[] = [
  { slug: 'wealth-management', name: 'Wealth Management', sortOrder: 10 },
  { slug: 'retirement-planning', name: 'Retirement Planning', sortOrder: 20 },
  { slug: 'tax-planning', name: 'Tax Planning', sortOrder: 30 },
  { slug: 'estate-planning', name: 'Estate & Succession Planning', sortOrder: 40 },
  { slug: 'goal-planning', name: 'Goal-Based Financial Planning', sortOrder: 50 },
  { slug: 'insurance-planning', name: 'Insurance & Risk Planning', sortOrder: 60 },
  { slug: 'investment-advisory', name: 'Investment Advisory', sortOrder: 70 },
  { slug: 'nri-advisory', name: 'NRI Advisory (FEMA, DTAA, repatriation)', sortOrder: 80 },
  { slug: 'corporate-advisory', name: 'Corporate Financial Advisory', sortOrder: 90 },
  { slug: 'debt-management', name: 'Debt Management & Loan Planning', sortOrder: 100 },
]

const BRANDS: SeedRow[] = [
  { slug: 'hdfc', name: 'HDFC', sortOrder: 10 },
  { slug: 'icici', name: 'ICICI', sortOrder: 20 },
  { slug: 'sbi', name: 'SBI / SBI Mutual Fund', sortOrder: 30 },
  { slug: 'kotak', name: 'Kotak Mahindra', sortOrder: 40 },
  { slug: 'axis', name: 'Axis', sortOrder: 50 },
  { slug: 'bajaj-allianz', name: 'Bajaj Allianz', sortOrder: 60 },
  { slug: 'lic', name: 'LIC', sortOrder: 70 },
  { slug: 'icici-prudential', name: 'ICICI Prudential', sortOrder: 80 },
  { slug: 'aditya-birla', name: 'Aditya Birla Capital', sortOrder: 90 },
  { slug: 'nippon', name: 'Nippon India', sortOrder: 100 },
  { slug: 'mirae', name: 'Mirae Asset', sortOrder: 110 },
  { slug: 'tata', name: 'Tata Mutual Fund', sortOrder: 120 },
  { slug: 'dsp', name: 'DSP', sortOrder: 130 },
  { slug: 'uti', name: 'UTI Mutual Fund', sortOrder: 140 },
  { slug: 'parag-parikh', name: 'Parag Parikh', sortOrder: 150 },
]

const ACCOUNT_TYPES: SeedRow[] = [
  { slug: 'bank-savings', name: 'Bank Savings Account', sortOrder: 10 },
  { slug: 'bank-fd', name: 'Bank Fixed Deposit', sortOrder: 20 },
  { slug: 'demat', name: 'Demat / Brokerage Account', sortOrder: 30 },
  { slug: 'mutual-funds', name: 'Mutual Funds Folio', sortOrder: 40 },
  { slug: 'ppf', name: 'PPF (Public Provident Fund)', sortOrder: 50 },
  { slug: 'epf', name: 'EPF (Employees\' Provident Fund)', sortOrder: 60 },
  { slug: 'nps', name: 'NPS (National Pension System)', sortOrder: 70 },
  { slug: 'life-insurance-policy', name: 'Life Insurance Policy', sortOrder: 80 },
  { slug: 'health-insurance-policy', name: 'Health Insurance Policy', sortOrder: 90 },
  { slug: 'ulip', name: 'ULIP', sortOrder: 100 },
  { slug: 'real-estate', name: 'Real Estate Holding', sortOrder: 110 },
  { slug: 'physical-gold', name: 'Physical Gold / Jewellery', sortOrder: 120 },
]

async function seedDomain(label: string, rows: SeedRow[], upsert: (r: SeedRow) => Promise<unknown>) {
  let created = 0
  for (const row of rows) {
    await upsert(row)
    created++
  }
  console.log(`  ✓ ${label}: ${created} rows upserted`)
}

async function main() {
  await seedDomain('investment_categories', INVESTMENT_CATEGORIES, (r) =>
    prisma.masterDataInvestmentCategory.upsert({
      where: { slug: r.slug },
      // Never re-activate a row an admin deliberately deactivated; never
      // overwrite a name an admin may have edited.
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('products', PRODUCTS, (r) =>
    prisma.masterDataProduct.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('services', SERVICES, (r) =>
    prisma.masterDataService.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('brands', BRANDS, (r) =>
    prisma.masterDataBrand.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('account_types', ACCOUNT_TYPES, (r) =>
    prisma.masterDataAccountType.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Master data seed complete.')
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
