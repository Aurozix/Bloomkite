-- Detach public.users from Supabase Auth (auth.users).
-- After this, public.users is the canonical user table owned by Auth.js / Prisma.

-- Drop the trigger that synced auth.users -> public.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the cross-schema FK so Prisma can introspect cleanly.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
