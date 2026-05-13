-- Drop row-level security from every table in the public schema.
-- RLS was meaningful when Supabase Auth provided auth.uid() in the request
-- context; under Auth.js + Prisma, authorization is enforced at the
-- application layer, not the database. Keeping RLS without auth.uid()
-- would leave dead policies that confuse future maintenance.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop every policy on every table in public.
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;

  -- Disable RLS on every public table.
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',
      r.tablename
    );
  END LOOP;
END $$;

-- The handle_new_user trigger and the public.users -> auth.users FK
-- were already dropped in prisma/sql/drop_supabase_auth_coupling.sql
-- during the initial migration. Re-issuing the drops here is idempotent
-- so a fresh DB also ends up clean.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
