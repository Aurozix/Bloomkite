import { NextRequest, NextResponse } from 'next/server'

// Exact public paths
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

// Public prefixes (request path must start with one of these).
// The API prefixes below cover GET listings + detail reads. Mutation methods
// inside these routes (POST/PUT/DELETE) self-gate via cookie checks, so
// opening the prefix at the middleware layer is safe.
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get('sb-access-token')?.value
  if (accessToken) {
    return NextResponse.next()
  }

  const signInUrl = new URL('/auth/signin', request.url)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: [
    // Match everything except Next internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|Bloomkite.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
}
