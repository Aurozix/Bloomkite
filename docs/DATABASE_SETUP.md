# Database Setup Guide

## Overview

Bloomkite uses a **programmatic migration and seed system** similar to Prisma, but adapted for Supabase PostgreSQL.

**Commands:**
```bash
npm run db:migrate          # Run all pending migrations
npm run db:seed:mandatory   # Seed essential data (roles, permissions)
npm run db:seed:optional    # Seed test/optional data
npm run db:seed:expanded    # Alias for optional seeds
npm run db:seed             # Seed all (mandatory + optional if --expanded used)
```

---

## Setup Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Configure:
   - **Project Name**: `bloomkite`
   - **Database Password**: Create a strong password (you'll need this for migrations)
   - **Region**: Singapore
4. Wait for project creation (3-5 minutes)

### Step 2: Get Supabase Credentials

In Supabase dashboard → Settings → API, copy:

1. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Format: `https://xxxxx.supabase.co`

2. **Publishable Key** (anon key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Starts with `eyJhbGc...`

3. **Secret Key** (service role) → `SUPABASE_SERVICE_ROLE_KEY`
   - Starts with `eyJhbGc...` (different from publishable key)

### Step 3: Create `.env.local`

In your project root, create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_PASSWORD=your_database_password

# Google OAuth (skip for now, configure later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important**: `SUPABASE_DB_PASSWORD` is the password you set when creating the Supabase project. This is required for programmatic migrations.

### Step 4: Install Dependencies

```bash
npm install
```

This installs `pg`, `ts-node`, and other required packages for migrations and seeding.

### Step 5: Run Migrations

```bash
npm run db:migrate
```

This will:
1. Connect to your Supabase database
2. Create the `migrations` tracking table
3. Execute `database/migrations/001_init_schema.sql`
4. Record the migration as completed

**Expected output:**
```
✅ Connected to database
✅ Executed 001_init_schema.sql
✅ Successfully executed 1 migration(s)
```

### Step 6: Seed Data

```bash
npm run db:seed:mandatory
```

This will:
1. Create 4 roles: investor, advisor, admin, moderator
2. Create 10 permissions
3. Map permissions to roles

**Expected output:**
```
🌱 Starting seed process...
📋 Running mandatory seeds...
  → Seeding permissions...
     ✓ Permissions ready
  → Seeding roles...
     ✓ Roles ready
  → Seeding role permissions...
     ✓ Role permissions ready
✅ Mandatory seeds completed
🎉 Seed process completed successfully!
```

### Step 7: Configure Google OAuth (Optional for now)

See `SPRINT_1_SETUP.md` for Google OAuth setup instructions.

### Step 8: Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## Migration System Explained

### File Structure

```
database/
├── migrations/
│   └── 001_init_schema.sql    # SQL schema definitions
├── seed.ts                     # Seed orchestrator
└── seeds/
    ├── 001_mandatory.ts        # Essential data (roles, permissions)
    └── 002_optional.ts         # Test/optional data
```

### How Migrations Work

1. **Migration File**: `database/migrations/001_init_schema.sql`
   - Contains all table definitions, indexes, RLS policies, functions

2. **Migration Tracker**: `scripts/migrate.ts`
   - Reads migration files from `database/migrations/`
   - Executes only **pending** migrations (not already run)
   - Records executed migrations in `public.migrations` table
   - Ensures idempotency (safe to run multiple times)

3. **Execution**:
   ```bash
   npm run db:migrate
   ```
   - Connects to database using `SUPABASE_DB_PASSWORD`
   - Creates `public.migrations` table
   - Executes pending `.sql` files in alphabetical order
   - Marks each migration as executed

### How Seeds Work

1. **Seed Orchestrator**: `database/seed.ts`
   - Imports seed modules (001_mandatory.ts, 002_optional.ts)
   - Runs mandatory seeds by default
   - Runs optional seeds only with `--expanded` flag

2. **Individual Seed Modules**:
   - `001_mandatory.ts`: Roles, permissions, role_permissions (essential)
   - `002_optional.ts`: Test users, demo data (for development)

3. **Idempotent Logic**:
   - Each seed checks if data already exists
   - Only inserts data if not found
   - Safe to run multiple times

4. **Execution**:
   ```bash
   npm run db:seed:mandatory     # Just mandatory
   npm run db:seed:optional      # Mandatory + optional
   npm run db:seed:expanded      # Same as optional (alias)
   ```

---

## Database Schema

### Tables Created by Migration

**Authentication & Authorization:**
- `roles` - Role definitions (investor, advisor, admin, moderator)
- `permissions` - Permission definitions
- `role_permissions` - Many-to-many: roles ↔ permissions
- `users` - User accounts (synced from Supabase Auth)
- `user_roles` - Many-to-many: users ↔ roles

**User Profiles:**
- `investor_profiles` - Investor-specific data
- `advisor_profiles` - Advisor-specific data

**Tracking:**
- `migrations` - Created by `npm run db:migrate` to track executed migrations

### Data Seeded by Seed Scripts

**Mandatory Seeds** (always run):
- 4 roles with descriptions
- 10 permissions with descriptions
- Role-permission mappings

**Optional Seeds** (run with `--expanded`):
- Test/demo data for development (currently placeholder)

---

## Troubleshooting

### "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD"

**Solution**: 
- Check `.env.local` exists in project root
- Verify you added all required variables
- Restart terminal/IDE for env vars to load

### "FATAL: password authentication failed for user 'postgres'"

**Solution**:
- Verify `SUPABASE_DB_PASSWORD` is correct
- It's the password you set when creating the Supabase project
- Check it's not expired or changed in Supabase dashboard

### "relation 'public.roles' does not exist"

**Solution**:
- Run `npm run db:migrate` first
- Ensure migration completed without errors
- Check Supabase dashboard → SQL Editor for any errors

### "RLS policy violation when inserting..."

**Solution**:
- This happens if seeding with anon key (wrong)
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Service role key bypasses RLS for seeding

### "ts-node: command not found"

**Solution**:
- Run `npm install` again
- Ensure `devDependencies` section exists in `package.json`
- May need to install globally: `npm install -g ts-node`

---

## Command Reference

### Migration Commands

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Run all pending migrations |

### Seed Commands

| Command | Purpose |
|---------|---------|
| `npm run db:seed` | Run mandatory seeds only |
| `npm run db:seed:mandatory` | Run mandatory seeds (explicit) |
| `npm run db:seed:optional` | Run mandatory + optional seeds |
| `npm run db:seed:expanded` | Alias for `db:seed:optional` |

### Full Setup Sequence

```bash
# Install dependencies
npm install

# Run migrations (creates schema)
npm run db:migrate

# Seed essential data
npm run db:seed:mandatory

# Start development server
npm run dev
```

---

## Adding New Migrations

1. Create new file in `database/migrations/`:
   ```
   database/migrations/002_add_feature_table.sql
   ```

2. Write SQL schema:
   ```sql
   CREATE TABLE feature_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     -- columns...
   );
   ```

3. Run migration:
   ```bash
   npm run db:migrate
   ```

Migration system automatically finds and executes new files.

---

## Adding New Seeds

1. Create new file in `database/seeds/`:
   ```
   database/seeds/003_feature_seed.ts
   ```

2. Implement seed function:
   ```typescript
   export async function seedFeature(supabase: SupabaseClient) {
     // Check if data exists
     // Insert if not present
   }
   ```

3. Import in `database/seed.ts` and call from orchestrator

4. Run seed:
   ```bash
   npm run db:seed:mandatory
   ```

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Get credentials and add to `.env.local`
3. ✅ Run `npm install`
4. ✅ Run `npm run db:migrate`
5. ✅ Run `npm run db:seed:mandatory`
6. ✅ Configure Google OAuth (see SPRINT_1_SETUP.md)
7. ✅ Run `npm run dev` and test auth flow

Once setup complete, all database configuration is done. Ready for Sprint 2 (Core Calculators).
