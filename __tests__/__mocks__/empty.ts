// Empty mock for @auth/* packages (PrismaAdapter etc.) which ship ESM-only
// and can't be parsed by Jest. Tests that touch auth-gated code should mock
// at the route boundary, not the adapter.

const noop = () => undefined as unknown
export default noop
export const PrismaAdapter = () => ({}) as Record<string, never>
