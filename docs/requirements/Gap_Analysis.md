# Bloomkite — Gap Analysis & Implementation Status

**Last Updated**: 2026-05-13 (EMI, EMI Capacity, Partial Payment calculators landed)
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

## 1. Calculators — 13 of 15 done

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
| 14 | **EMI Change Impact** | — | — | ❌ | Depends on EMI |
| 15 | **Rate Change Impact** | — | — | ❌ | Depends on EMI |

**Loans cluster: 3/5 done.** EMI + EMI Capacity + Partial Payment in. EMI Change Impact and Rate Change Impact remain — both reuse the same amortization simulation pattern that just landed.

---

## 2. Auth & onboarding

| Requirement | Status | Evidence / gap |
|---|---|---|
| Email signup + JWT | ✅ | Supabase Auth, [middleware.ts](../../middleware.ts) gates routes |
| Multi-role (investor/advisor/admin) | ✅ | [role-selection](../../app/api/auth/role-selection/route.ts), `roles`/`user_roles` tables |
| **OTP via email/SMS** | 🟡 | Relies on Supabase magic-link defaults; no explicit OTP step. BRD §3.1, §8.1 require it |
| **Phone verification** | ❌ | Phone collected in profile but never verified; BRD §8.1 mandates Email+Phone OTP |
| **Password reset flow** | ❌ | No custom UI/route; deferred to Supabase. BRD §7.2 must-block |
| **Age 18+ verification** | ❌ | BRD §8.1 legal requirement; no check |
| Session management | ✅ | Cookie-based via SSR client |

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
| Professional info (license, experience) | 🟡 | Has company/designation/PAN/GST; no structured "years of experience" or license registration number |
| Certifications/awards/education/experience | 🟡 | One generic `advisor_credentials` table — does not separate the four credential classes BRD §3.2 calls out |
| **Products / Services / Brands declaration** | ❌ | `advisor_expertise` stores free-text tags only. BRD §3.2 expects three distinct master-data-backed dimensions |
| **Advisor ranking / priority** | ❌ | BRD §3.2 step 6 — assign priority to products/services. Not modeled |
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

BRD repeatedly references master-data tables that don't exist:

- ❌ Products (Mutual Funds, Insurance, FDs, …)
- ❌ Services (Wealth Mgmt, Retirement Planning, …)
- ❌ Brands (financial institutions)
- ❌ Urgency levels (1–9) for Priority Ranker
- ❌ Cash-flow item categories
- ❌ Net-worth account-entry types
- ❌ Risk-profile questions/answers/point values (logic exists but not DB-driven)
- ❌ Advisor types / specializations taxonomy

Calculators currently hard-code these structures; BRD assumes admin-configurable.

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

Functional pass against the spec is **not yet done**. Risk areas to verify:

- **Goal Planner**: BRD example expects ₹44,124.56/month for canonical inputs. Confirm `lib/calculators/goalPlanner.ts` matches.
- **Risk Profiler**: BRD §6.3 fixes 5 score bands + exact allocation %s. Confirm bands/allocations.
- **Cash Flow**: BRD §2.5 — only `isRecurring=true` items count. Confirm filter.
- **Net Worth**: BRD §3.3 — expects both current and future-value sums + growth %.
- **Insurance**: BRD §5.3 — all four stability×predictability cells reduce to 10 or 15.

Use `functional-review` skill against `lib/calculators/` for certainty.

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

- **2026-05-13** — Partial Payment Calculator — §1 row 13 (❌ → ✅). New: [`lib/calculators/partialPayment.ts`](../../lib/calculators/partialPayment.ts), [`app/calculators/partial-payment/page.tsx`](../../app/calculators/partial-payment/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/partialPayment.test.ts`](../../__tests__/unit/lib/calculators/partialPayment.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Reuses `emiFromLoan` + extracted date helpers (`parseStartDate`, `formatMonthYear`, `resolveStartOrToday`, `monthsBetween`) now exported from [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts). Implementation simulates month-by-month rather than using the spec §13.3 closed-form remaining-tenure formula, because the spec also requires a full revised amortization array — simulation produces both in one pass. Supports multiple prepayments, prepayment-on-same-month summing, and gracefully drops invalid prepayment dates.
- **2026-05-13** — EMI Capacity Calculator — §1 row 12 (❌ → ✅). New: [`lib/calculators/emiCapacity.ts`](../../lib/calculators/emiCapacity.ts), [`app/calculators/emi-capacity/page.tsx`](../../app/calculators/emi-capacity/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/emiCapacity.test.ts`](../../__tests__/unit/lib/calculators/emiCapacity.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Extracted `emiFromLoan` + `loanFromEmi` helpers from [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts) so the inverse-annuity math is shared (EMI Calc refactored to use `emiFromLoan`; all 18 EMI tests still pass). Note: spec §12.5 quotes ₹48.45L for the canonical case, but the §12.3 formula yields ~₹53.80L from EMI=45,000 at 8%/240mo — implementation follows the formula, not the spec's example value (same internal-inconsistency pattern as §11.5).
- **2026-05-13** — EMI Calculator — §1 row 11 (❌ → ✅). New: [`lib/calculators/emi.ts`](../../lib/calculators/emi.ts), [`app/calculators/emi/page.tsx`](../../app/calculators/emi/page.tsx), types in [`lib/calculators/types.ts`](../../lib/calculators/types.ts), unit tests in [`__tests__/unit/lib/calculators/emi.test.ts`](../../__tests__/unit/lib/calculators/emi.test.ts), tile added to [`app/calculators/page.tsx`](../../app/calculators/page.tsx). Note: spec §11.5 quotes EMI ≈ ₹27,748 for the canonical 30L/8%/20yr example, but the standard EMI formula yields ₹25,093.10; implementation follows the formula, not the spec's example value (documented in test).
- **2026-05-13** — Initial gap analysis created. Snapshot: 10/15 calculators done, subscriptions/auth shells in place, plan-sharing and master-data absent, no notifications/compliance pages.
