import NextAuth from 'next-auth'

import authConfig from './auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    // Run on every request except Next internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|Bloomkite.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
}
