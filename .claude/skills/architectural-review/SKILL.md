---
name: architectural-review
description: Check changed code for consistency with Bloomkite's architectural patterns — auth, RLS, route conventions, separation of concerns. Use when new API routes, middleware, DB tables, or auth flows are added or modified.
---

# Architectural review

The point is consistency, not perfection. A new route that does auth differently from the other 30 routes is worse than a route that copies a slightly imperfect pattern.

## Bloomkite architectural rules (current, enforced)

1. **Auth in API routes.**
   - Public routes (no auth required): per-request `createClient(url, anonKey)`. RLS does the gating. Examples: `app/api/advisors/search/route.ts`.
   - User routes (auth required): per-request `createClient(url, anonKey, { global: { headers: { Authorization: 'Bearer ' + accessToken } } })` followed by `supabase.auth.getUser()`. Examples: `app/api/auth/session/route.ts`, `app/api/calculators/save/route.ts`.
   - **Never** decode JWTs manually with `Buffer.from(parts[1], 'base64')`.
   - **Never** instantiate a `SUPABASE_SERVICE_ROLE_KEY` client at module level. Service role is for admin endpoints only, created inside the handler after the request has been confirmed to be admin.

2. **Row-Level Security.**
   - Every public table has RLS enabled in its migration.
   - User-scoped routes use the anon-key client so RLS applies. Bypassing RLS via service role is a deliberate decision, not a default.

3. **Protected page routing.**
   - `middleware.ts` redirects unauthenticated users to `/auth/signin` for non-public paths. Adding a new page → decide if it's public (extend the allowlist in `middleware.ts`) or protected (do nothing; middleware handles it).
   - Client-side `useEffect → fetch session → redirect` patterns are legacy; middleware is the source of truth.

4. **Migrations.**
   - Single source of truth: `database/migrations/NNN_<name>.sql`. No second migration tree (we removed `supabase/`).
   - Numbering is monotonic. Seeds and idempotency: `ON CONFLICT DO NOTHING`, `CREATE OR REPLACE`, `DROP TRIGGER IF EXISTS` patterns.
   - Migrations applied via `scripts/migrate.ts` (custom runner against `public.migrations` table).

5. **Env files.**
   - `.env.local` (dev), `.env.test` (test), `.env.prod` (production). All gitignored.
   - Migration runner picks via `--env local|test|prod`.

6. **Tech stack.**
   - Next.js 14 App Router (`app/`). Pages are `'use client'` only when they use hooks/state; prefer server components when possible.
   - Tailwind for styling. No external UI library.
   - Zod for input validation (RAD says so — many routes don't yet; flag if new routes also skip).
   - Decimal.js for financial math, not floating point.

## Procedure

1. List changed files: `git diff --stat main...HEAD` or against the relevant base.
2. For each new/modified API route, check rules 1 and 2 above. Flag deviations.
3. For each new page, check rule 3. Confirm middleware allowlist is in sync with intent.
4. For each migration, check rule 4. Confirm it doesn't duplicate prior migration intent.
5. For new env vars, confirm they appear in all three `.env.*` files (or are explicitly opt-in with a default).
6. Cross-cutting: any new module-level `createClient(...)` call is a smell. Any new `process.env.SUPABASE_SERVICE_ROLE_KEY` reference outside admin paths is a smell.
7. Report what's consistent and what diverges. Push back on divergences with the simpler conforming alternative.
