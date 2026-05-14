// Daily retention-purge runner (BRD §13.3).
//
// Run with:
//   npx dotenv -e .env.local -- ts-node scripts/purge-retention.ts
//
// In prod, schedule via Vercel Cron / Supabase Edge / external scheduler
// daily. Doesn't write audit rows (no actor); the admin manual trigger at
// /admin/retention does.

import {
  purgeClosedForumPast90d,
  purgeDeletedAccountsPast7y,
  purgeExpiredOtps,
} from '../lib/data-retention'

async function main() {
  const otps = await purgeExpiredOtps()
  console.log(`✓ OTP purge: ${otps.emailDeleted} email, ${otps.phoneDeleted} phone`)

  const forum = await purgeClosedForumPast90d()
  console.log(`✓ Closed-forum purge (>90d): ${forum.questionsDeleted} questions`)

  const accounts = await purgeDeletedAccountsPast7y()
  console.log(`✓ Deleted-account purge (>7y): ${accounts.auditEntriesPurged} entries`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Retention purge failed:', e)
    process.exit(1)
  })
