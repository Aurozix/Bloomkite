// Seed for the ai_features table.
//
// Registers AI features as DISABLED. The "no preseed ON" rule from
// docs/ai-opportunities/ and BRD §8.3 is the whole point of this file: every
// row lands with isEnabled=false. An admin flips them through the
// /admin/ai-features UI (or the toggle API) after compliance + brand sign-off
// on the actual implementation, not on the proposal.
//
// Idempotent: upserts by slug, never overwrites an admin's enabled-state.
//
// Run with:
//   npx dotenv -e .env.local -- ts-node database/seed-ai-features.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AIFeatureSeed {
  slug: string
  category: string
  name: string
  description: string
}

// Keep this list short and curated. Each entry maps to a registered candidate
// from the corresponding docs/ai-opportunities/ report. Adding a row here is a
// commitment to wire the slug behind a real gate in code.
const AI_FEATURES: AIFeatureSeed[] = [
  {
    slug: 'calc-narration-goal-planner',
    category: 'calculators',
    name: 'Goal Planner result narration',
    description:
      'Plain-English explanation of Goal Planner output (3 sentences, picks the surprising number). LLM narrates structured outputs — never computes, predicts, or recommends. See docs/ai-opportunities/calculators-2026-05-13.md candidate #1.',
  },
]

async function main() {
  for (const f of AI_FEATURES) {
    // Upsert by slug. `update` keeps the existing isEnabled state — never
    // re-disable an admin-enabled feature. `create` defaults to disabled per
    // schema (isEnabled @default(false)).
    await prisma.aIFeature.upsert({
      where: { slug: f.slug },
      update: {
        category: f.category,
        name: f.name,
        description: f.description,
      },
      create: {
        slug: f.slug,
        category: f.category,
        name: f.name,
        description: f.description,
      },
    })
    console.log(`  ✓ ai_features upsert: ${f.slug}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('AI features seed complete.')
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
