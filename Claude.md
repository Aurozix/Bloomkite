# Bloomkite — Developer Reference

## Working guidelines
- State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently.
- Push back when a simpler approach exists. If something is unclear, stop and ask.
- Touch only what the task requires. Don't "improve" adjacent code, comments, or formatting.
- Remove imports/variables/functions that YOUR changes made unused. Don't remove pre-existing dead code unless asked.
- For multi-step tasks, state a brief plan with verifiable success criteria before coding.
- After implementation, verify: run type-check, run tests, confirm the build passes.


## Model Selection
- **Haiku**: As much as possible, use Haiku


## Auth & data stack

Authentication is **Auth.js v5 (NextAuth)** with JWT sessions, not Supabase Auth.
Database access is **Prisma**, not the Supabase JS client.

### Auth surface
- `auth.config.ts` — edge-safe shared config (Google provider, route gating).
  Imported by `middleware.ts`.
- `auth.ts` — full config: Prisma adapter, Credentials provider (bcrypt + Zod),
  JWT callback that loads roles, `signIn` callback that blocks unverified emails.
  Exports `auth`, `handlers`, `signIn`, `signOut`.
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handlers (signin, signout,
  callback, session, csrf, providers, error).
- `lib/auth-helpers.ts` — server-side helpers: `requireAuth()`,
  `requireRole(...names)`, `requirePermission(name)`, `getCurrentUser()`.
  **Every protected route handler uses one of these.**
- `types/next-auth.d.ts` — augments `Session` and `JWT` with `id`, `roles`,
  `currentRole`, `emailVerified`.

### Auth pages
- `/auth/signin`, `/auth/signup`, `/auth/check-email`, `/auth/role-selection`,
  `/auth/forgot-password`, `/auth/reset-password`.
- `/api/auth/signup`, `/api/auth/verify-email`, `/api/auth/forgot-password`,
  `/api/auth/reset-password`, `/api/auth/select-role`.
- Email verification + password reset use **Resend** + `@react-email/components`.
  Templates live in `emails/`. Send code in `lib/email.ts`.

### Data layer
- `lib/db.ts` — singleton `PrismaClient`.
- `prisma/schema.prisma` — single source of truth. PascalCase models, camelCase
  fields, DB column names preserved via `@map`. Auth.js models (`User`,
  `Account`, `VerificationToken`) plus custom `PasswordResetToken`.
- Migrations under `prisma/migrations/`. The first migration `0_init` was
  baselined from the existing DB; `0001_drop_rls` removed all RLS policies.
- Legacy raw SQL migrations under `database/migrations/` are the historical
  baseline only — do not add new ones. New schema changes go through
  `npm run prisma:migrate:dev -- --name <name>`.

### Storage
Supabase **Storage** is still used for file uploads (advisor credentials,
article images). The three storage routes still import `@supabase/supabase-js`
for that purpose only — not for auth or DB. Migrating storage to a different
provider is an open item.

### What was removed
- All Supabase Auth flows (`@supabase/ssr`, GoTrue, cookie-based session).
- The `auth.users` -> `public.users` FK and the `handle_new_user` trigger.
- All RLS policies on the public schema (auth.uid() no longer exists in the
  Postgres request context).
- Legacy auth API routes: `/api/auth/set-session`, `/api/auth/session` (a thin
  back-compat shim exists; new code should use `useSession()` instead),
  `/api/auth/logout`, `/api/auth/callback` (legacy custom), `/api/auth/test-login`,
  `/api/auth/switch-role` (role switching is now `session.update({ currentRole })`).

### Required env vars
- `DATABASE_URL`, `DIRECT_URL` — Prisma connection (pooled + direct).
- `AUTH_SECRET` — Auth.js JWT signing key. Generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth credentials. Set
  authorized redirect URI to `<APP_URL>/api/auth/callback/google` in Google
  Cloud Console.
- `RESEND_API_KEY`, `EMAIL_FROM` — Resend transactional email. Until a domain
  is verified in Resend, use `onboarding@resend.dev` as `EMAIL_FROM`.
