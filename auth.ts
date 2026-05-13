import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import authConfig from './auth.config'
import { prisma } from './lib/db'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // Block sign-in if:
    //   1. user has been admin-disabled (disabledAt is non-null), OR
    //   2. email is not verified (credentials only; OAuth providers verify on
    //      their side, and the adapter has already created the user row).
    async signIn({ user, account }) {
      if (!user.email) return false

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { emailVerified: true, disabledAt: true },
      })

      // Admin-disabled accounts cannot sign in regardless of provider.
      if (dbUser?.disabledAt) return false

      // OAuth: Google already verified the email; allow.
      if (account?.provider !== 'credentials') return true

      return dbUser?.emailVerified != null
    },

    // For OAuth sign-ups, mark email verified at creation time. The adapter's
    // createUser doesn't set emailVerified, so we patch it here on first link.
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === 'google' && user?.id) {
        await prisma.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        })
      }

      // Populate token on initial sign-in or on session.update() trigger.
      if (user || trigger === 'update') {
        const userId = (user?.id ?? token.sub) as string | undefined
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              emailVerified: true,
              userRoles: { select: { role: { select: { name: true } } } },
            },
          })
          if (dbUser) {
            const roles = dbUser.userRoles.map((ur) => ur.role.name)
            token.sub = dbUser.id
            token.email = dbUser.email
            token.emailVerified = dbUser.emailVerified
            token.roles = roles

            // currentRole: respect explicit update if it's a role the user has;
            // otherwise default to first role (or keep existing if still valid).
            const requested = (session as { currentRole?: string } | undefined)?.currentRole
            if (trigger === 'update' && requested && roles.includes(requested)) {
              token.currentRole = requested
            } else if (
              typeof token.currentRole !== 'string' ||
              !roles.includes(token.currentRole)
            ) {
              token.currentRole = roles[0] ?? null
            }
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      session.user.roles = (token.roles as string[] | undefined) ?? []
      session.user.currentRole = (token.currentRole as string | null | undefined) ?? null
      session.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null
      return session
    },
  },
})
