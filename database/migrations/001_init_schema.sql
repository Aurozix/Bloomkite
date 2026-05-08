-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTHENTICATION & AUTHORIZATION TABLES
-- ============================================================================

-- Roles table (investor, advisor, admin, moderator)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table (fine-grained access control)
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many: roles <-> permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- Users table (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many: users <-> roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- ============================================================================
-- USER PROFILES
-- ============================================================================

-- Investor profile
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  phone_number VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  risk_profile VARCHAR(50),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advisor profile
CREATE TABLE IF NOT EXISTS public.advisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  phone_number VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  company_name VARCHAR(255),
  designation VARCHAR(100),
  pan_number VARCHAR(20),
  gst_number VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  website_url TEXT,
  bio TEXT,
  profile_image_url TEXT,
  workflow_status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_investor_profiles_user_id ON public.investor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_user_id ON public.advisor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_workflow_status ON public.advisor_profiles(workflow_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own user record
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can see their own roles
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can view all roles and permissions (needed for UI)
CREATE POLICY roles_select_authenticated ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY permissions_select_authenticated ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY role_permissions_select_authenticated ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Investors can view and update their own profile
CREATE POLICY investor_profiles_select_own ON public.investor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY investor_profiles_update_own ON public.investor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY investor_profiles_insert ON public.investor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Advisors can view and update their own profile
CREATE POLICY advisor_profiles_select_own ON public.advisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY advisor_profiles_update_own ON public.advisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY advisor_profiles_insert ON public.advisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can view approved advisor profiles
CREATE POLICY advisor_profiles_select_public ON public.advisor_profiles
  FOR SELECT USING (workflow_status = 'approved' AND is_verified = TRUE);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
