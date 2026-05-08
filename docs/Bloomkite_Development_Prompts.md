# Bloomkite Development Prompts - Master Document

**Purpose**: Comprehensive prompts organized by development phase. Each prompt is designed to be executed sequentially and includes all required context.

**Reference**: See `Bloomkite_Master_RAD.md` for complete requirements, business logic, calculator formulas, and architecture.

**Tech Stack**: Next.js 14, Next.js API Routes, Supabase PostgreSQL, Google Auth, Cloudflare R2, SendGrid, Razorpay

---

## Table of Contents

- [Phase 1: MVP (Weeks 1-26)](#phase-1-mvp-weeks-1-26)
  - [Sprint 1: Foundation - Auth & Database (Weeks 1-4)](#sprint-1-foundation---auth--database-weeks-1-4)
  - [Sprint 2: Core Calculators (Weeks 5-10)](#sprint-2-core-calculators-weeks-5-10)
  - [Sprint 3: Advisor System (Weeks 11-16)](#sprint-3-advisor-system-weeks-11-16)
  - [Sprint 4: Monetization (Weeks 17-22)](#sprint-4-monetization-weeks-17-22)
  - [Sprint 5: MVP Polish & Launch (Weeks 23-26)](#sprint-5-mvp-polish--launch-weeks-23-26)
- [Phase 2: Growth (Months 7-9)](#phase-2-growth-months-7-9)
- [Phase 3: Scale (Months 10-12)](#phase-3-scale-months-10-12)

---

# PHASE 1: MVP (WEEKS 1-26)

**Phase Goal**: Build a functioning marketplace with 5 core calculators, advisor discovery, and subscription monetization. Target: 500+ users, 50+ advisors, ready for launch.

**RAD References**: Section 2.1-2.6, Section 3.2-3.10, Section 5.2

---

## SPRINT 1: Foundation - Auth & Database (Weeks 1-4)

### Prompt 1.1: Supabase Setup, Database Schema & RLS Policies

**Scope**: Set up Supabase PostgreSQL project, design complete schema, implement Row-Level Security (RLS).

**What to Build**:
1. **Supabase Project Setup**
   - Create Supabase project (free tier)
   - Configure region (Singapore - closest to India)
   - Enable backup retention (30 days)

2. **Database Schema** (14 core tables from RAD 3.4):
   ```
   Users Layer:
     - users (auth sync from Supabase Auth)
     - investor_profiles
     - advisor_profiles

   Credentials & Expertise:
     - advisor_credentials
     - advisor_expertise

   Social:
     - advisor_followers
     - investor_follows

   Financial Planning:
     - financial_plans
     - plan_shares
     - plan_feedback

   Content:
     - articles
     - forum_threads
     - forum_answers

   Transactions:
     - subscriptions
     - invoices
   ```

3. **Schema Requirements**:
   - All tables: `id` (UUID primary key), `created_at`, `updated_at` timestamps
   - Foreign keys with CASCADE/RESTRICT delete policies
   - Indexes on: foreign keys, search columns (email, name), status fields
   - Soft deletes where applicable (articles, forum posts)

4. **Row-Level Security (RLS)**:
   - Investors see only their own profile, plans, follows
   - Advisors see only their own credentials, articles, followers
   - Public read on: articles, advisor profiles (published), forum posts
   - Admin sees all data

**Success Criteria**:
- [ ] Supabase project connected and accessible
- [ ] All 14 tables created with correct relationships
- [ ] RLS policies tested: investor can't see other investor's data
- [ ] Advisor can only modify own credentials
- [ ] Public articles visible to all users
- [ ] Database diagram documented (for reference)

**Constraints**:
- Use UUID for all primary keys (security)
- No manual id sequences
- Timezone: UTC for all timestamps
- Naming: snake_case for columns, lowercase tables

**Time Estimate**: 4-5 days

---

### Prompt 1.2: Google Authentication & User Management API

**Scope**: Implement Google OAuth signup/login, create user profiles, JWT token management.

**What to Build**:
1. **Google Auth Integration** (Next.js auth)
   - Next Auth.js setup with Google provider
   - Callback handler to sync user to Supabase
   - Store Google ID in user profile
   - Handle first-time signup (role selection: Investor/Advisor)

2. **API Routes** (`app/api/auth/`):
   ```
   POST /api/auth/callback/google      (Google OAuth callback)
   POST /api/auth/logout                (Clear session)
   GET  /api/auth/session               (Current user info)
   POST /api/auth/verify-email          (OTP for additional verification)
   ```

3. **User Profile Creation**:
   - Investor: name, email, phone, location, risk profile (initially empty)
   - Advisor: name, email, phone, company, specializations (empty on signup)
   - Both: avatar URL (Cloudflare R2 placeholder)

4. **JWT Token Flow**:
   - Supabase Auth issues JWT on signup
   - Store in secure HTTP-only cookie
   - Validate JWT on every API request
   - Refresh token logic (7-day expiry)

**Success Criteria**:
- [ ] Google login works (creates user in Supabase)
- [ ] First-time user prompted to choose role (Investor/Advisor)
- [ ] User profile created in investor_profiles or advisor_profiles
- [ ] JWT token stored securely
- [ ] GET /api/auth/session returns current user
- [ ] Logout clears session
- [ ] Manual testing: signup → login → logout cycle

**Constraints**:
- Use Supabase Auth (no custom JWT implementation)
- No password storage (Google Auth only for MVP)
- HTTP-only cookies for security
- CORS configured for Vercel domain

**Time Estimate**: 3-4 days

---

### Prompt 1.3: Frontend Foundation - Navigation, Layouts, Home Page

**Scope**: Build Next.js frontend structure, navigation, basic pages, responsive design.

**What to Build**:
1. **App Structure** (Next.js App Router):
   ```
   app/
   ├─ layout.tsx          (Root layout with Navbar, Footer)
   ├─ page.tsx            (Home page)
   ├─ auth/
   │  ├─ signin/          (Google login button)
   │  └─ callback         (OAuth callback)
   ├─ dashboard/
   │  └─ page.tsx         (User hub - shows plans, calculators)
   ├─ calculators/
   │  ├─ page.tsx         (Calculator list)
   │  └─ [name]/
   │     └─ page.tsx      (Individual calculator)
   ├─ advisors/
   │  ├─ page.tsx         (Search & discovery)
   │  └─ [id]/            (Advisor profile)
   ├─ subscriptions/
   │  └─ page.tsx         (Pricing & plans)
   └─ admin/
      └─ page.tsx         (Moderation panel)
   ```

2. **Components**:
   - Navbar (with login/logout, user dropdown)
   - Footer
   - Hero section (home page)
   - Calculator card component
   - Advisor card component
   - Loading skeleton
   - Error boundary

3. **Styling**:
   - Tailwind CSS (no external UI library)
   - Responsive design (mobile-first)
   - Color scheme: Professional (blue/gray)
   - Typography: System fonts for performance

4. **Navigation**:
   - Public pages: Home, About, Calculators, Advisors, Pricing
   - Protected pages: Dashboard, Plans, My Profile, Admin
   - Role-based routing (Advisor sees different pages than Investor)

**Success Criteria**:
- [ ] Home page loads in < 2 seconds
- [ ] Navigation responsive on mobile/tablet/desktop
- [ ] Login/logout navigation works
- [ ] Protected routes redirect to signin
- [ ] Role-based navigation (Advisor/Investor see different menus)
- [ ] Mobile viewport tested

**Constraints**:
- Tailwind CSS only (no Material-UI, Bootstrap)
- Next.js App Router (not Pages Router)
- Mobile-first responsive design
- No third-party component library

**Time Estimate**: 4-5 days

---

## SPRINT 2: Core Calculators (Weeks 5-10)

### Prompt 2.1: Calculator Engine - 5 Core Calculators & API

**Scope**: Implement 5 MVP calculators with validation, formulas, and API endpoints.

**What to Build**:
1. **Calculator Implementations** (TypeScript utils in `lib/calculators/`):
   - Goal Planner
   - Cash Flow Analyzer
   - Net Worth Calculator
   - Priority Ranker
   - Insurance Needs

   **For each calculator**:
   - Input validation (Zod schema)
   - Mathematical formula implementation
   - Error handling (descriptive messages)
   - Output formatting (2 decimals, INR currency)
   - Edge case handling
   - Unit tests

2. **API Routes** (`app/api/calculators/`):
   ```
   POST /api/calculators/goal-planner       (Calculate)
   POST /api/calculators/cash-flow          (Calculate)
   POST /api/calculators/net-worth          (Calculate)
   POST /api/calculators/priority-ranker    (Calculate)
   POST /api/calculators/insurance          (Calculate)
   ```

3. **Database** (for saving calculations):
   - `financial_plans` table with JSON field storing calculator results
   - `plan_shares` table for sharing with advisors
   - Timestamps for version history

4. **Frontend Pages** (`app/calculators/[name]/`):
   - Dynamic calculator page component
   - Input form with validation messages
   - Results display (formatted output)
   - Save plan button
   - Share with advisor button

**Success Criteria**:
- [ ] All 5 calculators have correct formulas (verify against CALCULATOR_REQUIREMENTS.md)
- [ ] API accepts POST requests and returns JSON
- [ ] Input validation prevents invalid data (negative values, etc.)
- [ ] Output formatted correctly (₹ symbol, 2 decimals)
- [ ] Unit tests pass (100% formula accuracy)
- [ ] Plans saved to database
- [ ] Frontend: user can run calculator and see results
- [ ] Manual testing: 5-10 example calculations match expected outputs

**Calculator-Specific Formulas** (from RAD 2.3):
1. Goal Planner: FV = PV × (1+r)^n + PMT × (((1+r)^n-1)/r)
2. Cash Flow: Sum(income) - Sum(expenses)
3. Net Worth: Sum(assets) - Sum(liabilities)
4. Priority Ranker: Sort goals by urgency score
5. Insurance: (Monthly expenses × 12 × years) - existing coverage

**Constraints**:
- Use Decimal.js or BigDecimal for financial precision (no floating point)
- All currency in INR (₹)
- Max 30s API timeout
- Validate all inputs server-side

**Time Estimate**: 6 days

---

### Prompt 2.2: Risk Profiler Calculator & Risk Assessment

**Scope**: Build risk questionnaire, map to risk profile, recommend asset allocation.

**What to Build**:
1. **Risk Questionnaire** (from RAD 2.3):
   - 8-10 questions: age, income, experience, risk appetite, time horizon, financial goals
   - Scoring: 1-5 scale per question
   - Output: Risk score (1-100)

2. **Risk Profile Mapping**:
   - Conservative (1-30): 60% debt, 40% equity
   - Moderate (31-70): 40% debt, 60% equity
   - Aggressive (71-100): 20% debt, 80% equity

3. **API Route**:
   ```
   POST /api/calculators/risk-profiler
   Input: { answers: [1,2,3,4,5,4,3,2] }
   Output: { 
     riskScore: 65, 
     profile: "Moderate", 
     allocation: { debt: 40, equity: 60, gold: 0 },
     explanation: "Based on your age and experience..."
   }
   ```

4. **Frontend**:
   - Multi-step form (questions presented one at a time for better UX)
   - Results page with profile badge, allocation chart
   - Save to user profile

5. **Database**:
   - Store risk_questionnaire responses in `financial_plans`
   - Link to user in investor_profiles.risk_profile

**Success Criteria**:
- [ ] Questionnaire validates: all questions answered
- [ ] Score calculation correct (sum/average logic)
- [ ] Profile mapping works (score → Conservative/Moderate/Aggressive)
- [ ] Asset allocation recommendations logical
- [ ] Frontend: questionnaire renders, scores calculate, results display
- [ ] Risk profile saved to investor profile

**Constraints**:
- Simple linear scoring (no complex ML)
- Deterministic (same answers = same result)
- Questions must be financial-neutral (no leading)

**Time Estimate**: 3-4 days

---

## SPRINT 3: Advisor System (Weeks 11-16)

### Prompt 3.1: Advisor Profiles, Credentials & Search

**Scope**: Build advisor registration, credential upload, public profiles, search.

**What to Build**:
1. **Advisor Profile Pages**:
   - Edit profile (name, bio, photo, experience summary)
   - Upload credentials (certificates, licenses, documents)
   - Declare expertise (products, services they specialize in)
   - Publish credentials (pending approval → published)

2. **API Routes** (`app/api/advisors/`):
   ```
   POST   /api/advisors/profile          (Create/update profile)
   POST   /api/advisors/credentials      (Upload credential)
   GET    /api/advisors/[id]             (Get public profile)
   GET    /api/advisors/search           (Search & filter)
   POST   /api/advisors/[id]/follow      (Follow advisor)
   DELETE /api/advisors/[id]/follow      (Unfollow)
   ```

3. **Credential Management**:
   - Upload certificate/license image (to Cloudflare R2)
   - Store metadata: issuer, license number, expiry date
   - Admin approval workflow (pending → approved → published)
   - Investors see only approved credentials

4. **Advisor Search**:
   - Filter by: expertise, location, ratings, followers
   - Search by: name, company, specialization
   - Sort by: relevance, followers, newest
   - Pagination (20 per page)

5. **Database**:
   - `advisor_profiles`: bio, company, location, photo URL
   - `advisor_credentials`: certificate, license, issuer, number, expiry
   - `advisor_expertise`: products, services, specializations
   - `advisor_followers`: follower relationships (investor → advisor)

**Success Criteria**:
- [ ] Advisor signup creates profile in advisor_profiles
- [ ] Credential upload stores in R2 and DB
- [ ] Admin panel shows pending credentials
- [ ] Search works: filters, sorting, pagination
- [ ] Public profile page displays approved credentials only
- [ ] Follow/unfollow button toggles status
- [ ] Investor can see who they follow
- [ ] Manual: upload credential, search for advisor, follow

**Constraints**:
- Credentials must have admin approval before showing
- File upload max 5MB per document
- Only certified advisors can publish articles

**Time Estimate**: 5-6 days

---

### Prompt 3.2: Article Publishing & Content Moderation

**Scope**: Build article creation, moderation workflow, publication.

**What to Build**:
1. **Article Creation** (Advisor only):
   - Editor page (`app/calculators/articles/create`)
   - Title, content (markdown), tags, category
   - Featured image upload (Cloudflare R2)
   - Auto-save to drafts
   - Submit for approval

2. **Moderation Workflow**:
   - Admin panel (`app/admin/content`)
   - List pending articles with preview
   - Approve/reject with reason
   - Published articles auto-visible

3. **Article Display**:
   - Public article list (`app/articles`)
   - Sort by: newest, trending, category
   - Single article page with author info
   - Comment section (read-only in MVP)
   - Share buttons (LinkedIn, Twitter, etc.)

4. **API Routes** (`app/api/articles/`):
   ```
   POST   /api/articles                  (Create draft)
   PUT    /api/articles/[id]             (Update draft)
   POST   /api/articles/[id]/submit      (Submit for approval)
   GET    /api/articles                  (List published)
   GET    /api/articles/[id]             (Get single)
   POST   /api/admin/articles/[id]/approve    (Admin action)
   POST   /api/admin/articles/[id]/reject     (Admin action)
   ```

5. **Database**:
   - `articles`: title, content, author_id, status (draft/pending/published/rejected)
   - `articles_metadata`: tags, category, featured_image_url, published_at

**Success Criteria**:
- [ ] Advisor creates article (saved as draft)
- [ ] Submit for approval changes status
- [ ] Admin sees pending articles
- [ ] Approve publishes to public
- [ ] Rejected articles shown to author with reason
- [ ] Published articles visible on public list
- [ ] Article page shows author credentials
- [ ] Manual: create article → submit → admin approves → public visible

**Constraints**:
- Markdown content (not rich HTML)
- Image upload max 2MB
- Auto-reject if > 5000 words (quality gate)
- No mentions of specific stocks (SEBI compliance)

**Time Estimate**: 4-5 days

---

### Prompt 3.3: Forum - Q&A & Community Discussions

**Scope**: Build basic Q&A forum where investors ask questions, advisors answer.

**What to Build**:
1. **Forum Structure**:
   - Investors post questions (`/forum/ask`)
   - Advisors answer questions (`/forum/questions/[id]/answer`)
   - Voting on answers (helpful/not helpful)
   - Search questions by keyword

2. **API Routes** (`app/api/forum/`):
   ```
   POST   /api/forum/questions           (Post question)
   GET    /api/forum/questions           (List questions)
   GET    /api/forum/questions/[id]      (Get single)
   POST   /api/forum/questions/[id]/answers   (Post answer)
   POST   /api/forum/answers/[id]/vote        (Vote on answer)
   ```

3. **Database**:
   - `forum_questions`: title, content, author_id, status, created_at
   - `forum_answers`: content, author_id, question_id, votes_count
   - `forum_answer_votes`: user_id, answer_id, vote_type (helpful/unhelpful)

4. **Frontend**:
   - Ask question page (Investor)
   - Questions list with answer count
   - Single question page with answers
   - Vote buttons on answers
   - Mark answer as "best answer" (question asker only)

**Success Criteria**:
- [ ] Investor can post question
- [ ] Advisor can post answer to question
- [ ] Questions show answer count
- [ ] Voting works (increment/decrement)
- [ ] Manual: post question → advisor answers → vote

**Constraints**:
- Questions require title + content
- Answers at least 50 characters
- No moderation in MVP (can be added Phase 2)

**Time Estimate**: 3-4 days

---

## SPRINT 4: Monetization (Weeks 17-22)

### Prompt 4.1: Subscription Model & Payment Setup

**Scope**: Create subscription plans, Razorpay integration, payment webhooks.

**What to Build**:
1. **Subscription Plans**:
   - Free: ₹0 (always)
   - Silver: ₹299/month
   - Gold: ₹999/month
   - Store in `subscription_plans` table

2. **Subscription Management API** (`app/api/subscriptions/`):
   ```
   GET    /api/subscriptions/plans            (List all plans)
   POST   /api/subscriptions/create           (Create subscription)
   POST   /api/subscriptions/[id]/cancel      (Cancel subscription)
   GET    /api/subscriptions/my-subscription  (Current user's subscription)
   POST   /api/webhooks/razorpay              (Payment webhook)
   ```

3. **Razorpay Integration**:
   - Create order → return checkout URL
   - Handle webhook: payment success/failure
   - Update subscription_status in DB
   - Generate invoice on success

4. **Database**:
   - `subscription_plans`: name, price, features (JSON), active
   - `subscriptions`: user_id, plan_id, status (active/cancelled/expired), start_date, end_date
   - `invoices`: subscription_id, amount, issued_date, pdf_url

5. **Frontend**:
   - Pricing page (`/pricing`) showing all 3 tiers
   - Subscribe button → Razorpay checkout
   - My Subscription page (`/dashboard/subscription`)
   - Cancel subscription button

**Success Criteria**:
- [ ] Plans visible on pricing page
- [ ] Subscribe button initiates Razorpay checkout
- [ ] Successful payment: subscription created with status "active"
- [ ] Failed payment: user notified, can retry
- [ ] Invoice generated and accessible
- [ ] Webhook validates and updates DB
- [ ] Cancelled subscription shows end date
- [ ] Manual: subscribe → Razorpay → success → subscription active

**Constraints**:
- No refunds (SaaS model)
- Auto-renewal (unless cancelled)
- Failed payment: retry 3x over 5 days
- All prices in INR

**Time Estimate**: 5-6 days

---

### Prompt 4.2: Feature Gating by Subscription Level

**Scope**: Restrict features based on subscription tier.

**What to Build**:
1. **Feature Matrix** (from RAD 2.5):
   - Free: 5 basic calculators (Goal, Cash Flow, Net Worth, Insurance, Priority Ranker)
   - Silver: All 15 calculators, unlimited sharing, email support
   - Gold: Silver + 1 free consultation/month, personalized recommendations

2. **Gating Logic**:
   - Frontend: Show/hide features based on subscription level
   - Backend: API checks subscription before processing
   - Middleware: Auth middleware validates subscription on protected routes

3. **Implementation**:
   ```typescript
   // Middleware example
   const checkSubscriptionTier = (tier: 'free' | 'silver' | 'gold') => {
     return async (req, res, next) => {
       const user = await getUser(req);
       const subscription = await getSubscription(user.id);
       if (tierRank(subscription.plan) < tierRank(tier)) {
         return res.status(403).json({ error: 'Feature requires ' + tier });
       }
       next();
     }
   }
   ```

4. **Paywall UX**:
   - Try calculator → hit limit → show upgrade modal
   - "Upgrade to Silver" button
   - Benefits messaging

**Success Criteria**:
- [ ] Free users see "5 Calculators" label
- [ ] Clicking 6th calculator shows paywall
- [ ] Silver users can access all 15
- [ ] API rejects free users calling Gold endpoints
- [ ] Backend validates subscription on each gated API call
- [ ] Manual: free account → try calculator → paywall → upgrade → full access

**Constraints**:
- No leaking premium content in frontend code
- Backend always validates (don't trust client)
- Graceful downgrade if subscription expires

**Time Estimate**: 2-3 days

---

### Prompt 4.3: Invoices & Email Notifications

**Scope**: Generate invoices, send confirmation emails.

**What to Build**:
1. **Invoice Generation**:
   - Trigger: on successful Razorpay payment
   - Contents: customer info, plan details, amount, tax (if applicable), date
   - Format: PDF
   - Store in Cloudflare R2

2. **Email Notifications** (SendGrid):
   - Payment confirmation email (with invoice PDF)
   - Subscription renewal reminder (7 days before)
   - Subscription expiry warning (3 days after)
   - Renewal failed notification (with retry link)

3. **API Routes**:
   ```
   GET    /api/invoices                  (List user's invoices)
   GET    /api/invoices/[id]/download    (Download PDF)
   ```

4. **Email Templates** (SendGrid):
   - `payment-success.html`
   - `renewal-reminder.html`
   - `renewal-failed.html`

**Success Criteria**:
- [ ] PDF invoice generated on payment
- [ ] Invoice stored in R2 with correct URL
- [ ] Payment confirmation email sent
- [ ] Email includes download link
- [ ] Manual: subscribe → check email → click link → invoice downloads

**Constraints**:
- Invoice PDF includes legal disclaimer
- Email templates include unsubscribe link
- SendGrid API rate limits: 100/day free tier

**Time Estimate**: 3 days

---

## SPRINT 5: MVP Polish & Launch (Weeks 23-26)

### Prompt 5.1: Plan Sharing & Advisor Feedback

**Scope**: Allow investors to share plans with advisors, advisors to add feedback.

**What to Build**:
1. **Plan Sharing Flow**:
   - Investor saves calculator result → "Share with Advisor" button
   - Select advisor(s) to share with
   - Optional message to advisor
   - Advisor receives email notification

2. **API Routes** (`app/api/plans/`):
   ```
   POST   /api/plans/share               (Share plan with advisor)
   GET    /api/plans/shared-with-me      (Advisor: plans shared with them)
   POST   /api/plans/[id]/feedback       (Advisor: add feedback)
   GET    /api/plans/[id]/feedback       (Get feedback)
   ```

3. **Database**:
   - `plan_shares`: plan_id, investor_id, advisor_id, status (pending/viewed/responded)
   - `plan_feedback`: plan_id, advisor_id, feedback_content, created_at

4. **Frontend**:
   - Plan detail page with share button
   - Advisor dashboard showing shared plans
   - Feedback form for advisor
   - Investor sees advisor's feedback on plan

**Success Criteria**:
- [ ] Investor shares plan with advisor
- [ ] Advisor receives email notification
- [ ] Advisor sees plan in dashboard
- [ ] Advisor adds feedback
- [ ] Investor sees feedback
- [ ] Manual: create plan → share → advisor views → provides feedback → investor sees

**Constraints**:
- Only published/verified advisors can receive shares
- Investor controls who can access their data
- Feedback stored as plain text (no rich formatting in MVP)

**Time Estimate**: 3 days

---

### Prompt 5.2: Admin Dashboard & Analytics

**Scope**: Build basic admin panel for moderation and system overview.

**What to Build**:
1. **Admin Dashboard** (`/admin`):
   - Overview: total users, advisors, MRR, active subscriptions
   - User management: search, view, deactivate accounts
   - Content moderation: pending articles, flagged posts
   - Advisor approval: pending credentials, verification
   - Analytics: signup trend, subscription adoption, usage

2. **API Routes** (`app/api/admin/`):
   ```
   GET    /api/admin/dashboard           (Overview stats)
   GET    /api/admin/users               (List users with filters)
   POST   /api/admin/users/[id]/deactivate
   GET    /api/admin/content/pending     (Pending articles)
   POST   /api/admin/articles/[id]/approve
   POST   /api/admin/articles/[id]/reject
   GET    /api/admin/analytics/signup-trend
   GET    /api/admin/analytics/subscription-revenue
   ```

3. **Analytics**:
   - Daily user signups (line chart)
   - Subscription revenue by tier (bar chart)
   - Active users by type (Investor/Advisor)

**Success Criteria**:
- [ ] Admin can view user count, MRR
- [ ] Search users by email
- [ ] Pending articles shown with approve/reject
- [ ] Analytics charts display
- [ ] Manual: admin login → view dashboard → moderate content

**Constraints**:
- Admin role only (checked via JWT claims)
- No chart library (use Canvas API or simple HTML tables initially)

**Time Estimate**: 4 days

---

### Prompt 5.3: Testing, Documentation & MVP Launch

**Scope**: Comprehensive testing, documentation, deployment preparation.

**What to Build**:
1. **Testing**:
   - Unit tests for all calculators (100% formula accuracy)
   - Integration tests for API routes (auth, subscription flow)
   - E2E tests for critical user journeys (signup → calculator → subscribe)
   - Manual testing checklist

2. **Documentation**:
   - API documentation (endpoint list, request/response examples)
   - User guide (how to sign up, run calculator, subscribe)
   - Admin guide (moderation, analytics)
   - Deployment runbook

3. **Performance & Security**:
   - Lighthouse audit (mobile score > 85)
   - Security: CORS configured, input validation, SQL injection prevention
   - Load testing: simulate 100 concurrent users
   - Database query optimization

4. **Deployment**:
   - Vercel configuration (environment variables)
   - Supabase backup verification
   - Razorpay production keys setup
   - SendGrid template verification
   - Domain setup (if applicable)

5. **Launch Checklist**:
   - [ ] All tests passing
   - [ ] No console errors in production
   - [ ] Mobile responsiveness verified
   - [ ] Email notifications working
   - [ ] Subscription flow tested end-to-end
   - [ ] Admin dashboard accessible
   - [ ] Analytics showing data
   - [ ] Backup strategy in place
   - [ ] Uptime monitoring configured

**Success Criteria**:
- [ ] All unit tests pass
- [ ] E2E tests cover signup → calculator → subscribe
- [ ] Lighthouse performance > 85
- [ ] No security vulnerabilities (CORS, injection)
- [ ] Load test: 100 users → avg response < 500ms
- [ ] Documentation complete
- [ ] Team can run project locally and deploy to production

**Time Estimate**: 4-5 days

**MVP Launch**: End of Week 26
- 500+ registered users
- 50+ verified advisors
- 5 core calculators
- Free + paid tiers
- Basic forum

---

# PHASE 2: GROWTH (MONTHS 7-9)

**Phase Goal**: Expand features, improve user engagement, launch advanced calculators.

### Prompt 2.1: Advanced Calculators (10 more, Weeks 27-34)

**Scope**: Implement 10 advanced calculators (Future Value, Target Value, Rate Finder, Tenure Finder, EMI Calculator, EMI Capacity, Partial Payment, EMI Change, Interest Rate Change, Risk Profiler).

**Key Focus**:
- Same structure as Phase 1 calculators
- Input validation + formula accuracy
- Complex amortization schedules (EMI)
- Unit tests for all formulas
- Frontend pages with charts/visualizations

**Reference**: CALCULATOR_REQUIREMENTS.md (all 10 calculator specifications)

**Success Criteria**:
- [ ] All 10 calculators working, tested, deployed
- [ ] EMI calculator generates amortization table
- [ ] Charts display results visually (e.g., loan payoff timeline)
- [ ] Manual testing: 5+ examples per calculator

---

### Prompt 2.2: Plan Sharing Enhancements & Advisor Tools (Weeks 35-39)

**Scope**: 
- Enhanced plan comparison (side-by-side advisor recommendations)
- Advisor analytics dashboard (clients served, response rate, rating)
- Email summaries (weekly digest for investors)
- Plan versioning (history of plan changes)

**Key Features**:
- Investor: compare advisor feedback side-by-side
- Advisor: see which investors viewed their profile
- Both: plan revision tracking

---

## PHASE 3: SCALE (MONTHS 10-12)

**Phase Goal**: Complete feature set, optimization, roadmap for growth.

### Prompt 3.1: Mobile App & Responsive Optimization (Weeks 40-43)

**Scope**: Ensure full mobile responsiveness, PWA support, offline fallback.

**Key Focus**:
- Mobile-first design verification
- PWA manifest + service worker
- Offline calculator functionality
- Performance optimization (images, code splitting)

---

### Prompt 3.2: Advanced Analytics & Referral System (Weeks 44-48)

**Scope**:
- User behavior analytics (Mixpanel/PostHog integration)
- Referral tracking and rewards
- Advisor commission system (calculation + payouts)
- Revenue reporting dashboard

---

### Prompt 3.3: Year 1 Retrospective & Roadmap (Weeks 49-52)

**Scope**:
- Analyze Phase 1 & 2 metrics vs targets
- Document learnings and improvements
- Plan Phase 4 (months 13+): video consultations, API marketplace, etc.
- Prepare for next year's growth

---

## EXECUTION NOTES

### How to Use These Prompts

1. **Phase 1 (MVP - Weeks 1-26)**:
   - Execute Sprints 1-5 sequentially
   - Each Sprint consists of 1-3 prompts
   - After each prompt completes, verify success criteria before moving next
   - Weekly checkins: code review, test verification, deployment

2. **Phase 2 & 3**:
   - After MVP launches, review Phase 2 prompts
   - Adjust based on user feedback from Phase 1
   - Same execution pattern (prompt → verify → deploy)

3. **Prompt Context**:
   - Each prompt assumes previous prompts completed
   - Reference RAD sections for requirements
   - Include all necessary context in prompt execution
   - Test locally before deploying to production

### Success Metrics (Check Throughout)

**Phase 1 Target (Week 26)**:
- 5,000+ registered users
- 150+ verified advisors
- 100+ articles published
- 150+ paid subscribers
- ₹45,000 MRR
- 99.5% uptime

**Phase 2 Target (Month 9)**:
- 10,000+ users
- 400+ advisors
- All 15 calculators live
- 500+ paid subscribers
- ₹150,000 MRR

**Phase 3 Target (Month 12)**:
- 20,000+ users
- 800+ advisors
- 1,000+ paid subscribers
- ₹300,000 MRR
- 70-80% content approval rate

---

## Document Control

| Version | Date | Status |
|---------|------|--------|
| 1.0 | May 2026 | Ready for Phase 1 Execution |

**Last Updated**: May 2026

**Next Review**: End of Week 4 (assess progress, adjust timelines)

---

**End of Master Development Prompts Document**

This document is the single source of truth for phased development execution. Reference RAD sections for business logic, calculator formulas, and architecture details.
