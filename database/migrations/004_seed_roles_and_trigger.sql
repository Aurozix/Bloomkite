-- ============================================================================
-- SEED DATA: ROLES, PERMISSIONS, ROLE-PERMISSION MAPPINGS
-- Extracted from supabase/migrations/001_init_schema.sql during migration
-- consolidation. All inserts are idempotent via ON CONFLICT DO NOTHING.
-- ============================================================================

INSERT INTO public.roles (name, description) VALUES
  ('investor', 'Individual investor seeking financial advice'),
  ('advisor', 'Licensed financial advisor'),
  ('admin', 'Platform administrator'),
  ('moderator', 'Content moderator')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (name, description) VALUES
  ('read_calculators', 'Access financial calculators'),
  ('read_articles', 'Read published articles'),
  ('read_advisors', 'Browse advisor profiles'),
  ('manage_profile', 'Edit own profile'),
  ('publish_articles', 'Create and submit articles'),
  ('moderate_content', 'Approve/reject content'),
  ('manage_users', 'Manage user accounts'),
  ('view_analytics', 'View platform analytics'),
  ('approve_advisors', 'Approve advisor credentials'),
  ('manage_roles', 'Manage roles and permissions')
ON CONFLICT (name) DO NOTHING;

-- Investor permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'investor'
  AND p.name IN ('read_calculators', 'read_articles', 'read_advisors', 'manage_profile')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Advisor permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'advisor'
  AND p.name IN ('read_calculators', 'read_articles', 'manage_profile', 'publish_articles')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin permissions (all)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Moderator permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'moderator'
  AND p.name IN ('moderate_content', 'read_articles', 'read_advisors')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- AUTH TRIGGER: auto-create public.users entry from auth.users
-- The function was originally defined in 001_init_schema.sql; this re-applies
-- it idempotently to match the consolidated source of truth.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
