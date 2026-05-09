# Bloomkite Master RAD (Requirements & Design)
## Complete Requirements and Design Document

**Version**: 1.0  
**Last Updated**: May 2026  
**Status**: Ready for Development  
**Audience**: Development Team, Architects, Product Managers  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Requirements](#2-business-requirements)
3. [Technical Architecture](#3-technical-architecture)
4. [Design Principles & Constraints](#4-design-principles--constraints)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Success Metrics](#6-success-metrics)

---

## 1. Executive Summary

### What is Bloomkite?

**Bloomkite** is a B2C financial advisory marketplace and planning platform that bridges professional financial advisors with individual investors seeking personalized guidance.

### Core Value Proposition

- **For Investors**: Access curated advisors, use 15 financial calculators, participate in community learning
- **For Advisors**: Build credibility, reach clients at scale, publish expertise, generate leads
- **For Platform**: Revenue through subscriptions and marketplace dynamics

### Key Features

- 15 financial calculators (goal planning, loans, insurance, investments)
- Advisor discovery and credentialing system
- Financial plan creation and sharing
- Community forum with expert moderation
- Subscription-based monetization

### Market Context

- **Category**: Fintech advisory (financial advisory + SaaS + community)
- **Market Size**: Large (₹100Cr+ TAM in India)
- **Competition**: BankBazaar, MoneyThor, traditional advisors
- **Differentiation**: Integrated advisor marketplace + transparent plan comparison

### Tech Stack (Solo Developer, Bootstrapped)

| Component | Choice | Cost |
|-----------|--------|------|
| **Frontend** | Next.js 14 (Vercel) | ₹0 (free tier) |
| **Backend** | Next.js API Routes | Included |
| **Database** | Supabase PostgreSQL | ₹0-2,000/month |
| **Auth** | Google Auth | Free |
| **File Storage** | Cloudflare R2 | ₹0 (free tier 10GB) |
| **Email** | SendGrid | ₹0 (free tier) → ₹1,000/month at scale |
| **Payments** | Razorpay | 2% + ₹0 per transaction |
| **Dev Tool** | Claude Code | Included |

**Total Year 1 Cost**: ₹0-3,000/month (MVP-Scale)

### Timeline & Scope

- **Duration**: 12 months solo development
- **Phasing**: MVP (month 6) → Full feature (month 12)
- **Target**: 10,000+ users, 150+ advisors, ₹45k+ MRR by month 6

---

## 2. Business Requirements

### 2.1 User Roles & Journeys

#### INVESTOR (Individual Seeking Financial Advice)

**Motivations**:
- Find trusted advisors for 1-on-1 consultation
- Access financial planning tools
- Learn from expert content
- Plan for major life goals
- Compare advisor recommendations

**Typical Journey**:
1. Sign up with email/password
2. Complete risk questionnaire
3. Browse and follow advisors
4. Run financial calculators
5. Save and share plans with advisors
6. Subscribe for premium features

**Key Needs**:
- Easy advisor discovery
- Trusted credentialing system
- Accurate calculators
- Privacy (control data sharing)
- Transparent advice comparison

---

#### ADVISOR (Licensed Financial Professional)

**Motivations**:
- Build professional credibility
- Acquire new clients at scale
- Publish thought leadership
- Manage clients efficiently
- Generate income

**Typical Journey**:
1. Sign up and create detailed profile
2. Upload credentials (CFP, CFA, etc.)
3. Declare expertise (products, services)
4. Publish articles/insights
5. Answer investor questions
6. Receive shared financial plans
7. Provide feedback and guidance

**Key Needs**:
- Professional credentialing system
- Platform for content/thought leadership
- Client lead generation
- Reputation/follower tracking
- Consultation tools

---

#### ADMIN (Platform Operator)

**Key Responsibilities**:
- User account management
- Content moderation (articles, forum)
- Advisor credentialing approval
- Platform configuration
- Compliance monitoring
- User support

---

### 2.2 Business Processes

#### Process 1: Advisor Verification & Credentialing

```
Advisor Signup → Profile Creation → Credential Upload → 
Admin Review → Approval/Rejection → Public Profile Activation
```

**Key Points**:
- Credentials include: licenses, certifications, awards, education, experience
- Admin manually verifies credentials
- Once approved, advisor becomes searchable
- Can publish articles, answer questions
- Followers can see all credentials

#### Process 2: Financial Plan Sharing

```
Investor Creates Plan → Selects Advisors → Shares Plan & Message → 
Advisor Notified → Advisor Reviews → Advisor Adds Feedback → 
Investor Sees Recommendations
```

**Key Points**:
- Investor controls who sees their data
- Can share with multiple advisors simultaneously
- Advisors can add comments/feedback
- Enables comparison of advice quality
- Can be done offline after initial sharing

#### Process 3: Content Moderation

```
Author Creates Article/Post → Auto-Filtering → Manual Review → 
Approval/Rejection → Publication or Archive
```

**Key Points**:
- All advisor content must be approved before publication
- Check for: accuracy, compliance, quality, appropriateness
- Moderators must ensure SEBI compliance
- Community health is critical for trust

#### Process 4: Subscription & Payment

```
User Browses Plans → Selects Plan → Payment Gateway (Razorpay) → 
Subscription Created → Invoice Generated → Features Enabled
```

**Key Points**:
- Recurring billing with auto-renewal
- Failed payment retry (3 attempts)
- Graceful degradation if subscription expires
- Prorated for mid-cycle changes

---

### 2.3 Financial Calculators (15 Total)

#### Calculator Portfolio Overview

| Phase | Category | Calculators | Purpose |
|-------|----------|-----------|---------|
| MVP | Savings & Goals | Goal Planner, Priority Ranker | Calculate savings needs |
| MVP | Budget & Analysis | Cash Flow Analyzer, Net Worth | Analyze financial position |
| MVP | Insurance | Insurance Needs | Determine coverage gaps |
| MVP | Investments | Risk Profiler | Assess risk tolerance |
| Phase 2 | Investments | Future Value, Target Value, Rate Finder, Tenure Finder | Investment calculations |
| Phase 2 | Loans | EMI Calculator, EMI Capacity | Loan affordability |
| Phase 3 | Loans (Advanced) | Partial Payment, EMI Change, Rate Change | Loan optimization |

---

#### MVP Calculators (5 - Weeks 1-6)

**1. Goal Planner**
- **Purpose**: Calculate monthly/annual savings needed to reach a goal
- **Inputs**: Goal amount, current savings, tenure, inflation rate, growth rate, investment rate
- **Key Formula**: FV = PV × (1+r)^n + PMT × (((1+r)^n-1)/r), adjusted for inflation
- **Output**: Future value, gap, required monthly investment, recommendations
- **Example**: "To save ₹50L in 10 years with 5% inflation, you need to save ₹44,000/month"

**2. Cash Flow Analyzer**
- **Purpose**: Analyze monthly income vs expenses
- **Inputs**: Income items, expense categories (recurring only)
- **Output**: Monthly/yearly net cash flow, surplus/deficit, savings rate
- **Example**: "Monthly surplus: ₹35,000 (58% savings rate)"

**3. Net Worth Calculator**
- **Purpose**: Calculate total net worth (assets - liabilities)
- **Inputs**: Asset categories (savings, investments, real estate, gold), liability categories
- **Output**: Total assets, liabilities, net worth, asset allocation
- **Example**: "Net worth: ₹44L (₹77L assets - ₹33L liabilities)"

**4. Priority Ranker**
- **Purpose**: Help investors prioritize financial goals when resources are limited by ranking goals based on urgency
- **Inputs**: Multiple financial goals, each with an urgency level (scale 1-9, where 1 = most urgent, 9 = least urgent)
- **Processing Logic**:
  1. Group all goals by their urgency level
  2. Within each urgency group, sort goals alphabetically by name
  3. Assign sequential priority rankings (1st, 2nd, 3rd, etc.)
- **Output**: Ranked goal list with priority number, goal name, urgency level, and urgency description
- **Example**:
  - Emergency Fund (Urgency: 1) → Priority 1
  - Education Fund (Urgency: 2) → Priority 2
  - Home Purchase (Urgency: 2) → Priority 3
  - Retirement (Urgency: 5) → Priority 4
- **Business Rules**:
  - Urgency level must be 1-9 (lower number = higher priority)
  - Goals with same urgency ordered alphabetically
  - At least one goal must be provided
  - Urgency level 4 signals goal should be deleted/removed
  - Output is deterministic (same inputs always produce same ranked order)

**5. Insurance Needs**
- **Purpose**: Determine required life insurance coverage based on income, income stability/predictability, and identify coverage gaps
- **Inputs**: 
  - Annual income
  - Income stability (STABLE or FLUCTUATING)
  - Income predictability (PREDICTABLE or UNPREDICTABLE)
  - Existing insurance coverage
- **Processing Logic**:
  - Step 1: Determine coverage multiplier based on stability & predictability matrix:
    | Stability | Predictability | Multiplier | Risk |
    |---|---|---|---|
    | STABLE | PREDICTABLE | 10x | Low |
    | STABLE | UNPREDICTABLE | 15x | Medium |
    | FLUCTUATING | PREDICTABLE | 10x | Medium |
    | FLUCTUATING | UNPREDICTABLE | 15x | High |
  - Step 2: Calculate required insurance = Annual Income × Multiplier
  - Step 3: Calculate gap = Required Insurance - Existing Insurance (or 0 if existing exceeds required)
- **Output**: Required insurance amount, coverage multiplier used, existing insurance (echoed), insurance gap
- **Example**:
  - Annual Income: ₹10,00,000
  - Stability: FLUCTUATING, Predictability: UNPREDICTABLE → Multiplier: 15x
  - Required: ₹10,00,000 × 15 = ₹1,50,00,000
  - Existing: ₹25,00,000
  - Gap: ₹1,50,00,000 - ₹25,00,000 = ₹1,25,00,000
- **Business Rules**:
  - Income must be > 0
  - Existing insurance must be ≥ 0
  - Multiplier determined by BOTH stability AND predictability (not just one)
  - Gap is zero if existing insurance exceeds required
  - All amounts based on annual income

---

#### Phase 2 Calculators (5 - Weeks 7-10)

**6. Risk Profiler**
- **Purpose**: Assess investor risk tolerance and deliver personalized portfolio allocation recommendations
- **Input**: Responses to 16-question questionnaire about investment experience, knowledge, and risk tolerance
- **Processing Logic**:
  - Step 1: Score each answer based on risk-seeking behavior
  - Step 2: Sum all scores to get total risk score
  - Step 3: Map total score to risk category (0-30 Conservative ... 62+ Aggressive)
  - Step 4: Return portfolio allocation percentages for that category

**Risk Profiler Questionnaire (16 Questions)**

| Q# | Question | Answers & Scores |
|---|---|---|
| 1 | In comparison to your peer groups, how would you rate your willingness to take risk while making financial decisions? | Very high risk: 1, High risk: 2, Moderate risk: 3, Low risk: 4, No risk: 5 |
| 2 | How familiar are you with investment schemes and financial markets in India? | Multiple schemes experience: 1, Different returns understanding: 2, Some experience: 4, Very little/none: 5 |
| 3 | Have you ever invested before in stock markets, mutual funds, or unit linked insurance? | Yes: 0, No: 0 → *If Yes, go to Q3A; if No, skip to Q4* |
| 3A | How would you describe your experience with such investment schemes? *(Conditional)* | Positive, never misguided: 1, Cautious to avoid mistakes: 3, Lost money, very cautious: 5 |
| 4 | If your investments fell 20% in 6 months, what would you do? | Buy more for growth: 1, Add to extent of loss: 2, Wait and hold: 3, Withdraw to secured schemes: 5 |
| 5 | What is the most aggressive investment you have made? | Direct shares: 1, Mutual funds: 2, Real estate/Gold/Insurance: 3, Own home for staying: 4, Bank savings/RDs: 5 |
| 6 | How much could your investment fall in value over 12 months before you feel concerned? | >50%: 1, Up to 50%: 2, Up to 25%: 3, Up to 10%: 4, Up to 5%: 5, Any fall: 6 |
| 7 | How long before you would need to access your capital? | >7 years: 1, 5-7 years: 2, 3-5 years: 3, 2-3 years: 4, <2 years: 5 |
| 8 | How much emergency fund have you set aside? | <1 month expenses: 1, 3-6 months: 3, >6 months: 5 |
| 9 | How much risk to counteract inflation over longer term? | Comfortable with short/medium losses: 1, Conscious but limit losses: 3, Little tolerance for losses: 5 |
| 10 | More concerned about potential gains or possible losses? | Gains: 1, Both equally: 3, Losses: 5 |
| 11 | What return do you expect from portfolio? | 8%+ p.a.: 1, 6-8% p.a.: 2, 4-6% p.a.: 3, 2-4% p.a.: 4, 0-2% p.a.: 5 |
| 12 | Have you experienced investment loss? How did it feel? | Unconcerned, see opportunities: 1, Unconcerned, no more investing: 2, Concerned: 3, Very concerned: 4, Never experienced: 5 |
| 13 | What risk degree acceptable for desired return? | Maximize returns regardless: 1, High risk for large increase: 2, Moderate risk for medium increase: 3, Limited risk for slight increase: 4, Capital security required: 5 |
| 14 | What are your income requirements from investments? | No income, growth only: 1, Small income, mainly growth: 2, Equal income & growth: 3, Large income, some growth: 4, Income only: 5 |
| 15 | Have you borrowed to invest? | Managed funds/shares/structured: 1, Investment/rental property: 3, Never outside own home: 5 |
| 16 | How comfortable was borrowing to invest? | Very confident: 1, Confident: 2, Concerned: 3, Very concerned: 4, Never borrowed: 5 |

**Score Mapping to Risk Category**

| Total Score | Risk Category | Portfolio Allocation |
|---|---|---|
| 0-30 | Conservative | 30% Stocks, 50% Bonds, 20% Cash |
| 31-40 | Moderately Conservative | 40% Stocks, 45% Bonds, 15% Cash |
| 41-51 | Moderate | 50% Stocks, 40% Bonds, 10% Cash |
| 52-61 | Moderately Aggressive | 65% Stocks, 30% Bonds, 5% Cash |
| 62+ | Aggressive | 80% Stocks, 15% Bonds, 5% Cash |

- **Output**: Risk score (total), risk category, recommended equity %, debt %, cash %
- **Example**: Investor scores 28 points → Conservative category → Recommend 30% Stocks, 50% Bonds, 20% Cash
- **Business Rules**:
  - Investor must answer all questions (no partial submissions)
  - Each answer must be a valid choice from questionnaire
  - Allocation percentages always sum to 100%
  - Score range boundaries are fixed
  - One response per investor (updates replace previous)

**7. Future Value**
- **Purpose**: How much will ₹X grow at Y% return over Z years
- **Formula**: FV = P × (1+r)^n
- **Example**: "₹1L at 10% p.a. for 10 years = ₹2.59L"

**8. Target Value**
- **Purpose**: How much to invest monthly to reach a target
- **Formula**: PMT = FV / [((1+r)^n-1)/r]
- **Example**: "To reach ₹50L in 10 years at 10% p.a., invest ₹1.95L/month"

**9. Rate Finder**
- **Purpose**: What rate needed to reach a goal
- **Example**: "To grow ₹10L to ₹50L in 10 years, need 17.5% p.a."

**10. Tenure Finder**
- **Purpose**: How long to reach a goal at given rate
- **Example**: "₹10L to ₹50L at 10% p.a. takes 16.9 years"

---

---

### Sprint 2 Implementation Decisions

**Resolved:**

1. **Insurance Needs Method** ✅
   - **Decision**: Use **income-multiple method** (Annual Income × Stability/Predictability Multiplier)
   - Not the expense-replacement method mentioned in earlier specs
   - Multiplier: 10x (stable+predictable or fluctuating+predictable) or 15x (unstable+unpredictable)

2. **BigDecimal Library** ✅
   - **Decision**: Use **Decimal.js**
   - Industry standard for financial JavaScript applications
   - Arbitrary precision handling, proper rounding modes
   - Rounding rule: `ROUND_HALF_UP` (standard accounting practice)
   - Handles complex financial calculations accurately

3. **Data Persistence Behavior** ✅
   - **Decision**: Auto-save draft + explicit save pattern
   - Calculator results auto-save as draft when user inputs values (loss-proof)
   - Show "Draft" indicator in UI
   - Add explicit "Save Result" button for user to finalize official result
   - Balances UX (no data loss) with clarity (user knows when result is official)

**Deferred (Future Implementation):**

4. **Financial Plans Database Schema** ⏸️
   - Exact column structure for `financial_plans` table will be defined during database implementation phase
   - Will include: calculator type, user_id, results JSON, timestamps, draft status
   - Design when implementing persistence layer

---

#### Phase 3+ Calculators (5 - Weeks 14+)

**11. EMI Calculator**
- **Purpose**: Calculate monthly loan payment and amortization schedule
- **Formula**: EMI = P × [r × (1+r)^n] / [(1+r)^n - 1]
- **Output**: Monthly EMI, total interest, amortization table (month-by-month)
- **Example**: "₹30L home loan at 8% for 20 years = ₹27,748/month"

**12. EMI Capacity**
- **Purpose**: Maximum loan someone can afford
- **Inputs**: Monthly income, existing EMIs, desired rate/tenure
- **Output**: Max affordable EMI, max loan amount, conservative recommendation
- **Example**: "₹100k income with ₹10k existing EMI = can afford ₹30k new EMI = ₹35L loan"

**13. Partial Payment Impact**
- **Purpose**: Impact of prepayment on loan tenure and interest saved
- **Example**: "₹10L prepayment after 5 years reduces tenure from 20 to 13 years, saves ₹8L interest"

**14. EMI Change Impact**
- **Purpose**: Impact of increasing EMI during loan
- **Example**: "Increase EMI from ₹27,748 to ₹35,000 after 5 years reduces tenure to 15 years"

**15. Interest Rate Change Impact**
- **Purpose**: Impact of rate changes (two options: constant EMI or constant tenure)
- **Example**: "Rate drops from 8% to 7% → tenure reduces to 18.5 years (if EMI same) OR EMI drops to ₹25,000 (if tenure same)"

---

### 2.4 Business Rules & Constraints

#### Data & Privacy

| Rule | Rationale |
|------|-----------|
| Investor financial data visible only to selected advisors | Privacy protection |
| Investor controls all data sharing permissions | User autonomy |
| Data retained 7 years post-account deletion | Compliance & audit trail |
| All passwords encrypted with salt + hash | Security |
| Payment data PCI DSS compliant | Regulatory requirement |

#### Content & Compliance

| Rule | Rationale |
|------|-----------|
| All advisor articles require approval before publication | Quality & compliance control |
| No specific stock recommendations (general advice only) | SEBI compliance |
| All financial advice must include disclaimers | Legal protection |
| Content must cite sources (no plagiarism) | Credibility & originality |
| Comments also moderated for spam/abuse | Community safety |

#### Subscription & Payment

| Rule | Rationale |
|------|-----------|
| No refunds on prepaid subscriptions | Standard SaaS model |
| Auto-renewal unless explicitly cancelled | Revenue stability |
| Failed payment retry 3x over 5 days | Recover transient failures |
| Expired subscriptions lose premium features | Graceful degradation |
| Pro-rated for mid-cycle upgrades/downgrades | Fair billing |

#### Advisor Credentialing

| Rule | Rationale |
|------|-----------|
| At least 1 credential required to be visible | Verify legitimacy |
| Credentials expire annually (must renew) | Ensure current qualifications |
| Same person can't have multiple advisor accounts | Prevent duplicates |
| No direct solicitation outside platform | Prevent revenue leakage |

---

### 2.5 Subscription Model

#### Tiers

| Tier | Price | Duration | Features |
|------|-------|----------|----------|
| **Free** | ₹0 | Unlimited | 5 basic calculators, articles, 1 advisor follow, Q&A |
| **Silver** | ₹299/month | Monthly | All 15 calculators, unlimited sharing, priority 24h response |
| **Gold** | ₹999/month | Monthly | Silver + 1 free consultation/month, personalized recommendations |

#### Revenue Model

- **Primary**: Investor subscriptions (₹0.9-1.2L MRR at scale)
- **Secondary**: Advisor premium features (optional)
- **Future**: Transaction fees, referral commissions (not MVP)

#### Unit Economics

- **CAC**: ₹500 (via marketing, referral)
- **LTV**: ₹3,000 (avg 10 months @ ₹300/month)
- **LTV:CAC**: 6:1 (healthy)
- **Payback**: 2 months
- **Gross Margin**: 75% (low ops costs)

---

### 2.6 Key Success Metrics (Year 1)

| Metric | Target | Why |
|--------|--------|-----|
| Registered Users | 10,000+ | Market validation |
| Active Advisors | 500+ | Supply-side growth |
| Monthly Active Users | 2,000+ | Engagement indicator |
| Free-to-Paid Conversion | 3-5% | Monetization health |
| Paying Subscribers | 300+ | Revenue driver |
| MRR | ₹45,000+ | Financial viability |
| System Uptime | 99.5%+ | Reliability |
| Content Approval Rate | 70-80% | Quality gate |
| Advisor Response Rate | 80%+ within 48h | Service quality |

---

## 3. Technical Architecture

### 3.1 Architecture Overview

```
Next.js 14 (Vercel) 
     ├─ Frontend (React components, SSR, routing)
     └─ API Routes (Serverless functions in app/api/)
     ↓
Supabase PostgreSQL (Database)
     + Google Auth (Authentication)
     + Cloudflare R2 (File Storage)
     + SendGrid (Email)
     + Razorpay (Payments)
```

---

### 3.1.1 Tech Stack Notes

**Next.js API Routes**: Built-in serverless functions using `/app/api/` directory. Each endpoint is a serverless function deployed to Vercel. No separate backend required.

**Google Auth**: Users sign in with Google account. Simple, secure, no password management.

**Supabase PostgreSQL**: Database with Row-Level Security (RLS) for automatic data isolation. Auth tokens validated server-side.

**Cloudflare R2**: File storage for avatars, invoices, documents. 10GB free tier, scales affordably.

**SendGrid**: Transactional emails (welcome, password reset, notifications). 100 free/day.

**Razorpay**: Payments. Supports UPI, NetBanking, cards (India-optimized). 2% per transaction.



### 3.2 Frontend Architecture

**Framework**: Next.js 14 (App Router)
- **Rendering**: Server-side rendering (SSR) for SEO + client-side for interactivity
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context API
- **API Integration**: Fetch API with error handling
- **Deployment**: Vercel (auto-deploy on git push)

**Key Pages**:
- `/auth/signup` - Investor/Advisor registration
- `/auth/login` - Authentication
- `/dashboard` - User hub (plans, calculators, profile)
- `/calculators/[name]` - Individual calculator pages
- `/advisors` - Advisor discovery/search
- `/plans` - Financial plan management
- `/subscriptions` - Subscription browse & purchase
- `/admin` - Content moderation panel

---

### 3.3 Backend Architecture

**Platform**: Next.js API Routes (Serverless)
- **Runtime**: Node.js 18+ (Vercel runtime)
- **Location**: `/app/api/` directory structure
- **API Format**: REST (JSON)
- **Authentication**: Supabase JWT tokens (validated on each request)
- **Request Validation**: Zod (TypeScript validation)
- **Response Format**: JSON with consistent error handling

**API Routes** (`app/api/`):
```
/api/auth/
  ├─ signup
  ├─ login
  ├─ logout
  └─ verify-otp

/api/investors/
  ├─ profile (GET/PUT)
  ├─ risk-questionnaire (POST)
  └─ preferences (GET/PUT)

/api/advisors/
  ├─ search (GET with filters)
  ├─ [id] (GET)
  ├─ follow (POST)
  └─ credentials (GET)

/api/calculators/
  ├─ goal-planner (POST)
  ├─ emi (POST)
  ├─ insurance (POST)
  ├─ ... (13 more)

/api/plans/
  ├─ save (POST)
  ├─ get (GET)
  ├─ share (POST)
  └─ [id]/feedback (POST)

/api/articles/
  ├─ list (GET with filters)
  ├─ [id] (GET)
  ├─ create (POST - advisor only)
  ├─ [id]/approve (POST - admin)
  └─ [id]/moderate (POST - admin)

/api/subscriptions/
  ├─ list-plans (GET)
  ├─ create (POST)
  ├─ cancel (POST)
  └─ webhooks/razorpay (POST)

/api/admin/
  ├─ users (GET/DELETE)
  ├─ content/moderate (GET/POST)
  ├─ advisors/approve (POST)
  └─ analytics (GET)
```

---

### 3.4 Database Architecture

**Platform**: Supabase PostgreSQL

**Schema Overview** (14 core tables):

```
Users Layer:
  ├─ users (Supabase Auth, synced)
  ├─ investor_profiles
  └─ advisor_profiles

Credentials & Expertise:
  ├─ advisor_credentials
  └─ advisor_expertise

Social & Relationships:
  ├─ advisor_followers
  └─ investor_follows

Financial Planning:
  ├─ financial_plans
  ├─ plan_shares
  └─ plan_feedback

Content & Community:
  ├─ articles
  ├─ forum_threads
  └─ forum_answers

Transactions:
  ├─ subscriptions
  └─ invoices
```

**Key Design Patterns**:
- Row Level Security (RLS) on all tables - investors see only their data
- UUID primary keys for security
- Timestamps (created_at, updated_at) on all tables
- Soft deletes where needed (archived vs deleted)
- Indexes on foreign keys and search columns

---

### 3.5 Authentication & Security

**Auth Method**: Supabase Auth (JWT-based)

**Flow**:
1. User signs up with email + password
2. OTP verification (optional email confirmation)
3. Supabase issues JWT token
4. JWT stored in secure HTTP-only cookie (frontend)
5. All API requests include JWT in Authorization header
6. Supabase validates JWT server-side
7. User ID extracted from JWT for RLS

**Security Measures**:
- Passwords hashed with bcrypt (Supabase handles)
- TLS/SSL encryption in transit (HTTPS everywhere)
- Database encryption at rest (Supabase default)
- RLS policies enforce data isolation
- Input validation on all endpoints (Zod)
- Rate limiting on sensitive endpoints (future)
- CORS configured for domain security

---

### 3.6 Calculator Engine

**Implementation**: TypeScript utility functions

**Structure**:
```
lib/calculators/
  ├─ goalPlanner.ts
  ├─ emiCalculator.ts
  ├─ insuranceNeeds.ts
  ├─ ... (12 more)
  └─ __tests__/
      ├─ goalPlanner.test.ts
      └─ ... (all tests)
```

**Each Calculator Has**:
- Input validation (Zod schema)
- Mathematical logic (formula implementation)
- Error handling (descriptive messages)
- Output formatting (2 decimal places, INR currency)
- Edge case handling (zero values, max values)
- TypeScript types for safety

**Precision Requirements**:
- All currency values to 2 decimal places
- All percentages to 2 decimal places
- Use BigDecimal for financial calculations (not floating point)
- No rounding errors in amortization schedules

---

### 3.7 Payments Integration

**Provider**: Razorpay

**Integration Points**:
1. **Subscription Creation**: User selects plan → Razorpay checkout
2. **Webhook Handling**: Razorpay sends payment status → update DB
3. **Invoice Generation**: Auto-generate PDF invoice post-payment
4. **Recurring Billing**: Razorpay handles monthly auto-charge
5. **Failure Handling**: Retry logic for failed transactions

**Payment Flow**:
```
User Selects Plan
  ↓
/api/subscriptions/create (POST)
  ↓
Razorpay Checkout Link Generated
  ↓
User completes payment
  ↓
Razorpay Webhook: /api/webhooks/razorpay (POST)
  ↓
Update Supabase: subscription_status = 'active'
  ↓
Features Enabled via Frontend
```

---

### 3.8 Email Service

**Provider**: SendGrid

**Use Cases**:
- Welcome email on signup
- Password reset confirmation
- Plan sharing notification (investor → advisor)
- Article/forum moderation notifications
- Subscription confirmation & invoices
- Weekly digest (future)

**Templates** (SendGrid Dynamic Templates):
- welcome-investor.html
- welcome-advisor.html
- plan-shared.html
- advisor-feedback.html
- invoice.html

---

### 3.9 Storage

**Platform**: Supabase Storage (S3-compatible)

**Storage Buckets**:
```
/avatars/           - Profile pictures
/credentials/       - Advisor certificates, licenses
/articles/          - Article images & attachments
/invoices/          - Generated PDFs
```

**Policies**:
- Investors see only their own files
- Advisors see only their own files
- Admin can see all files
- Public read on specific files (article images)

---

### 3.10 Monitoring & Observability

**Logging**:
- Console logs in Vercel Functions
- Supabase audit logs for database changes
- Razorpay webhook logs for payments

**Error Tracking** (Future):
- Sentry for frontend/backend errors
- Alert on critical failures

**Performance Monitoring** (Future):
- Vercel Analytics for page performance
- Database query optimization via Supabase CLI

---

## 4. Design Principles & Constraints

### 4.1 Design Principles

#### 1. User-Centric Design
- Investors should find advisors in < 3 clicks
- Calculators should show results immediately
- Data sharing should be intuitive and transparent

#### 2. Trust Through Transparency
- All advisor credentials publicly verified
- Plan sharing is explicit (not automatic)
- Moderation is visible (approved vs rejected articles)
- Advice comparison is built-in

#### 3. Simplicity Over Features
- MVP focuses on 5 core calculators, not 15
- Each feature solves one problem well
- No feature bloat - quality over quantity

#### 4. India-First Financial Approach
- All amounts in ₹ (INR)
- All calculations follow Indian financial standards
- Compliance with SEBI, RBI, insurance regulations
- Tax awareness (GST calculated, TDS explained)

#### 5. Mobile-Friendly First
- Responsive design on all screen sizes
- Touch-friendly buttons and inputs
- Fast loading (< 3 seconds on 4G)

#### 6. Solo Developer Optimization
- Minimize infrastructure complexity
- Maximize automation (CI/CD, testing)
- Use managed services (Supabase, Vercel, SendGrid)
- No Kubernetes, Docker, or complex DevOps

---

### 4.2 Technical Constraints

#### Frontend Constraints
- Next.js 14 (not older, not bleeding edge)
- Vercel deployment only (single provider dependency)
- No external UI library (Tailwind + custom components)
- Browser support: Modern browsers only (no IE11)

#### Backend Constraints
- Serverless only (no VMs, containers, or always-on servers)
- REST API (no GraphQL at MVP)
- Stateless functions (no session state)
- Reasonable timeout: Functions must complete in 30s

#### Database Constraints
- PostgreSQL only (Supabase)
- No migrations beyond schema versioning
- Max 10k concurrent connections
- No advanced features (JSON_BUILD_OBJECT only where needed)

#### Payment Constraints
- Razorpay only (single payment provider)
- No credit on platform (prepaid subscriptions only)
- No refunds (SaaS standard)
- Webhook handling must be idempotent

---

### 4.3 Operational Constraints

#### Availability
- Target 99.5% uptime (acceptable for MVP)
- Acceptable downtime: 1-2 hours/month for maintenance
- No 24/7 support initially (async support via email)

#### Data Constraints
- Backup retention: 30 days (Supabase default)
- Data residency: India (Supabase Singapore region)
- GDPR compliance: Not required initially (India only)

#### Cost Constraints
- Year 1 infrastructure: < ₹50k/month at scale
- CAC budget: < ₹500 per user
- Target gross margin: 75%+

#### Scaling Constraints
- Target: 10k users in 12 months
- Max calculator latency: 1 second
- Max API response: 2 seconds

---

## 5. Implementation Roadmap

### 5.1 Phased Delivery

#### Phase 1: MVP (Months 1-6)

**Month 1-2: Foundation**
- User authentication (signup, login, profile)
- Investor & advisor profiles
- Database schema & RLS policies
- Deployment pipeline (Vercel + Supabase)

**Month 2-3: Calculators**
- 5 core calculators (Goal, EMI, Insurance, Net Worth, Cash Flow)
- Calculate API endpoints
- Save plans to database
- Testing framework setup

**Month 4-5: Community**
- Advisor discovery & search
- Advisor credentialing system
- Article publishing with moderation
- Forum basics (Q&A)

**Month 5-6: Monetization**
- Subscription system
- Razorpay integration
- Feature gating (free vs paid)
- Invoice generation

**Month 6**: MVP Launch
- Public release
- 500+ users, 50+ advisors

---

#### Phase 2: Growth (Months 7-9)

**Month 7-8: Feature Expansion**
- 10 advanced calculators
- Plan sharing with advisor feedback
- Advanced search & filtering
- Email notifications

**Month 9: Optimization**
- Performance tuning
- UX improvements
- Advisor tools (analytics, client management)
- Mobile responsiveness

---

#### Phase 3: Scale (Months 10-12)

**Month 10-11: Advanced Features**
- All 15 calculators
- Video consultation booking (future)
- Referral program
- Advisor commission system (future)

**Month 12: Launch Features + Analytics**
- Advanced analytics dashboards
- Content recommendation engine
- Integration marketplace (future)
- Year 1 reflection & planning

---

### 5.2 Weekly Implementation Details

**Weeks 1-4: Authentication & Profiles**
- Supabase setup
- Auth routes (signup, login, logout)
- Profile creation flows
- OTP verification

**Weeks 5-10: Core Calculators**
- Week 5-6: Net Worth, Goal Planner
- Week 7-8: Cash Flow, Insurance
- Week 9-10: Risk Profiler + API integration

**Weeks 11-16: Advisor System**
- Week 11-12: Advisor profiles, credentialing
- Week 13-14: Advisor discovery, search
- Week 15-16: Article publishing, moderation

**Weeks 17-22: Monetization**
- Week 17-18: Subscription model setup
- Week 19-20: Razorpay integration
- Week 21-22: Payment webhooks, invoices

**Weeks 23-26: MVP Polish**
- Testing, bug fixes
- UI/UX improvements
- Documentation
- Launch preparation

**Months 7-12**: Phased feature rollout as per Phase 2 & 3

---

## 6. Success Metrics

### 6.1 North Star Metrics

| Metric | Month 6 (MVP) | Month 12 (Full) | Rationale |
|--------|---|---|---|
| **Registered Users** | 5,000 | 20,000 | Market penetration |
| **Active Advisors** | 150 | 800 | Supply-side growth |
| **Monthly Active Users** | 1,000 | 5,000 | Engagement |
| **Free-to-Paid Conversion** | 3% | 5% | Monetization |
| **Paying Subscribers** | 150 | 1,000 | Revenue driver |
| **MRR** | ₹45k | ₹300k | Financial viability |

### 6.2 Feature Adoption Metrics

| Feature | Target | Threshold |
|---------|--------|-----------|
| **Calculators Run/Month** | 2,000+ | > 1,000 |
| **Plans Saved** | 500+ | > 200 |
| **Plans Shared with Advisors** | 200+ | > 50 |
| **Articles Published** | 300+ | > 100 |
| **Forum Posts** | 500+ | > 100 |
| **Advisor Followers** | 2,000+ | > 500 |

### 6.3 Quality Metrics

| Metric | Target |
|--------|--------|
| **System Uptime** | 99.5%+ |
| **API Response Time** | < 500ms |
| **Page Load Time** | < 2 seconds |
| **Calculator Accuracy** | 100% (verified manually) |
| **Content Approval Rate** | 70-80% |
| **User Satisfaction (CSAT)** | 4.0+/5.0 |

### 6.4 Business Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **CAC (Customer Acquisition Cost)** | Marketing spend / New users | < ₹500 |
| **LTV (Lifetime Value)** | Avg revenue per user × Avg lifespan | > ₹3,000 |
| **LTV:CAC Ratio** | LTV / CAC | > 5:1 |
| **Churn Rate (Monthly)** | (Users lost / Start users) × 100 | < 8% |
| **Payback Period** | Months to recover CAC | < 3 months |
| **Gross Margin** | (Revenue - COGS) / Revenue | > 75% |

---

## Appendix: Key Definitions

**Advisor**: Licensed financial professional (CFP, CFA, etc.) offering advisory services  
**Investor**: Individual seeking financial advice and planning tools  
**Financial Plan**: Saved calculator output (goal amount, timeline, recommendations)  
**Risk Profile**: Assessment of investor's risk tolerance (Conservative/Moderate/Aggressive)  
**Calculator**: Automated financial planning tool (15 total)  
**Subscription**: Recurring payment for premium features (₹299-999/month)  
**Plan Sharing**: Investor shares financial plan with advisor for feedback  
**Advisor Credentialing**: Process of verifying advisor qualifications  

---

## Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 2026 | Initial RAD creation - consolidated BRD, calculator specs, tech design |

**Next Review**: Month 3 of development (mid-July 2026)

---

**This is the single source of truth for Bloomkite rebuilding.**

All development, architecture, testing, and deployment decisions reference this RAD.

---

**End of Master RAD Document**
