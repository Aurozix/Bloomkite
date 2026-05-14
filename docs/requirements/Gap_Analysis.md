# Bloomkite — Gap Analysis & Implementation Status

**Last Updated**: 2026-05-13 (§2 Auth/onboarding green; master-data foundation for §3 + §9 landed)
**Sources**: [Business_Requirements.md](Business_Requirements.md), [Calculators_Requirements.md](Calculators_Requirements.md)
**Purpose**: Living scorecard of BRD/Calculator-spec coverage. Updated every time a feature changes status.

---

## Update Protocol

This is a living document. Whenever work ships that moves a row's status:

1. **Update the status cell** in the relevant table (❌ → 🟡 → ✅).
2. **Update `Last Updated`** date at the top.
3. **Add a dated entry** to the Changelog at the bottom (`YYYY-MM-DD — <feature> — <row(s) moved>`).
4. **If a whole section flips status** (e.g. all Loans calculators land), update the one-line description in [`project_gap_analysis.md`](../../../../Users/uvara/.claude/projects/c--2--Personal-Bloomkite-Bloomkite/memory/project_gap_analysis.md) memory so future sessions see the new high-level state.
5. **Cite file paths** in the Changelog entry so the change is auditable.

**Do not** silently move rows. Every status change has a Changelog row.

---

## Status legend

✅ done · 🟡 partial · ❌ missing

---

## 1. Calculators — 15 of 15 done ✅

| # | Calculator | Page | Lib | Status | Notes |
|---|---|---|---|---|---|
| 1 | Goal Planner | [page](../../app/calculators/goal-planner/page.tsx) | [lib](../../lib/calculators/goalPlanner.ts) | ✅ | |
| 2 | Cash Flow | [page](../../app/calculators/cash-flow/page.tsx) | [lib](../../lib/calculators/cashFlow.ts) | ✅ | |
| 3 | Net Worth | [page](../../app/calculators/net-worth/page.tsx) | [lib](../../lib/calculators/netWorth.ts) | ✅ | |
| 4 | Priority Ranker | [page](../../app/calculators/priority-ranker/page.tsx) | [lib](../../lib/calculators/priorityRanker.ts) | ✅ | |
| 5 | Insurance Needs | [page](../../app/calculators/insurance-needs/page.tsx) | [lib](../../lib/calculators/insuranceNeeds.ts) | ✅ | |
| 6 | Risk Profiler | [page](../../app/calculators/risk-profiler/page.tsx) | [lib](../../lib/calculators/riskProfiler.ts) | ✅ | |
| 7 | Future Value | [page](../../app/calculators/future-value/page.tsx) | [lib](../../lib/calculators/futureValue.ts) | ✅ | |
| 8 | Target Value | [page](../../app/calculators/target-value/page.tsx) | [lib](../../lib/calculators/targetValue.ts) | ✅ | |
| 9 | Rate Finder | [page](../../app/calculators/rate-finder/page.tsx) | [lib](../../lib/calculators/rateFinder.ts) | ✅ | |
| 10 | Tenure Finder | [page](../../app/calculators/tenure-finder/page.tsx) | [lib](../../lib/calculators/tenureFinder.ts) | ✅ | |
| 11 | EMI | [page](../../app/calculators/emi/page.tsx) | [lib](../../lib/calculators/emi.ts) | ✅ | Unlocks loans cluster |
| 12 | EMI Capacity | [page](../../app/calculators/emi-capacity/page.tsx) | [lib](../../lib/calculators/emiCapacity.ts) | ✅ | Reuses `loanFromEmi` helper from EMI lib |
| 13 | Partial Payment | [page](../../app/calculators/partial-payment/page.tsx) | [lib](../../lib/calculators/partialPayment.ts) | ✅ | Simulates month-by-month with prepayments |
| 14 | EMI Change Impact | [page](../../app/calculators/emi-change/page.tsx) | [lib](../../lib/calculators/emiChange.ts) | ✅ | Simulates variable-EMI schedule; flags negative amortization |
| 15 | Rate Change Impact | [page](../../app/calculators/rate-change/page.tsx) | [lib](../../lib/calculators/rateChange.ts) | ✅ | Computes both Approach A (EMI fixed) and Approach B (tenure fixed) in one call |

