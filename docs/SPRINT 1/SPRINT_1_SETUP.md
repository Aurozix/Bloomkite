# Sprint 1: Foundation Setup Guide

**Status**: Implementation Complete - Manual Setup Required  
**Last Updated**: 2026-05-07  
**Estimated Setup Time**: 30-45 minutes

---

## Overview

Sprint 1 implementation is complete with the following components:

✅ **Part 1**: Database Schema (PostgreSQL with RBAC)  
✅ **Part 2**: Authentication API Routes  
✅ **Part 3**: Frontend Foundation & Pages  

This guide walks you through setting up Supabase and configuring Google OAuth.

---

## Part 1: Supabase Project Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Configure:
   - **Project Name**: `bloomkite`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Singapore (closest to India)
   - **Pricing Plan**: Free tier
5. Click "Create new project" (this takes 3-5 minutes)

### Step 2: Run Database Migrations

Once Supabase project is created:

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `supabase/migrations/001_init_schema.sql`
4. Paste into SQL editor
5. Click **Run** (or Cmd+Enter)
6. Verify: All tables created without errors

**Expected output**: Tables created for:
- Users, roles, user_roles, permissions, role_permissions
- investor_profiles, advisor_profiles
- All RLS policies enabled

### Step 3: Get Supabase Keys

1. Go to **Project Settings** → **API**
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. Create `.env.local` file in project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Part 2: Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Search "Google+ API"
   - Click **Enable**

4. Create OAuth 2.0 credentials:
   - Go to **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Web Application**
   - Configure:
     - **Name**: Bloomkite
     - **Authorized JavaScript origins**: `http://localhost:3000`
     - **Authorized redirect URIs**: `http://localhost:3000/auth/callback`
   - Click **Create**

5. Copy credentials:
   - `Client ID` → `GOOGLE_CLIENT_ID`
   - `Client Secret` → `GOOGLE_CLIENT_SECRET`

### Step 2: Configure Google OAuth in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Click **Google**
3. Enable the provider
4. Paste:
   - `Client ID` (from Google Cloud)
   - `Client Secret` (from Google Cloud)
5. Click **Save**

### Step 3: Configure Redirect URLs

In Supabase **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: Add `http://localhost:3000/auth/callback`

---

## Part 3: Install Dependencies & Run Project

### Step 1: Install Node Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Step 3: Test the Application

1. **Home Page**: Navigate to `http://localhost:3000`
   - Should show hero section with "Get Started" button

2. **Sign In**: Click "Get Started" or go to `/auth/signin`
   - Should show "Sign in with Google" button

3. **Google OAuth Flow**:
   - Click "Sign in with Google"
   - Sign in with your Google account
   - Should redirect to `/auth/role-selection`

4. **Role Selection**: 
   - Choose "Investor" or "Advisor"
   - Click "Continue"
   - Should create user_roles entry and profile
   - Should redirect to `/dashboard`

5. **Dashboard**:
   - Should show user email and roles
   - Should show role-specific content
   - Should have "Sign Out" button

---

## Part 4: Verify Setup Checklist

### Database
- [ ] Supabase project created
- [ ] All 7 tables created (users, roles, user_roles, permissions, role_permissions, investor_profiles, advisor_profiles)
- [ ] RLS policies active
- [ ] Trigger for auto-creating users when they sign up

### Authentication
- [ ] Google OAuth credentials obtained
- [ ] Google OAuth enabled in Supabase
- [ ] Redirect URLs configured
- [ ] `.env.local` file created with all keys

### Frontend
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Home page loads
- [ ] Google sign-in works end-to-end
- [ ] Role selection creates user_roles entry
- [ ] Dashboard shows user info and role-based content
- [ ] Sign out clears session

### Code Quality
- [ ] No TypeScript errors: `npm run type-check` (if configured)
- [ ] No console errors in browser

---

## Part 5: Database Schema Overview

### Users & Authorization

**users** - Synced from Supabase Auth
```
id (UUID) | email | full_name | avatar_url | created_at | updated_at
```

**roles** - Role definitions
```
id | name (investor, advisor, admin, moderator) | description
```

**user_roles** - Many-to-many: users ↔ roles
```
id | user_id | role_id
```

**permissions** - Permission definitions
```
id | name (read_calculators, publish_articles, etc.) | description
```

**role_permissions** - Many-to-many: roles ↔ permissions
```
id | role_id | permission_id
```

### User Profiles

**investor_profiles** - Investor-specific data
```
id | user_id | display_name | phone_number | city | state | risk_profile | bio | created_at | updated_at
```

**advisor_profiles** - Advisor-specific data
```
id | user_id | display_name | company_name | designation | pan_number | workflow_status (pending/approved/rejected) | is_verified | created_at | updated_at
```

---

## Part 6: RLS (Row-Level Security) Policies

### Investor Access
- Can view own investor_profiles
- Can see approved advisor_profiles only
- Cannot see other investor profiles

### Advisor Access
- Can view own advisor_profiles
- Can see other advisor profiles (approved only)
- Can see investor profiles (for plan sharing context)

### Admin Access
- Can view all records

### Public Access
- Can view published articles
- Can view approved advisor profiles

---

## Part 7: API Endpoints (Sprint 1)

All endpoints available at `http://localhost:3000/api/auth/`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/session` | Get current user + roles + profiles |
| POST | `/logout` | Sign out user |
| GET | `/callback` | Google OAuth callback handler |

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart dev server

### "Google sign-in not working"
- Verify Google OAuth credentials in Supabase Auth settings
- Check redirect URLs are correctly configured
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Supabase (not needed in .env for OAuth)

### "RLS policy violation"
- Ensure RLS policies were created (check SQL output)
- Verify user has proper role assigned in user_roles table
- Check Supabase logs for detailed error

### "Role selection fails"
- Check browser console for errors
- Verify roles table has 'investor' and 'advisor' entries (should be auto-seeded)
- Check Supabase logs

### TypeScript errors with Supabase types
- Install types: `npm install --save-dev @types/node`
- Regenerate Supabase types (optional): `npx supabase gen types typescript`

---

## Next Steps (After Sprint 1 Setup)

Once all verification checks pass:

1. **Sprint 2** (Weeks 5-10): Build Core Calculators
   - Financial formulas
   - API endpoints for calculator logic
   - Frontend calculator pages

2. **Sprint 3** (Weeks 11-16): Advisor System
   - Credential upload
   - Article publishing & moderation
   - Forum Q&A

3. **Sprint 4** (Weeks 17-22): Monetization
   - Subscription model
   - Razorpay integration
   - Feature gating

---

## Document Control

| Version | Date | Status |
|---------|------|--------|
| 1.0 | 2026-05-07 | Sprint 1 Implementation Complete |

**Last Updated**: 2026-05-07  
**Next Review**: After setup completion and testing

---

## Support

If you encounter issues:
1. Check troubleshooting section above
2. Review Supabase dashboard logs
3. Check browser console for JavaScript errors
4. Verify all environment variables are set correctly

---

**Sprint 1 is ready. Follow the setup guide above to complete configuration.**
