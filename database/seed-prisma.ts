// Prisma-based seed for test users under the Auth.js model.
//
// Creates three users (admin, advisor, investor) with bcrypt-hashed passwords
// and assigns each their role. Runs against whatever DATABASE_URL is in the
// loaded env file. Idempotent: re-running upserts users by email.
//
// Run with:
//   npx dotenv -e .env.local -- ts-node database/seed-prisma.ts
//
// Replaces the legacy database/seed.ts test-user step, which still depends on
// the (now removed) Supabase Auth admin API.

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_PASSWORD = 'TestPassword123!'

interface TestUser {
  email: string
  name: string
  role: 'admin' | 'advisor' | 'investor'
}

const TEST_USERS: TestUser[] = [
  { email: 'admin@bloomkite.local', name: 'Bloomkite Admin', role: 'admin' },
  { email: 'advisor@bloomkite.local', name: 'Test Advisor', role: 'advisor' },
  { email: 'investor@bloomkite.local', name: 'Test Investor', role: 'investor' },
]

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)

  for (const u of TEST_USERS) {
    const role = await prisma.role.findUnique({ where: { name: u.role } })
    if (!role) {
      throw new Error(
        `Role '${u.role}' not found. Run the roles+permissions seed first.`
      )
    }

    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        emailVerified: new Date(),
      },
      update: {
        name: u.name,
        passwordHash,
        emailVerified: new Date(),
        disabledAt: null,
        disabledBy: null,
      },
    })

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    })

    if (u.role === 'investor') {
      await prisma.investorProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, displayName: u.name },
        update: { displayName: u.name },
      })
    } else if (u.role === 'advisor') {
      await prisma.advisorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: u.name,
          workflowStatus: 'approved',
          isVerified: true,
        },
        update: {
          displayName: u.name,
          workflowStatus: 'approved',
          isVerified: true,
        },
      })
    }

    console.log(`✓ ${u.role.padEnd(8)} ${u.email}`)
  }

  console.log('')
  console.log('Test credentials:')
  for (const u of TEST_USERS) {
    console.log(`  ${u.email} / ${TEST_PASSWORD}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
