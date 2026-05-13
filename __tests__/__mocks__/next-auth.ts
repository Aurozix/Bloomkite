// Jest mock for next-auth. The real package is ESM-only and can't be parsed
// by Jest's default transformer; tests that exercise auth-gated code paths
// should use these stubs and assert on behavior, not on Auth.js internals.

const mockHandler = () =>
  new Response(JSON.stringify({ user: null }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

const NextAuth = () => ({
  handlers: { GET: mockHandler, POST: mockHandler },
  auth: () => Promise.resolve(null),
  signIn: () => Promise.resolve({ ok: true, error: null }),
  signOut: () => Promise.resolve(undefined),
})

export default NextAuth
export const SessionProvider = ({ children }: { children: unknown }) => children
export const useSession = () => ({ data: null, status: 'unauthenticated', update: async () => null })
export const signIn = () => Promise.resolve({ ok: true, error: null })
export const signOut = () => Promise.resolve(undefined)
export const getSession = () => Promise.resolve(null)
