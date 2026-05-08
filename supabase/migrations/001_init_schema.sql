-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTHORIZATION & ROLES TABLES
-- ============================================================================

-- Roles table: Define available roles (investor, advisor, admin)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table: Define granular permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping (many-to-many)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Users table (synced with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Role mapping (many-to-many)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- ============================================================================
-- INVESTOR PROFILES
-- ============================================================================

CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  phone_number VARCHAR(15),
  date_of_birth DATE,
  gender VARCHAR(1),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(6),
  risk_profile VARCHAR(20), -- Conservative, Moderate, Aggressive
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ADVISOR PROFILES
-- ============================================================================

CREATE TABLE advisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  phone_number VARCHAR(15),
  date_of_birth DATE,
  gender VARCHAR(1),
  company_name VARCHAR(200),
  designation VARCHAR(100),
  pan_number VARCHAR(10),
  gst_number VARCHAR(50),
  address_line1 VARCHAR(300),
  address_line2 VARCHAR(300),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(6),
  website_url TEXT,
  bio TEXT,
  profile_image_url TEXT,
  workflow_status VARCHAR(50), -- pending, approved, rejected
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_user_id ON advisor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_workflow_status ON advisor_profiles(workflow_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can view their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users are inserted via trigger from auth.users
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- INVESTOR PROFILES POLICIES
-- Investors can view their own profile
CREATE POLICY "investor_profiles_select_own" ON investor_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Investors can update their own profile
CREATE POLICY "investor_profiles_update_own" ON investor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Investors can insert their own profile
CREATE POLICY "investor_profiles_insert" ON investor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Advisors can view investor profiles (for plan sharing context)
CREATE POLICY "investor_profiles_select_advisors" ON investor_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'advisor'
    )
  );

-- ADVISOR PROFILES POLICIES
-- Advisors can view their own profile
CREATE POLICY "advisor_profiles_select_own" ON advisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Advisors can update their own profile
CREATE POLICY "advisor_profiles_update_own" ON advisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Advisors can insert their own profile
CREATE POLICY "advisor_profiles_insert" ON advisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can view approved advisor profiles
CREATE POLICY "advisor_profiles_select_public" ON advisor_profiles
  FOR SELECT USING (
    workflow_status = 'approved' AND is_verified = TRUE
  );

-- USER ROLES POLICIES
-- Users can view their own roles
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ROLES & PERMISSIONS POLICIES
-- All authenticated users can view roles and permissions
CREATE POLICY "roles_select_authenticated" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "permissions_select_authenticated" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_select_authenticated" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- SEED DATA FOR ROLES AND PERMISSIONS
-- ============================================================================

INSERT INTO roles (name, description) VALUES
  ('investor', 'Individual investor seeking financial advice'),
  ('advisor', 'Licensed financial advisor'),
  ('admin', 'Platform administrator'),
  ('moderator', 'Content moderator');

INSERT INTO permissions (name, description) VALUES
  ('read_calculators', 'Access financial calculators'),
  ('read_articles', 'Read published articles'),
  ('read_advisors', 'Browse advisor profiles'),
  ('manage_profile', 'Edit own profile'),
  ('publish_articles', 'Create and submit articles'),
  ('moderate_content', 'Approve/reject content'),
  ('manage_users', 'Manage user accounts'),
  ('view_analytics', 'View platform analytics'),
  ('approve_advisors', 'Approve advisor credentials'),
  ('manage_roles', 'Manage roles and permissions');

-- Investor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'investor' AND p.name IN ('read_calculators', 'read_articles', 'read_advisors', 'manage_profile');

-- Advisor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'advisor' AND p.name IN ('read_calculators', 'read_articles', 'manage_profile', 'publish_articles');

-- Admin permissions (all)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin';

-- Moderator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator' AND p.name IN ('moderate_content', 'read_articles', 'read_advisors');

-- ============================================================================
-- TRIGGER: Auto-create users table entry from auth.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.user_metadata->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
