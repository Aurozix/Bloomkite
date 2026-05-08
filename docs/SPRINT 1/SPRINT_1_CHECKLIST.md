# Sprint 1: Quick Checklist

**Print this out or use it to track your progress through the setup**

---

## Setup Phase 1: Supabase (15 minutes)

### Create Project
- [ ] Go to supabase.com
- [ ] Create new project: `bloomkite`
- [ ] Set region to Singapore
- [ ] Wait for project creation (3-5 minutes)

### Database Migration
- [ ] Open SQL Editor in Supabase dashboard
- [ ] Copy `supabase/migrations/001_init_schema.sql`
- [ ] Paste into SQL editor
- [ ] Click Run
- [ ] Verify no errors
- [ ] Check tables created:
  - [ ] `roles` table exists
  - [ ] `permissions` table exists
  - [ ] `users` table exists
  - [ ] `investor_profiles` table exists
  - [ ] `advisor_profiles` table exists
  - [ ] RLS is enabled on all tables

### Get API Keys
- [ ] Go to Settings → API
- [ ] Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Create `.env.local` file with these keys

---

## Setup Phase 2: Google OAuth (10 minutes)

### Google Cloud Console
- [ ] Go to console.cloud.google.com
- [ ] Create new project or select existing
- [ ] Search for "Google+ API" and enable it
- [ ] Go to Credentials
- [ ] Create OAuth 2.0 Client ID (Web Application)
  - [ ] Name: Bloomkite
  - [ ] Authorized origins: `http://localhost:3000`
  - [ ] Redirect URIs: `http://localhost:3000/auth/callback`
- [ ] Copy `Client ID` → `GOOGLE_CLIENT_ID` in `.env.local`
- [ ] Copy `Client Secret` → `GOOGLE_CLIENT_SECRET` in `.env.local`

### Supabase Auth Setup
- [ ] Go to Supabase → Authentication → Providers
- [ ] Click Google
- [ ] Enable provider
- [ ] Paste Client ID (from Google Cloud)
- [ ] Paste Client Secret (from Google Cloud)
- [ ] Click Save

### Redirect URLs
- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Site URL: `http://localhost:3000`
- [ ] Redirect URLs: Add `http://localhost:3000/auth/callback`

---

## Setup Phase 3: Project Setup (5 minutes)

### Environment Variables
- [ ] Create `.env.local` file in project root
- [ ] Add all 6 variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

### Install & Run
- [ ] Run: `npm install`
- [ ] Run: `npm run dev`
- [ ] Check console output
- [ ] Server should be running on port 3000

---

## Testing Phase 1: Manual Browser Testing (10 minutes)

### Home Page
- [ ] Open http://localhost:3000
- [ ] See hero section with "Get Started" button
- [ ] Page loads in < 2 seconds
- [ ] Design looks professional

### Sign In Flow
- [ ] Click "Get Started" button
- [ ] Redirect to `/auth/signin`
- [ ] See "Sign in with Google" button
- [ ] Click button
- [ ] Google OAuth popup opens
- [ ] Sign in with your Google account
- [ ] Redirect to `/auth/role-selection`

### Role Selection
- [ ] See two options: Investor, Advisor
- [ ] Select "Investor"
- [ ] Click "Continue"
- [ ] Should redirect to `/dashboard`
- [ ] Should see your email displayed

### Dashboard
- [ ] See welcome message with your email
- [ ] See role displayed as "investor"
- [ ] See Investor Tools section:
  - [ ] "Financial Calculators" link
  - [ ] "Find Advisors" link
- [ ] See "Sign Out" button

### Sign Out
- [ ] Click "Sign Out" button
- [ ] Redirect to `/auth/signin`
- [ ] Session cleared

---

## Testing Phase 2: Repeat with Advisor Role

### Role Selection Test
- [ ] Sign in again (with Google)
- [ ] This time select "Advisor"
- [ ] Click "Continue"

### Dashboard Verification
- [ ] Should see Advisor Tools section instead
- [ ] Should see "My Profile" section
- [ ] Should see "Pending Approval" status
- [ ] Should see "Publish Articles" link

---

## Testing Phase 3: Database Verification (Optional)

### In Supabase Dashboard
- [ ] Go to Table Editor
- [ ] Open `users` table
- [ ] Should see your user entry
- [ ] Email should match your Google account

- [ ] Open `user_roles` table
- [ ] Should see entry with your user_id and role_id

- [ ] Open `investor_profiles` table (if you tested investor)
- [ ] Should see entry with your user_id

- [ ] Open `advisor_profiles` table (if you tested advisor)
- [ ] Should see entry with your user_id
- [ ] workflow_status should be "pending"

---

## Final Verification Checklist

### Frontend Works
- [ ] Home page loads ✓
- [ ] Google OAuth works ✓
- [ ] Role selection works ✓
- [ ] Dashboard loads ✓
- [ ] Sign out works ✓

### Database Works
- [ ] Tables created ✓
- [ ] RLS policies active ✓
- [ ] Users created on signup ✓
- [ ] Profiles created on role selection ✓

### API Works
- [ ] `/api/auth/session` returns user data ✓
- [ ] `/api/auth/logout` clears session ✓
- [ ] `/api/auth/callback` handles OAuth ✓

### Environment Setup
- [ ] `.env.local` has all 6 variables ✓
- [ ] Supabase keys are correct ✓
- [ ] Google OAuth credentials are correct ✓

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| "Missing Supabase env variables" | Check `.env.local` exists and has correct keys |
| "Google sign-in not working" | Verify Google OAuth in Supabase settings |
| "Role selection fails" | Check browser console, verify roles table has data |
| "Dashboard shows 401" | Supabase Auth session invalid, sign in again |
| "RLS policy violation" | Check Supabase logs, verify user has correct role |
| "TypeScript errors" | Run `npm install`, restart dev server |

---

## Done! ✅

Once all checkboxes above are checked, Sprint 1 is complete and verified.

**Next Step**: Read `SPRINT_1_IMPLEMENTATION_SUMMARY.md` to understand what was built.

**After That**: Proceed to Sprint 2 (Core Calculators) - see `Bloomkite_Development_Prompts.md` for details.

---

**Estimated Total Setup Time**: 30-45 minutes  
**Status**: Ready for configuration