**Loans cluster: 5/5 done.** ✅ Entire calculator surface complete. Remaining calculator work shifts from "build" to "verify against spec" — see §12 (calculator-spec compliance) for the BRD-example validation that still needs a functional review pass.

---

## 2. Auth & onboarding

| Requirement | Status | Evidence / gap |
|---|---|---|
| Email signup + JWT | ✅ | Auth.js v5 + Prisma adapter (commit `67d5d4c`); [middleware.ts](../../middleware.ts) gates routes |
| Multi-role (investor/advisor/admin) | ✅ | [role-selection](../../app/api/auth/role-selection/route.ts), `roles`/`user_roles` tables |
| OTP via email | ✅ | 6-digit OTP per BRD §3.1. `EmailVerificationOtp` table stores SHA-256-hashed codes with attempt counter; 10-minute TTL; 5-attempt cap. POST [/api/auth/verify-email](../../app/api/auth/verify-email/route.ts) + [/api/auth/resend-verification](../../app/api/auth/resend-verification/route.ts); UI at [/auth/verify-email](../../app/auth/verify-email/page.tsx). Old GET-link handler redirects pre-rollout link clicks. |
| Phone verification | ✅ | 6-digit OTP behind a stub SMS provider abstraction (production needs TRAI DLT registration first, BRD §12.1). `PhoneVerificationOtp` table; `lib/auth/phone-otp.ts`; send/verify routes; role-selection page lazy-reveals a phone step when activation returns `phone_required`. |
| Password reset flow | ✅ | [/api/auth/forgot-password](../../app/api/auth/forgot-password/route.ts) + [/api/auth/reset-password](../../app/api/auth/reset-password/route.ts) with `PasswordResetToken` table and Resend templates; verified 2026-05-13 |
| Age 18+ verification | ✅ | DOB column on User + propagated to profiles; `lib/auth/age.ts` enforces ≥18; signup-form field optional, profile-activation requires it. BRD §8.1 |
| Session management | ✅ | Auth.js JWT, role list in token |

---

## 3. Profiles

### Investor (BRD §3.1)

| Step | Status | Notes |
|---|---|---|
| Basic profile (name/phone/email) | ✅ | `investor_profiles` |
| Risk questionnaire | ✅ | Risk Profiler calc; result persisted on profile |
| **Investment interests / categories** | ❌ | No master data table; not captured |
| **Financial accounts setup** | ❌ | Not implemented |

### Advisor (BRD §3.2)

| Step | Status | Notes |
|---|---|---|
| Personal info | ✅ | `advisor_profiles` |
| Professional info (license, experience) | ✅ | Adds `yearsOfExperience` (Int, 0-70 validated), `licenseRegistrationNumber`, `licenseRegistrationBody` (e.g., SEBI/IRDA/AMFI). Profile route accepts partial updates; admin gate before approval should enforce non-null when production-ready. |
| Certifications/awards/education/experience | ✅ | `advisor_credentials.credentialClass` discriminator (CERTIFICATION / AWARD / EDUCATION / EXPERIENCE) + class-specific nullable fields (awardYear, startDate, endDate). Per-class form on the profile page; per-class validation on the route. Single moderation queue retained. |
| Products / Services / Brands declaration | ✅ | Three new join tables (`advisor_products`, `advisor_services`, `advisor_brands`) referencing master_data tables. M:N per advisor. Legacy `advisor_expertise` free-text table retained for now; remove in a cleanup commit. |
| Advisor ranking / priority | ✅ | `priority` Int column on `advisor_products` and `advisor_services` (1 = highest). Up/down arrows in the profile UI; server uses index+1 as default priority for clients that just send an ordered array. Brands intentionally unranked per BRD §3.2 step 6. |
| Admin approval workflow | ✅ | `workflow_status`, `approve|reject` admin routes |

---

## 4. Plan sharing — largely missing (BRD's headline differentiator)

BRD §3.3, §5.3, §11.2 position plan-sharing as the platform's key competitive advantage.

| Capability | Status |
|---|---|
| Save plan (`financial_plans` table) | ✅ |
| Choose multiple advisors to share with | ❌ |
| Sharing permissions (view-only / comment) | ❌ |
| Advisor receives notification | ❌ |
| Advisor views plan with full data | ❌ |
| Advisor adds comments / recommendations | ❌ |
| Investor sees multiple advisor responses | ❌ |
| Advisor cannot see others' feedback (BRD §8.5) | ❌ |
| Sharing cap of 5 advisors (BRD §8.1) | ❌ |

No `plan_shares`, `plan_comments`, or `plan_recipients` tables exist. Blocks UC-1, UC-3, UC-4, UC-5, UC-7.

---

## 5. Advisor discovery & engagement

| Feature | Status | Notes |
|---|---|---|
| List/search advisors | ✅ | [advisors page](../../app/advisors/page.tsx), [search](../../app/api/advisors/search/route.ts) |
| Public profile | ✅ | [advisor detail](../../app/advisors/[id]/page.tsx) |
| Follow advisor | ✅ | `advisor_followers`, denormalized count |
| **Filter by expertise/products/brands** | 🟡 | Possible via tags; no faceted UI |
| **Advisor ratings/reviews** | ❌ | BRD §3.1 (optional) and §7.1 high-priority |
| **Tag advisor in question/article** | ❌ | BRD §3.4 — community can tag advisors. Not modeled |

---

## 6. Community / content

| Feature | Status | Notes |
|---|---|---|
| Articles CRUD | ✅ | [articles](../../app/articles/), [api](../../app/api/articles/) |
| Article moderation (draft → pending → published) | ✅ | Admin approve/reject routes |
| Featured + inline images | ✅ | Storage uploads |
| **Article comments** | ❌ | BRD §3.4 step 1 |
| **Article voting (like/dislike)** | ❌ | BRD §3.4 |
| **Article favorites** | ❌ | BRD §3.4 |
| Forum Q&A | ✅ | Questions, answers, votes, best-answer |
| **Tag advisors in forum questions** | ❌ | BRD §3.4 |
| **Auto-filter (spam, prohibited words, plagiarism)** | ❌ | BRD §5.2 stage 2 |
| **Word minimum (300) on articles** | ❌ | BRD §8.3 |
| **Disclaimer requirement** | ❌ | BRD §8.3 / §12.2 |
| **Comment moderation** | ❌ | BRD §8.3 |
| **User reporting of bad content** | ❌ | BRD §5.2 ongoing monitoring |

---

## 7. Subscriptions & payments — strongest area

| Feature | Status | Notes |
|---|---|---|
| Plans (Free/Silver/Gold) | ✅ | `subscription_plans` seeded |
| Razorpay create/verify | ✅ | [create](../../app/api/subscriptions/create/route.ts), [verify](../../app/api/subscriptions/verify/route.ts) |
| Webhook handling | ✅ | [webhook](../../app/api/webhooks/razorpay/route.ts) |
| Cancel | ✅ | [cancel](../../app/api/subscriptions/cancel/route.ts) |
| Feature gating | ✅ | [PaywallGate](../../app/components/PaywallGate.tsx), [tier.ts](../../lib/subscriptions/tier.ts) |
| Invoices table | ✅ | `invoices` migration exists |
| **Pause/resume** | ❌ | BRD §3.5, §5.4 stage 7 |
| **Auto-renewal logic** | 🟡 | Razorpay supports it; webhook for renewal/retry/grace not visible |
| **Failed payment retry (3× over 5 days)** | ❌ | BRD §5.4, §8.4 |
| **Pro-rated upgrades/downgrades** | ❌ | BRD §8.4 |
| **Premium tier** (annual ₹4,999–9,999) | ❌ | Only Silver/Gold currently |
| **Advisor premium features** (analytics, CRM, content promo) | ❌ | BRD §6.1.B not modeled |
| **GST handling** | ❌ | BRD §6.3, §8.4 |
| **Invoice PDF/email delivery** | ❌ | BRD §6.3 |
| **7-day free trial** | ❌ | BRD §5.4 |

---

## 8. Admin

| Feature | Status |
|---|---|
| Dashboard stats | ✅ |
| Article moderation UI | ✅ |
| Credential approval UI | ✅ |
| **User management (suspend/delete/role-edit)** | ❌ |
| **Master data CRUD** (products, services, brands, urgency, calculator categories) | ❌ |
| **Membership plan editor** | ❌ — plans seeded via SQL only |
| **Compliance reports / audit log viewer** | ❌ |
| **Bulk moderation actions** | ❌ |
| **Forum moderation UI** | ❌ — schema supports it, no admin page |

---

## 9. Master / reference data — completely absent

BRD repeatedly references master-data tables. Status:

- ✅ Investment categories (BRD §3.1 step 4) — `master_data_investment_categories`, 10 rows seeded
- ✅ Products (BRD §3.2 step 5) — `master_data_products`, 11 rows seeded
- ✅ Services (BRD §3.2 step 5) — `master_data_services`, 10 rows seeded
- ✅ Brands (BRD §3.2 step 5) — `master_data_brands`, 15 rows seeded
- ✅ Account types (BRD §3.1 step 5) — `master_data_account_types`, 12 rows seeded
- ❌ Urgency levels (1–9) for Priority Ranker
- ❌ Cash-flow item categories
- ❌ Net-worth account-entry types
- ❌ Risk-profile questions/answers/point values (logic exists but not DB-driven)
- ❌ Advisor types / specializations taxonomy

Five domains landed 2026-05-13. **Admin CRUD UI for these tables is the open follow-up** — currently seeded via [`database/seed-master-data.ts`](../../database/seed-master-data.ts), an admin page at `/admin/master-data` is the next batch's job. Existing seeds are idempotent (upsert by slug, never overwrite admin-edited names, never reactivate deactivated rows).

---

## 10. Notifications & communication — missing

| Channel | Status |
|---|---|
| Transactional email (signup, OTP, payment confirm) | 🟡 — Supabase Auth emails only |
| In-app notifications | ❌ |
| Plan-shared notification to advisor | ❌ |
| Article-approved notification to author | ❌ |
| Daily/digest emails (BRD §8.6 cap of 1/day) | ❌ |
| SMS (OTP, TRAI-compliant gateway BRD §12.1) | ❌ |
| Opt-out / preference center | ❌ |

---

## 11. Compliance & legal — pre-launch blockers

Per BRD §12.5 / §7.2:

| Item | Status |
|---|---|
| Terms of Service page | ❌ |
| Privacy Policy page | ❌ |
| Disclaimer banner on financial content | ❌ |
| Cookie/consent banner | ❌ |
| Data deletion request flow (right-to-delete) | ❌ |
| KYC capture for premium (optional but recommended) | ❌ |
| Audit trail / activity log table | ❌ |
| Data-retention purge jobs (7yr / 90d / 24h windows BRD §13.3) | ❌ |
| Grievance/support contact mechanism | ❌ |

---

## 12. Calculator-spec compliance (the 10 that exist)

Per-calculator functional pass against [Calculators_Requirements.md](Calculators_Requirements.md). Status:

