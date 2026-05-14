# Bloomkite — Gap Analysis & Implementation Status

**Last Updated**: 2026-05-13 (§9 Master-data fully green — all calculator + advisor-side reference data now DB-driven and admin-editable; risk profiler questionnaire moved out of code)
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
| Investment interests / categories | ✅ | `investor_investment_interests` M:N to `master_data_investment_categories`. Multi-select picker on the investor profile page; full-replace PUT semantics on save. |
| Financial accounts setup | ✅ | `investor_financial_accounts` M:N to `master_data_account_types` with optional `institution_name`. NO balance fields by design (BRD §8.5 data minimisation). Add/remove rows on the investor profile page. |

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

## 4. Plan sharing — largely landed (BRD's headline differentiator)

BRD §3.3, §5.3, §11.2 position plan-sharing as the platform's key competitive advantage.

| Capability | Status |
|---|---|
| Save plan (`financial_plans` table) | ✅ |
| Choose multiple advisors to share with | ✅ |
| Sharing permissions (view-only / comment) | ✅ |
| Advisor receives notification | ❌ — see §10 (notifications absent platform-wide) |
| Advisor views plan with full data | ✅ |
| Advisor adds comments / recommendations | ✅ |
| Investor sees multiple advisor responses | ✅ |
| Advisor cannot see others' feedback (BRD §8.5) | ✅ — comments scoped per-PlanShare row, no cross-advisor query path |
| Sharing cap of 5 advisors (BRD §8.1) | ✅ — enforced in [share route](../../app/api/financial-plans/[id]/share/route.ts) |

`plan_shares` + `plan_comments` tables landed 2026-05-13. Unlocks UC-1, UC-3, UC-4, UC-5, UC-7 from a data + workflow standpoint; UC-7 ("compare advisor feedback") has its own page at [/plans/[id]/feedback](../../app/plans/[id]/feedback/page.tsx). Notifying advisors of incoming shares is the only remaining hole — blocked by §10 (no notification system exists yet).

---

## 5. Advisor discovery & engagement — fully landed

| Feature | Status | Notes |
|---|---|---|
| List/search advisors | ✅ | [advisors page](../../app/advisors/page.tsx), [search](../../app/api/advisors/search/route.ts) |
| Public profile | ✅ | [advisor detail](../../app/advisors/[id]/page.tsx) |
| Follow advisor | ✅ | `advisor_followers`, denormalized count |
| **Filter by expertise/products/services/brands** | ✅ | Faceted sidebar on [/advisors](../../app/advisors/page.tsx); search route ANDs across dimensions, ORs within. AdvisorProduct/Service/Brand back-relations on User power Prisma's `some` filter |
| **Advisor ratings/reviews** | ✅ | `advisor_ratings` table, denormalised `ratingCount`/`ratingAverage` on advisor_profiles. POST/GET/DELETE at [/api/advisors/:id/ratings](../../app/api/advisors/[id]/ratings/route.ts); aggregate recomputed in-transaction. Star-picker + reviews list on advisor public profile. Eligibility intentionally permissive at MVP (any signed-in non-self) |
| **Tag advisor in forum question** | ✅ | `forum_question_advisor_tags` join table, capped at 5 per question. Multi-select tagging UI on [/forum/ask](../../app/forum/ask/page.tsx); tagged advisors render as pills on the question detail page. Advisor's [tagged-feed](../../app/api/advisor/forum-tags/route.ts) surfaces in [/advisor/inbox](../../app/advisor/inbox/page.tsx) — the notification surface until §10 lands |

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

## 8. Admin — fully landed

| Feature | Status |
|---|---|
| Dashboard stats | ✅ |
| Article moderation UI | ✅ |
| Credential approval UI | ✅ |
| **User management (suspend/delete/role-edit)** | ✅ — list/detail/disable/role-toggle existing; hard-delete added with last-admin guard |
| **Master data CRUD** (products, services, brands, urgency, calculator categories, etc.) | ✅ — single dispatcher API + CRUD UI across all 7 domains |
| **Membership plan editor** | ✅ — full CRUD on `subscription_plans`, JSON features blob, soft-deactivate |
| **Compliance reports / audit log viewer** | ✅ — `AdminAudit` table populated since launch; viewer at `/admin/audit-log` with actor/action/target/date filters |
| **Bulk moderation actions** | ✅ — articles bulk approve/reject with checkbox selection on existing /admin/content |
| **Forum moderation UI** | ✅ — list with status filter; lock/unlock/delete question; delete answer with answer-count decrement |

---

## 9. Master / reference data — completely absent

BRD repeatedly references master-data tables. Status:

- ✅ Investment categories (BRD §3.1 step 4) — `master_data_investment_categories`, 10 rows seeded
- ✅ Products (BRD §3.2 step 5) — `master_data_products`, 11 rows seeded
- ✅ Services (BRD §3.2 step 5) — `master_data_services`, 10 rows seeded — also serves as the canonical source for advisor "expertise" tags (legacy `advisor_expertise` table deprecated, reads union the two for back-compat)
- ✅ Brands (BRD §3.2 step 5) — `master_data_brands`, 15 rows seeded
- ✅ Account types (BRD §3.1 step 5) — `master_data_account_types`, 12 rows seeded
- ✅ Urgency levels (1–9) for Priority Ranker — `master_data_urgency_levels`, 9 rows seeded; calculator UI + lib both wired to read from the table
- ✅ Calculator categories — `master_data_calculator_categories` (table only; catalog page wiring is a follow-up)
- ✅ Cash-flow income + expense categories — `master_data_income_categories` (9 rows) + `master_data_expense_categories` (17 rows); Cash Flow calculator inputs now backed by datalist suggestions, free-text still supported for back-compat
- ✅ Net-worth asset + liability types — `master_data_asset_types` (15 rows) + `master_data_liability_types` (10 rows); Net Worth calculator inputs wired with the same datalist pattern
- ✅ Risk-profile questions / answers / point values — `risk_profile_questions` (17 rows incl. conditional Q3.1) + `risk_profile_answers`. Calculator scoring algorithm unchanged (`maxScoreForInversion` stored per-row preserves Q3's special max=0). [GET /api/calculators/risk-profiler/questions](../../app/api/calculators/risk-profiler/questions/route.ts) feeds the page; FALLBACK_QUESTIONS array kept for graceful degradation
- ❌ Advisor types / specializations taxonomy (covered de-facto by services; a dedicated taxonomy is a separate scope decision)

**All BRD-tracked master-data domains now landed**. 11 master-data tables in total (10 generic + risk-profile question/answer pair). Admin CRUD UI at [/admin/master-data](../../app/admin/master-data/page.tsx) now exposes all 11 generic domains via the single dispatcher (risk-profile Q&A managed via the seed script for now — admin UI for question editing is a separate scope). Slugs are immutable from the UI (code may hard-code them). The seed script remains the bootstrap entry point.

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

- **2026-05-13** — §9 Master-data — all five remaining sub-tasks ❌ → ✅. The calculator + advisor surfaces are now fully DB-driven and admin-editable; the only hard-coded fallbacks are graceful-degradation defaults that match the seed.
  - **Schema** (migration `20260514034652_reference_data_extensions`): six new tables. Four follow the existing master-data shape (slug+name+description+sortOrder+isActive) and slot into the dispatcher: `master_data_income_categories`, `master_data_expense_categories`, `master_data_asset_types`, `master_data_liability_types`. Two are bespoke for the risk-profile questionnaire: `risk_profile_questions` (with `questionNumber` Decimal preserving the existing 3.1 conditional, `maxScoreForInversion` Int preserving Q3's binary max=0, optional self-FK + answer-score for conditional rendering) and `risk_profile_answers`.
  - **Seed** ([`database/seed-master-data.ts`](../../database/seed-master-data.ts)): extended with urgency-levels (9), income (9), expense (17), assets (15), liabilities (10) — total 60 new rows. New [`database/seed-risk-profile.ts`](../../database/seed-risk-profile.ts) seeds 17 questions + their answer sets via two-pass insert (questions first, conditional FKs second) and is fully idempotent (upsert by slug; answers re-created in lockstep so wording edits propagate).
  - **Public read endpoint** ([/api/master-data/:domain](../../app/api/master-data/[domain]/route.ts)) extended with the 6 new domains (`urgency-levels`, `income-categories`, `expense-categories`, `asset-types`, `liability-types`). Admin dispatcher registry in [`lib/admin-master-data.ts`](../../lib/admin-master-data.ts) likewise extended — admin CRUD UI now serves all 11 generic master-data domains automatically.
  - **Priority Ranker wiring** (BRD §3.2 / §4): [page](../../app/calculators/priority-ranker/page.tsx) fetches urgency labels from `urgency-levels` master-data and passes them through `rankGoals(input, urgencyLabels)` so result rows render the admin-edited names. `urgencyLabels` defaults to the seed values for back-compat with existing tests + scripts.
  - **Risk Profiler** (BRD §6.3 / Calculators §6): [GET /api/calculators/risk-profiler/questions](../../app/api/calculators/risk-profiler/questions/route.ts) returns the active questionnaire with conditional metadata. [Page](../../app/calculators/risk-profiler/page.tsx) hydrates `questions` state from the API; falls back to the in-file seed if the fetch fails (so the calculator never blocks on master-data loading). Scoring algorithm in [`lib/calculators/riskProfiler.ts`](../../lib/calculators/riskProfiler.ts) unchanged — same `(questionNumber, answerScore)` consumption — so the existing 32 unit tests still pass.
  - **Cash Flow + Net Worth wiring** (BRD §2.5 / §3.3): both calculators now render an HTML5 `<datalist>` per row populated from master-data, surfacing curated category names while preserving free-text input. Existing saved plans with arbitrary names load unchanged — no migration of stored `inputs` JSON required. Pattern: free-text + datalist beats forced dropdown because (a) zero migration risk, (b) lets users record categories not yet in master-data, (c) admin can add the missing one later and the autocomplete picks it up.
  - **Advisor expertise migration**: legacy `advisor_expertise` (free-text specialization tags) is now superseded by `advisor_services` → `master_data_services` for canonical expertise tags. The three reading routes ([search](../../app/api/advisors/search/route.ts), [advisor detail](../../app/api/advisors/[id]/route.ts), [own profile](../../app/api/advisors/profile/route.ts)) now derive expertise from declared services; the legacy table is unioned in for back-compat until a follow-up cleanup commit drops it. The PUT route's `expertise: string[]` payload field is now silently ignored; new tags come via the existing services-declarations endpoint.
  - **Admin UI bonus**: with the registry extension, the existing [/admin/master-data](../../app/admin/master-data/page.tsx) UI from §8 automatically picks up all four new generic domains — no UI changes needed.
  - Verified: type-check clean, 278/278 unit tests pass.
- **2026-05-13** — §8 Admin — 6 of 6 remaining capabilities ❌ → ✅ (BRD §8.5, §13.2 audit; full admin operations surface).
  - **Schema** (migration `20260514030740_admin_master_data_extensions`): two new master-data tables `master_data_urgency_levels` (Priority Ranker 1..9 scale) and `master_data_calculator_categories`. Both follow the same shape as the other five domains. `lib/admin-master-data.ts` registry maps domain slug → Prisma delegate so a single dispatcher route serves all seven CRUD endpoints. `lib/admin-audit.ts` AdminAuditAction union + targetType union extended with the new admin verbs (`user.delete`, `master_data.*`, `plan.*`, `forum.*`, `article.bulk_*`).
  - **User management**: existing list/detail/disable/role-toggle stayed. Added [DELETE /api/admin/users/:id](../../app/api/admin/users/[id]/route.ts) with last-admin guard, self-delete guard, and audit-write BEFORE the cascade so the trail survives. UI gained a "Danger zone" card with type-the-email confirm.
  - **Master-data CRUD**: [GET/POST /api/admin/master-data/:domain](../../app/api/admin/master-data/[domain]/route.ts) (list with inactive included, create) + [PATCH/DELETE/POST?action=reactivate /api/admin/master-data/:domain/:id](../../app/api/admin/master-data/[domain]/[id]/route.ts) (update, soft-deactivate, reactivate). Slugs immutable from the UI — code may hard-code them. UI at [/admin/master-data](../../app/admin/master-data/page.tsx) (domain index) + [/admin/master-data/[domain]](../../app/admin/master-data/[domain]/page.tsx) (inline-edit table with create form, sort-order, status pill, deactivate/reactivate).
  - **Membership-plan editor**: [POST/GET /api/admin/plans](../../app/api/admin/plans/route.ts) + [PATCH/DELETE /api/admin/plans/:id](../../app/api/admin/plans/[id]/route.ts). DELETE soft-deactivates rather than hard-deletes — live subscriptions FK to plan_id and a hard delete would break billing history. UI at [/admin/plans](../../app/admin/plans/page.tsx) with rupee→paise conversion in the form, JSON features editor, in-place edit.
  - **Forum moderation**: [GET /api/admin/forum/questions](../../app/api/admin/forum/questions/route.ts) (list with status + search filter, includes closed/locked), [POST/DELETE /api/admin/forum/questions/:id/lock](../../app/api/admin/forum/questions/[id]/lock/route.ts) (lock = `status='closed'`, hides from public forum but preserves history), [DELETE /api/admin/forum/questions/:id](../../app/api/admin/forum/questions/[id]/route.ts) (cascades answers + tags), [DELETE /api/admin/forum/answers/:id](../../app/api/admin/forum/answers/[id]/route.ts) (decrements the question's denormalised `answer_count` in-transaction). UI at [/admin/forum](../../app/admin/forum/page.tsx).
  - **Audit-log viewer**: [GET /api/admin/audit](../../app/api/admin/audit/route.ts) with filters on actor/action/targetType/targetId/from/to. UI at [/admin/audit-log](../../app/admin/audit-log/page.tsx) — table with collapsible JSON metadata, dropdowns of known actions/target-types pre-populated.
  - **Bulk article moderation**: [POST /api/admin/articles/bulk](../../app/api/admin/articles/bulk/route.ts) accepts `{action: 'approve'|'reject', ids[], rejectionReason?}`. Pending-only filter on the bulk update so already-published rows are silently skipped (returns `processed`/`skipped`/`requested` counts). Single audit row per bulk op with the id list in metadata. UI: sticky checkbox bar on the existing /admin/content articles tab — select-all toggle, "Approve N" / "Reject N…" with shared rejection reason.
  - **Admin landing** rebuilt to surface all 7 sections (was 3): content moderation, users, master-data, plans, forum, audit-log, AI features. Reusable `<AdminCard>` extracted inline.
  - Verified: type-check clean, 278/278 unit tests pass.
- **2026-05-13** — §5 Advisor discovery & engagement — 3 of 3 remaining rows ❌/🟡 → ✅ (BRD §3.1, §3.4, §7.1).
  - **Schema**: `advisor_ratings` (one per investor↔advisor pair, unique), `forum_question_advisor_tags` (M:N pivot). Denormalised `ratingCount` + `ratingAverage` (Decimal(3,2)) on `advisor_profiles` recomputed in-transaction with every write so the public card is always exact. Added `user` back-relations on `advisor_products` / `advisor_services` / `advisor_brands` so Prisma can filter advisors by joined master-data without raw SQL. New indexes on the three M:N pivots' `<X>_id` columns to make the faceted lookup cheap, plus `idx_advisor_profiles_rating_average` for the "top rated" sort. Migration `20260514025441_discovery_engagement`.
  - **BRD §3.1 step 5 / §5 Filter by products/services/brands** (🟡 → ✅). [GET /api/advisors/search](../../app/api/advisors/search/route.ts) extended to accept repeatable `product`, `service`, `brand` UUIDs plus existing `q`/`city`/`specialization`. AND across dimensions, OR within (matches the affordance the sidebar gives). New `sort=rating` branch uses `(ratingAverage DESC NULLS LAST, ratingCount DESC, createdAt DESC)` so unrated advisors don't outrank mid-rated ones. Faceted sidebar UI on [/advisors](../../app/advisors/page.tsx) with checkbox panels per master-data domain, deep-linkable URL state, and a clear-all action.
  - **BRD §7.1 Advisor ratings/reviews** (❌ → ✅). Investor leaves a 1-5 star rating + optional review (max 4000 chars) at the advisor profile via [POST/GET/DELETE /api/advisors/:id/ratings](../../app/api/advisors/[id]/ratings/route.ts). Upsert semantics — investor edits their existing row, never accumulates duplicates. Self-rating + un-approved-advisor both rejected. Eligibility intentionally permissive at MVP (any signed-in non-self user) — tightening to "must have shared a plan" is a follow-up after we have signal on whether it harms cold-start more than it helps trust. AdvisorCard shows ⭐ avg + count in search results; public profile gets a ratings section with summary, write/edit form (StarPicker with hover preview), and reviews list.
  - **BRD §3.4 Tag advisor in forum question** (❌ → ✅). [POST /api/forum/questions](../../app/api/forum/questions/route.ts) accepts `taggedAdvisorIds: string[]` (capped at 5 — see [`lib/advisor-engagement.ts`](../../lib/advisor-engagement.ts) MAX_TAGGED_ADVISORS_PER_QUESTION). Self-tag dropped silently; non-approved advisors rejected. Question detail GET now returns `tagged_advisors[]` so [/forum/questions/[id]](../../app/forum/questions/[id]/page.tsx) renders pill links to each. Ask form has a search-and-pick advisor selector that respects the cap.
  - **Notification surface**: until §10 lands, advisors check tags via the new [GET /api/advisor/forum-tags](../../app/api/advisor/forum-tags/route.ts) endpoint, surfaced in a "Tagged in forum questions" section above the shared-plans list on [/advisor/inbox](../../app/advisor/inbox/page.tsx). Same pattern the plan-sharing inbox follows — both will hand off to real notifications when that subsystem ships.
  - **Article tagging** (BRD §3.4 ALSO mentions tagging advisors in articles): not in this commit. Articles are advisor-authored, so investor→advisor tagging makes less sense there. Defer to a separate scope decision — current shape supports questions only.
  - Verified: type-check clean, 278/278 unit tests pass.
- **2026-05-13** — §4 Plan sharing — 8 of 9 rows ❌ → ✅ (BRD §3.3, §5.3, §8.1, §8.5, UC-7). The platform's headline differentiator is now live end-to-end:
  - **Schema**: new `plan_shares` (one row per investor↔advisor for a plan, unique on `(plan_id, advisor_id)`, status NEW/VIEWED/REVIEWED/REVOKED, permission VIEW/COMMENT) and `plan_comments` (per-share thread) tables. Migration `20260514020000_plan_sharing` + Prisma drift fix-up `20260514020821_plan_sharing` (FK `ON UPDATE` rewrite, same pattern as `bk_refactor_1`). Constants live in [`lib/plan-sharing.ts`](../../lib/plan-sharing.ts) so the cap and status set can't drift between routes.
  - **BRD §8.1 cap (max 5 advisors)** enforced in [POST /api/financial-plans/:id/share](../../app/api/financial-plans/[id]/share/route.ts) by combining current active shares with the new request and rejecting with 409 if it would exceed 5. Re-sharing after revoke flips the existing row's status back to NEW (upsert) rather than inserting a duplicate.
  - **BRD §8.5 (no cross-advisor visibility)** is structural, not query-time: `plan_comments` are FK'd to a single `plan_shares` row, and a share row is unique to one advisor. Routes scope by `share.advisorId === me.id`, so an advisor literally cannot fetch another advisor's comments — no "where authorId in" query path exists.
  - **Investor share UI**: [/plans](../../app/plans/page.tsx) lists saved plans with active-share badges and opens an inline ShareDialog modal that lets the investor pick advisors from the catalog, set permission (VIEW/COMMENT), add an optional message, and revoke / re-permission existing shares. Cap-aware: greys out the picker once 5 active slots are full.
  - **Advisor inbox + plan view**: [/advisor/inbox](../../app/advisor/inbox/page.tsx) lists shared plans with status pills (NEW/VIEWED/REVIEWED) and includes the investor's risk profile + city for context. Opening a single share at [/advisor/inbox/:shareId](../../app/advisor/inbox/[shareId]/page.tsx) flips status NEW→VIEWED on first view, renders the plan inputs/results, and exposes a comment composer (only when permission='COMMENT' — VIEW-only shares show an explainer card instead). First comment promotes the share to REVIEWED.
  - **Investor compare-feedback view (UC-7)**: [/plans/:id/feedback](../../app/plans/[id]/feedback/page.tsx) returns one card per advisor with status indicator + their full comment thread. Side-by-side grid (responsive 1/2/3 cols). Revoked shares appear greyed out — investors who pulled a share back may still want to see what was said.
  - **API surface**: 7 new routes — investor: GET [list](../../app/api/financial-plans/route.ts), POST [share](../../app/api/financial-plans/[id]/share/route.ts), GET [shares](../../app/api/financial-plans/[id]/shares/route.ts), PATCH/DELETE [single share](../../app/api/financial-plans/[id]/shares/[shareId]/route.ts), GET [feedback compare](../../app/api/financial-plans/[id]/feedback/route.ts); advisor: GET [inbox](../../app/api/advisor/shared-plans/route.ts), GET [single share](../../app/api/advisor/shared-plans/[shareId]/route.ts), POST [comment](../../app/api/advisor/shared-plans/[shareId]/comments/route.ts).
  - **Open follow-up**: notify advisor on incoming share (last ❌ row) — blocked by §10 (no notifications subsystem). When that lands, hook the in-app notification + email send into the share-route success path.
- **2026-05-13** — §3 Investor financial accounts (❌ → ✅, BRD §3.1 step 5). New `investor_financial_accounts` table M:N to `master_data_account_types` with optional `institution_name`. Migration `20260513240500_investor_financial_accounts`. **No balance/amount fields** — Bloomkite is an advisor-discovery platform, not a portfolio tracker, and BRD §8.5 (data minimisation) forbids capturing data we don't need. New [GET/PUT /api/investors/financial-accounts](../../app/api/investors/financial-accounts/route.ts) endpoint — full-replace PUT semantics; the same `account_type` can appear multiple times with different institution names (one HDFC savings + one ICICI savings). UI: a new "Financial Accounts" section on [/profile/investor](../../app/profile/investor/page.tsx) with add/remove rows, each row picking an account type from the master-data dropdown + optional institution-name text input. **§3 Profiles is now fully green** — both investor and advisor rows.
- **2026-05-13** — §3 Investor investment interests (❌ → ✅, BRD §3.1 step 4). New `investor_investment_interests` join table M:N to `master_data_investment_categories`. Migration `20260513240400_investor_interests`. New [GET/PUT /api/investors/interests](../../app/api/investors/interests/route.ts) endpoint with full-replace semantics + dedup. Multi-select checkbox card on [/profile/investor](../../app/profile/investor/page.tsx) — no ranking (every interest equal weight per spec).
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
