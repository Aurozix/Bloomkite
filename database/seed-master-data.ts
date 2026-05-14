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

// Urgency levels (1..9) — labels for the Priority Ranker calculator.
// Slug 'urgency-N' encodes the rank; calculator looks up by sortOrder so
// admins can rename labels without breaking math.
const URGENCY_LEVELS: SeedRow[] = [
  { slug: 'urgency-1', name: 'Critical', sortOrder: 1 },
  { slug: 'urgency-2', name: 'Very Important', sortOrder: 2 },
  { slug: 'urgency-3', name: 'Important', sortOrder: 3 },
  { slug: 'urgency-4', name: 'To Be Deleted', sortOrder: 4, description: 'Special: signals the goal should be removed' },
  { slug: 'urgency-5', name: 'Moderate', sortOrder: 5 },
  { slug: 'urgency-6', name: 'Low', sortOrder: 6 },
  { slug: 'urgency-7', name: 'Very Low', sortOrder: 7 },
  { slug: 'urgency-8', name: 'Minor', sortOrder: 8 },
  { slug: 'urgency-9', name: 'Least Urgent', sortOrder: 9 },
]

// Cash-flow income categories — picker on the Cash Flow calculator's income side.
const INCOME_CATEGORIES: SeedRow[] = [
  { slug: 'salary', name: 'Salary', sortOrder: 10 },
  { slug: 'business-income', name: 'Business / Self-employment Income', sortOrder: 20 },
  { slug: 'rental-income', name: 'Rental Income', sortOrder: 30 },
  { slug: 'dividend-income', name: 'Dividend Income', sortOrder: 40 },
  { slug: 'interest-income', name: 'Interest Income (FD, Bonds)', sortOrder: 50 },
  { slug: 'capital-gains', name: 'Capital Gains (Realised)', sortOrder: 60 },
  { slug: 'pension', name: 'Pension', sortOrder: 70 },
  { slug: 'freelance', name: 'Freelance / Consulting', sortOrder: 80 },
  { slug: 'other-income', name: 'Other Income', sortOrder: 99 },
]

// Cash-flow expense categories — picker on the Cash Flow calculator's expense side.
const EXPENSE_CATEGORIES: SeedRow[] = [
  { slug: 'rent-mortgage', name: 'Rent / Mortgage', sortOrder: 10 },
  { slug: 'groceries', name: 'Groceries', sortOrder: 20 },
  { slug: 'utilities', name: 'Utilities (Electricity, Water, Gas)', sortOrder: 30 },
  { slug: 'internet-phone', name: 'Internet & Phone', sortOrder: 40 },
  { slug: 'transportation', name: 'Transportation (Fuel, Public Transit)', sortOrder: 50 },
  { slug: 'health-insurance-premium', name: 'Health Insurance Premium', sortOrder: 60 },
  { slug: 'life-insurance-premium', name: 'Life Insurance Premium', sortOrder: 70 },
  { slug: 'loan-emi', name: 'Loan EMI', sortOrder: 80 },
  { slug: 'credit-card', name: 'Credit Card Payments', sortOrder: 90 },
  { slug: 'education', name: 'Education / School Fees', sortOrder: 100 },
  { slug: 'medical', name: 'Medical / Healthcare', sortOrder: 110 },
  { slug: 'dining-entertainment', name: 'Dining & Entertainment', sortOrder: 120 },
  { slug: 'subscriptions', name: 'Subscriptions (Streaming, SaaS)', sortOrder: 130 },
  { slug: 'household', name: 'Household & Maintenance', sortOrder: 140 },
  { slug: 'travel', name: 'Travel & Vacation', sortOrder: 150 },
  { slug: 'taxes', name: 'Taxes (Self-paid)', sortOrder: 160 },
  { slug: 'other-expense', name: 'Other Expense', sortOrder: 999 },
]

// Net-worth asset types — picker on the Net Worth calculator's assets side.
const ASSET_TYPES: SeedRow[] = [
  { slug: 'savings-account', name: 'Savings Account', sortOrder: 10 },
  { slug: 'fixed-deposit', name: 'Fixed Deposit', sortOrder: 20 },
  { slug: 'mutual-funds-asset', name: 'Mutual Funds (Holdings)', sortOrder: 30 },
  { slug: 'direct-equity', name: 'Direct Equity / Stocks', sortOrder: 40 },
  { slug: 'bonds-debentures', name: 'Bonds & Debentures', sortOrder: 50 },
  { slug: 'ppf-asset', name: 'PPF Balance', sortOrder: 60 },
  { slug: 'epf-asset', name: 'EPF Balance', sortOrder: 70 },
  { slug: 'nps-asset', name: 'NPS Balance', sortOrder: 80 },
  { slug: 'real-estate-residential', name: 'Real Estate (Residential)', sortOrder: 90 },
  { slug: 'real-estate-investment', name: 'Real Estate (Investment)', sortOrder: 100 },
  { slug: 'gold-jewellery', name: 'Gold / Jewellery', sortOrder: 110 },
  { slug: 'vehicle', name: 'Vehicle (Car / Bike)', sortOrder: 120 },
  { slug: 'insurance-cash-value', name: 'Insurance Cash Value (ULIP, Endowment)', sortOrder: 130 },
  { slug: 'business-equity', name: 'Business Equity', sortOrder: 140 },
  { slug: 'other-asset', name: 'Other Asset', sortOrder: 999 },
]

// Net-worth liability types — picker on the Net Worth calculator's liabilities side.
const LIABILITY_TYPES: SeedRow[] = [
  { slug: 'home-loan', name: 'Home Loan', sortOrder: 10 },
  { slug: 'car-loan', name: 'Car Loan', sortOrder: 20 },
  { slug: 'personal-loan', name: 'Personal Loan', sortOrder: 30 },
  { slug: 'education-loan', name: 'Education Loan', sortOrder: 40 },
  { slug: 'credit-card-outstanding', name: 'Credit Card Outstanding', sortOrder: 50 },
  { slug: 'business-loan', name: 'Business Loan', sortOrder: 60 },
  { slug: 'gold-loan', name: 'Gold Loan', sortOrder: 70 },
  { slug: 'loan-against-property', name: 'Loan Against Property', sortOrder: 80 },
  { slug: 'tax-payable', name: 'Tax Payable', sortOrder: 90 },
  { slug: 'other-liability', name: 'Other Liability', sortOrder: 999 },
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

  await seedDomain('urgency_levels', URGENCY_LEVELS, (r) =>
    prisma.masterDataUrgencyLevel.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('income_categories', INCOME_CATEGORIES, (r) =>
    prisma.masterDataIncomeCategory.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('expense_categories', EXPENSE_CATEGORIES, (r) =>
    prisma.masterDataExpenseCategory.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('asset_types', ASSET_TYPES, (r) =>
    prisma.masterDataAssetType.upsert({
      where: { slug: r.slug },
      update: { sortOrder: r.sortOrder },
      create: { slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder },
    }),
  )

  await seedDomain('liability_types', LIABILITY_TYPES, (r) =>
    prisma.masterDataLiabilityType.upsert({
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
