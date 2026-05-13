import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

// Routes the middleware lets through without an auth cookie.
const PUBLIC_EXACT = new Set<string>([
  '/',
  '/advisors',
  '/articles',
  '/forum',
  '/subscriptions',
  '/api/advisors/search',
  '/api/articles',
  '/api/forum/questions',
  '/api/subscriptions/plans',
])

const PUBLIC_PREFIXES = [
  '/auth/',
  '/advisors/',
  '/articles/',
  '/forum/',
  '/api/auth/',
  '/api/webhooks/',
  '/api/articles/',
  '/api/forum/',
  '/api/advisors/',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

// Edge-safe Auth.js config. Imported by middleware.ts AND by auth.ts.
// Anything that needs Node.js runtime (Prisma, bcrypt, etc.) must live in
// auth.ts, NOT here.
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    // Runs in middleware on every request AND in route handlers via auth().
    // Return true to allow, false to redirect to signIn page.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      if (isPublic(pathname)) return true
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig
