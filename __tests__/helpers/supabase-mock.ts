// Shared Supabase mock helpers for integration tests.
//
// The Supabase client is a fluent query builder where every method (.select,
// .eq, .order, .range, .or, .ilike, etc.) returns the same builder, and the
// builder itself is thenable — `await builder` resolves to `{ data, count,
// error }`. The hand-rolled mocks in each test file frequently break this
// invariant (e.g., .select returns `this` but .eq isn't defined on the
// returned object). This helper provides one correct implementation.

export interface QueryResult {
  data?: unknown
  count?: number | null
  error?: unknown
}

/**
 * Build a thenable proxy that pretends to be a Supabase PostgrestQueryBuilder.
 *
 * Every method call returns the same proxy, so any chain
 * (.select().eq().order().range()) yields a thenable that resolves to the
 * provided result. `.single()` also resolves to the result — pass
 * `{ data: <singleObject> }` for tests that expect a single row.
 */
export function makeQueryBuilder(result: QueryResult = {}): any {
  const final: Required<QueryResult> = {
    data: result.data ?? null,
    count: result.count ?? null,
    error: result.error ?? null,
  }
  const proxy: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (v: QueryResult) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(final).then(resolve, reject)
        }
        if (prop === 'catch') {
          return (reject: (e: unknown) => unknown) =>
            Promise.resolve(final).catch(reject)
        }
        if (prop === 'finally') {
          return (cb: () => void) => Promise.resolve(final).finally(cb)
        }
        // Any other property access — return a function that returns the proxy.
        return (..._args: unknown[]) => proxy
      },
    }
  )
  return proxy
}

export interface SupabaseMockOptions {
  /** Result returned by `auth.getUser()`. Default: a generic test user. */
  user?: { id: string; email?: string } | null
  /** If set, `auth.getUser()` resolves with `{ data: { user: null }, error }`. */
  authError?: { message: string } | null
  /** Per-table results. If a table isn't in this map, `defaultResult` is used. */
  tableResults?: Record<string, QueryResult>
  /** Result for tables not in `tableResults`. Default: empty array. */
  defaultResult?: QueryResult
}

/**
 * Build a fake Supabase client suitable for jest.mock factory output. Pass to
 * `(createClient as jest.Mock).mockReturnValue(...)` inside a `beforeEach`.
 */
export function makeSupabaseClientMock(opts: SupabaseMockOptions = {}): any {
  const {
    user = { id: 'test-user-123', email: 'test@example.com' },
    authError = null,
    tableResults = {},
    defaultResult = { data: [], error: null },
  } = opts

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: authError ? null : user },
        error: authError,
      }),
      // Other auth methods occasionally referenced in routes — return benign defaults.
      signOut: jest.fn().mockResolvedValue({ error: null }),
      admin: {
        createUser: jest
          .fn()
          .mockResolvedValue({ data: { user }, error: null }),
        generateLink: jest.fn().mockResolvedValue({
          data: { properties: { hashed_token: 'mock-token-hash' } },
          error: null,
        }),
      },
    },
    from: jest.fn((table: string) =>
      makeQueryBuilder(tableResults[table] ?? defaultResult)
    ),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.pdf' },
        }),
      })),
    },
  }
}

/**
 * Standard jest mock setup. Call inside `jest.mock('@supabase/supabase-js', ...)`
 * is NOT supported because of factory-hoisting; instead use:
 *
 *   jest.mock('@supabase/supabase-js')
 *   import { createClient } from '@supabase/supabase-js'
 *   import { applySupabaseMock } from '../../helpers/supabase-mock'
 *
 *   beforeEach(() => {
 *     applySupabaseMock(createClient as jest.Mock, { tableResults: { ... } })
 *   })
 */
export function applySupabaseMock(
  createClientMock: jest.Mock,
  opts: SupabaseMockOptions = {}
): void {
  createClientMock.mockReturnValue(makeSupabaseClientMock(opts))
}