| # | Calculator | Spec compliance | Notes |
|---|---|---|---|
| 1 | Goal Planner | ✅ reviewed 2026-05-13 | Output shape + math now align to §1.3/§1.4. Spec's example value (₹44,124.56) is inconsistent with its own formula; impl asserts the mathematically correct ~₹28,978. Spec text in §1.3 step 5 also gives the wrong formula (PMT-amortization instead of FV-annuity-inverse); impl uses correct accumulation formula. Rate convention now nominal monthly per spec, timing annuity-due per §1.6. |
| 2 | Cash Flow | ❌ not reviewed | BRD §2.5 — only `isRecurring=true` items count. Confirm filter. |
| 3 | Net Worth | ❌ not reviewed | BRD §3.3 — expects both current and future-value sums + growth %. |
| 4 | Priority Ranker | ❌ not reviewed | |
| 5 | Insurance Needs | ❌ not reviewed | BRD §5.3 — all four stability×predictability cells reduce to 10 or 15. |
| 6 | Risk Profiler | ❌ not reviewed | BRD §6.3 fixes 5 score bands + exact allocation %s. Confirm bands/allocations. |
| 7 | Future Value | ❌ not reviewed | |
| 8 | Target Value | ❌ not reviewed | |
| 9 | Rate Finder | ❌ not reviewed | |
| 10 | Tenure Finder | ❌ not reviewed | |
| 11–15 | Loans cluster | 🟡 partial | Tests cover canonical scenarios; spec example values for §11.5, §12.5, §15 are internally inconsistent (formulas don't yield quoted figures). Implementations follow correct math; spec inconsistencies documented in commit history. |

**Recurring spec-quality issue:** four sections (§1.4, §11.5, §12.5, §15.5) quote example output values that do not derive from the formulas given in the same section. Track separately as a spec-side bug if/when the spec moves to v2.

---

## 13. Cross-cutting / platform

| Item | Status |
|---|---|
| Mobile app | ❌ (BRD Phase 2) |
| SEO meta / sitemaps | ❌ |
| Analytics / event tracking | ❌ |
| Error monitoring (Sentry) | ❌ |
| Email service integration (SendGrid/SES) | ❌ |
| SMS service integration | ❌ |
| File upload security scanning | ❌ |
| Search (full-text, advisor/article) | 🟡 — basic search exists; nothing semantic |
| i18n / multi-currency | ❌ |

---

## 14. Recommended MVP sequencing

If the goal is **MVP launch readiness** per BRD §7.2, in priority order:

1. **EMI + EMI Capacity calculators** — unblocks loans cluster and UC-4
2. **Plan-sharing schema + UI** — the differentiator, currently 0%
3. **Phone OTP + age check** — legal/compliance blocker
4. **Disclaimers + ToS + Privacy + Right-to-delete** — pre-launch legal
5. **Master data** (products/services/brands/urgency) — unblocks proper advisor expertise and Priority Ranker
6. **Notifications** (at minimum: email on plan-shared, article-approved, payment status)
7. **Remaining 3 loan calculators** (Partial Payment, EMI Change, Rate Change)
8. **Article comments/votes/favorites** — BRD §3.4
9. **Razorpay renewal/retry/pause** — revenue protection
10. **Admin master-data + user management UI**

---

## Changelog

- **2026-05-13** — §3 Advisor Products / Services / Brands + priority ranking (❌ → ✅ both rows, BRD §3.2 steps 5+6). Three new join tables (`advisor_products`, `advisor_services`, `advisor_brands`) referencing master_data; `priority` Int on products + services only (BRD §3.2 step 6 ranks those two, not brands). Migration `20260513240300_advisor_psb`. New endpoints: [GET/PUT /api/advisors/declarations](../../app/api/advisors/declarations/route.ts) (full-replace semantics — payload is canonical state, omit a row to remove it), [GET /api/master-data/:domain](../../app/api/master-data/[domain]/route.ts) for the picker dropdowns. Profile UI has a new "Products, Services & Brands" card with ordered-list ↑/↓ controls for the two ranked dimensions. Legacy `advisor_expertise` free-text-tag table left intact for now — cleanup commit to drop pending after data check.
- **2026-05-13** — §3 Advisor credentials four-class split (🟡 → ✅, BRD §3.2 step 4). Added `credentialClass` discriminator (CERTIFICATION | AWARD | EDUCATION | EXPERIENCE) + class-specific nullable fields (`award_year` for AWARD/EDUCATION, `start_date`/`end_date` for EXPERIENCE) on `advisor_credentials`. Migration `20260513240200_advisor_credential_class` backfills existing rows with `credentialClass='CERTIFICATION'` via DEFAULT. Route validates required fields per class (license_number + expiry_date for CERTIFICATION; award_year for AWARD/EDUCATION; start_date for EXPERIENCE). Profile page renders a class picker + per-class form fields. Single moderation queue retained — admin still reviews everything via one /admin/credentials route, badge labels render the class.
- **2026-05-13** — §3 Advisor Professional Information (🟡 → ✅, BRD §3.2 step 3). Three new columns on `advisor_profiles`: `years_of_experience` (Int, validated 0-70), `license_registration_number`, `license_registration_body` (e.g., SEBI / IRDA / AMFI / Pension Fund Reg). Migration `20260513240100_advisor_professional_info`. Profile PUT accepts these as partial-update fields (omit to leave untouched). Form fields rendered under a new "Professional Information" section in [/profile/advisor](../../app/profile/advisor/page.tsx). Admin approval gate should require non-null before workflow_status='approved' — that enforcement is a separate admin-route task.
- **2026-05-13** — §9 Master-data foundation (5 of 8 domains ❌ → ✅): investment categories, products, services, brands, account types. New Prisma models all sharing the same shape (slug + name + description + sortOrder + isActive). Migration `20260513240000_master_data`. Seeded via [`database/seed-master-data.ts`](../../database/seed-master-data.ts) — idempotent, never overwrites admin-edited names or reactivates deactivated rows. No admin CRUD UI yet (deferred per design call; the seed script is the operational entry point for now). Foundation for §3 investor-interests + advisor-products/services/brands work that follows.
- **2026-05-13** — §2 Phone OTP verification (❌ → ✅). New work:
  - `User.phoneNumber` + `User.phoneVerifiedAt` columns (Prisma migration `20260513230200_phone_verification`)
  - `PhoneVerificationOtp` table — same shape as email-OTP (SHA-256 hash, 5-attempt cap, 10-min TTL, per-user uniqueness via deleteMany before each send)
  - [`lib/sms/provider.ts`](../../lib/sms/provider.ts) — `SmsProvider` interface + `StubSmsProvider`. Stub returns the code in `debugBody` in development; refuses to send in production. Real providers (MSG91, Twilio, ...) plug in here once TRAI DLT registration completes (BRD §12.1).
  - [`lib/auth/phone-otp.ts`](../../lib/auth/phone-otp.ts) — `sendPhoneOtp`, `verifyPhoneOtp`, `normalisePhone` (E.164 with India 10-digit fast path)
  - [`/api/auth/phone-otp/send`](../../app/api/auth/phone-otp/send/route.ts) + [verify](../../app/api/auth/phone-otp/verify/route.ts) routes (both auth-required)
  - [`/api/auth/select-role`](../../app/api/auth/select-role/route.ts) gated: refuses activation if `phoneVerifiedAt` is null with `code: 'phone_required'`
  - [Role-selection page](../../app/auth/role-selection/page.tsx) lazy-reveals a phone+OTP step when the server signals it's needed. Mirrors verified phone to InvestorProfile/AdvisorProfile inside the activation transaction.
  - 8 new phone-normalisation tests pass; full unit suite 278/278.
- **2026-05-13** — §2 Email OTP (🟡 → ✅). Replaced link-based email verification with a 6-digit OTP per BRD §3.1. New `EmailVerificationOtp` table (Prisma migration `20260513230100_email_verification_otp`) stores SHA-256-hashed codes; 10-min TTL; 5-attempt cap; each send invalidates prior codes for the same email. New email template at [emails/verify-email-otp.tsx](../../emails/verify-email-otp.tsx) renders the code in JetBrains Mono with letter-spacing. POST routes at [/api/auth/verify-email](../../app/api/auth/verify-email/route.ts) (verify) and [/api/auth/resend-verification](../../app/api/auth/resend-verification/route.ts) (anti-enumeration, always 200). UI at [/auth/verify-email](../../app/auth/verify-email/page.tsx) — 6 single-digit inputs with paste-the-whole-code support + 30-second resend cooldown. Old GET handler kept as a transitional redirect for pre-rollout link clicks ("link_no_longer_supported"). Old [/auth/check-email](../../app/auth/check-email) page and [emails/verify-email.tsx](../../emails/verify-email.tsx) template orphaned but left in place; remove in a follow-up cleanup commit after grace period. 9 new route tests pass.
- **2026-05-13** — §2 Age 18+ verification (❌ → ✅). Added `User.dateOfBirth` column (Prisma migration `20260513230000_user_dob`). New helpers in [`lib/auth/age.ts`](../../lib/auth/age.ts): `isAtLeast18(dob)` with exact birthday math (>= not >, handles leap-year birthdays), `parseISODate(s)` rejecting absurd years and rollover dates like Feb-31. Signup form ([app/auth/signup/page.tsx](../../app/auth/signup/page.tsx) + [route](../../app/api/auth/signup/route.ts)) collects DOB optionally with server-side 18+ enforcement when provided. Role-selection ([page](../../app/auth/role-selection/page.tsx) + [route](../../app/api/auth/select-role/route.ts)) requires DOB at profile activation — lazy reveals an input when the server reports `code: dob_required`. DOB is propagated to both User and the role's profile table inside the transaction. 14 new age-helper tests pass.
- **2026-05-13** — §2 password reset row corrected from ❌ to ✅. The custom flow at [/api/auth/forgot-password](../../app/api/auth/forgot-password/route.ts) and [/api/auth/reset-password](../../app/api/auth/reset-password/route.ts) landed with the Auth.js migration (commit `67d5d4c`) but the gap doc wasn't updated at that time. Verified: PasswordResetToken table exists, Resend template wired in [lib/email.ts](../../lib/email.ts), pages at [/auth/forgot-password](../../app/auth/forgot-password) + [/auth/reset-password](../../app/auth/reset-password). Same commit also corrected §2's stale "Supabase Auth" references to Auth.js v5 + Prisma.
- **2026-05-13** — §12 Goal Planner functional review. Rewrote [`lib/calculators/goalPlanner.ts`](../../lib/calculators/goalPlanner.ts) to align with Calculators_Requirements.md §1: nominal monthly rate (was effective), annuity-due timing per §1.6 (was ordinary), FV-of-annuity-inverse for monthly accumulation (impl was already correct here; spec §1.3 step 5 text is wrong — uses PMT-amortization formula). Renamed/added output fields to match spec: `futureCost`, `futureValue` (current savings grown), `finalCorpus`, `monthlyInv`, `annualInv`, `rateOfReturn`. Added `tenureType` input (MONTH | YEAR). Updated [page](../../app/calculators/goal-planner/page.tsx), [fixtures](../../__tests__/fixtures/calculators.ts), [tests](../../__tests__/unit/lib/calculators/goalPlanner.test.ts). For the canonical §1 example (₹50L/10yr/5% infl/₹10L@8%/10% returns), the correct monthlyInv is ~₹28,978 — the spec's quoted ₹44,124.56 doesn't follow from its own formula (same internal-inconsistency pattern as §11.5, §12.5, §15.5). Tests now assert the mathematically correct value, with the discrepancy documented inline.
- **2026-05-13** — Rate Change Impact Calculator — §1 row 15 (❌ → ✅). **Loans cluster complete; all 15 calculators in.** New: [`lib/calculators/rateChange.ts`](../../lib/calculators/rateChange.ts), [`app/calculators/rate-change/page.tsx`](../../app/calculators/rate-change/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/rateChange.test.ts`](../../__tests__/unit/lib/calculators/rateChange.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Single library call computes BOTH approaches per spec §15.3 — Approach A (EMI fixed, tenure adjusts) and Approach B (tenure fixed, EMI adjusts) — so the UI can show side-by-side comparison cards. This is a strict superset of the spec's single-mode-per-call output shape; each approach result still populates the spec-required fields (`revisedTenure`, `revisedEmi`, `emiChange`, `tenureChange`, `interestSaved`, `rateChangeType`, `newAmortisation`). Approach A inherits the divergence detection from EMI Change Impact (a rate hike that pushes monthly interest above the static EMI cannot amortize). Approach B never diverges by construction. Reuses `emiFromLoan` + the four date helpers from [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts) and the same half-paisa closing-balance epsilon snap pattern.
- **2026-05-13** — EMI Change Impact Calculator — §1 row 14 (❌ → ✅). New: [`lib/calculators/emiChange.ts`](../../lib/calculators/emiChange.ts), [`app/calculators/emi-change/page.tsx`](../../app/calculators/emi-change/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/emiChange.test.ts`](../../__tests__/unit/lib/calculators/emiChange.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Simulates the loan month-by-month with one or more mid-stream EMI swaps; flags `diverged: true` when an EMI value falls below the monthly interest accrual (negative amortization) so the UI doesn't render a fake "tenure saved". Real bug surfaced + fixed during testing: floating-point drift in the simulation caused the no-change baseline to run 241 months instead of 240 — added a half-paisa epsilon snap to the final-row check. Field renamed from spec's `increasedEmi` to `newEmi` because the field carries the new value regardless of direction; divergence is caught explicitly.
- **2026-05-13** — Partial Payment Calculator — §1 row 13 (❌ → ✅). New: [`lib/calculators/partialPayment.ts`](../../lib/calculators/partialPayment.ts), [`app/calculators/partial-payment/page.tsx`](../../app/calculators/partial-payment/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/partialPayment.test.ts`](../../__tests__/unit/lib/calculators/partialPayment.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Reuses `emiFromLoan` + extracted date helpers (`parseStartDate`, `formatMonthYear`, `resolveStartOrToday`, `monthsBetween`) now exported from [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts). Implementation simulates month-by-month rather than using the spec §13.3 closed-form remaining-tenure formula, because the spec also requires a full revised amortization array — simulation produces both in one pass. Supports multiple prepayments, prepayment-on-same-month summing, and gracefully drops invalid prepayment dates.
- **2026-05-13** — EMI Capacity Calculator — §1 row 12 (❌ → ✅). New: [`lib/calculators/emiCapacity.ts`](../../lib/calculators/emiCapacity.ts), [`app/calculators/emi-capacity/page.tsx`](../../app/calculators/emi-capacity/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/emiCapacity.test.ts`](../../__tests__/unit/lib/calculators/emiCapacity.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Extracted `emiFromLoan` + `loanFromEmi` helpers from [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts) so the inverse-annuity math is shared (EMI Calc refactored to use `emiFromLoan`; all 18 EMI tests still pass). Note: spec §12.5 quotes ₹48.45L for the canonical case, but the §12.3 formula yields ~₹53.80L from EMI=45,000 at 8%/240mo — implementation follows the formula, not the spec's example value (same internal-inconsistency pattern as §11.5).
- **2026-05-13** — EMI Calculator — §1 row 11 (❌ → ✅). New: [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts), [`app/calculators/emi/page.tsx`](../../app/calculators/emi/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/emi.test.ts`](../../__tests__/unit/lib/calculators/emi.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Note: spec §11.5 quotes EMI ≈ ₹27,748 for the canonical 30L/8%/20yr example, but the standard EMI formula yields ₹25,093.10; implementation follows the formula, not the spec's example value (documented in test).
- **2026-05-13** — Initial gap analysis created. Snapshot: 10/15 calculators done, subscriptions/auth shells in place, plan-sharing and master-data absent, no notifications/compliance pages.
