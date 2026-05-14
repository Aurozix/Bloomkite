# Bloomkite Layout Standard v1.0

**Status**: Production
**Owner**: Bloomkite Business
**Approved**: 2026-05-13
**Relationship to brand**: This file is downstream of [`docs/branding/brand.md`](../branding/brand.md). The brand file defines colors, typography, iconography, and spacing tokens; this file defines how those primitives compose into page layouts. If this file conflicts with the brand file, the brand file wins.

---

## 1. Why this exists

Before this standard, customer-facing pages used seven different outer container widths (`max-w-md` through `max-w-7xl`) with no rule for which to pick when, three different section-padding values applied inconsistently, and twenty-two of thirty pages used `bg-gray-50` — a color outside the brand ramp. Two implementations of the same pricing screen lived in `app/page.tsx` and `app/subscriptions/page.tsx`, drifting from each other in width, font, color, and structure.

This file replaces that variance with a small set of named buckets. Every new page picks a bucket and stays there. Every existing page maps to exactly one bucket via the table in §9.

---

## 2. Principles

1. **One width per page-purpose.** Four width buckets total. Every page picks one.
2. **One vertical rhythm.** Three section-padding values, mapped to surface type.
3. **One background system.** Paper substrate everywhere except explicit brand surfaces. `bg-gray-50` is banned.

A fourth implicit principle: **shared shells, not parallel copies.** Anywhere the same screen appears in two routes (pricing is the existing example; advisor cards may be the next), the implementation lives in one shared component consumed by both routes.

---

## 3. Width buckets

Four buckets, named by purpose. Tailwind utility on the left; pixel width and use case on the right.

| Bucket | Utility | Pixels | Use |
|---|---|---|---|
| **Form** | `max-w-md` | 448 | Auth screens and single-purpose short forms (signin, role-selection if simplified). Centered vertically. |
| **Reading** | `max-w-3xl` | 768 | Single-column content — long-form: article detail, forum question, dashboard summary, profile forms, all individual calculators (one form, one result), forum/ask, articles/create. |
| **Detail** | `max-w-5xl` | 1024 | Marketing sections, pricing cards, advisor profile (header + tabs + content), calculator result with comparison cards. |
| **Index** | `max-w-7xl` | 1280 | List/grid pages: advisor directory, article list, forum list, calculator index, admin. |

**Banned widths:** `max-w-2xl`, `max-w-4xl`, `max-w-6xl` on the outermost page container. (`max-w-2xl` inside a `max-w-5xl` page is fine — e.g. for a centered text block within a Detail surface.)

**Same-shape pages must use the same bucket.** All ten individual calculator pages → Reading 3xl. All form-driven authoring pages (profile forms, forum/ask, articles/create) → Reading 3xl. All list pages → Index 7xl.

---

## 4. Vertical rhythm

Three section-padding values, derived from brand spacing tokens (`--bk-space-7..9`).

| Surface | Outer section padding | Token |
|---|---|---|
| Home marketing sections (hero, features, pricing, closing CTA) | `py-24` | `--bk-space-9` (96px) |
| Functional pages (auth-gated; everything except home + index lists) | `py-16` | `--bk-space-8` (64px) |
| Index list pages | `py-12` | `--bk-space-7` (48px) |

**Intra-section spacing** (between subsections within a page):

- `mb-16` between major subsections (e.g. header → grid → footer).
- `mb-12` between heading block and its grid/content.
- `mb-6` between heading and subtitle.
- `mb-8` after pricing/feature card grids before footer copy.

All of these come from existing brand spacing tokens; no new spacing values are introduced.

---

## 5. Horizontal gutters

One pattern, universal:

```
px-4 sm:px-6 lg:px-8
```

This is already the dashboard/admin pattern. Applied to every customer-facing page's outermost container, no exceptions. Auth screens use the same gutter inside the centered card.

---

## 6. Background

- **`bg-paper`** — the default page substrate. Set once at the `<main>` level in [`app/layout.tsx`](../../app/layout.tsx); individual pages do not redeclare.
- **`bg-forest-700 text-paper`** — explicit brand surfaces only: hero, closing CTA, future Forest-tinted sections. Always paired with `text-paper` on the section element so children inherit correctly (see [`feedback-no-color-in-base-typography`](../../memory/feedback_no_color_in_base_typography.md) memory for why explicit color is required on Forest surfaces).
- **`bg-white`** — raised surfaces only: cards, dropdown panels, modal bodies. Maps to `--bk-color-surface-raised` per brand §9.
- **`bg-gray-50`** — **banned**. Deleted from the codebase during the color audit. Any page-level "subtle gray" surface should use `bg-paper` (the substrate) or `bg-ink-100` (the brand sunken surface).

---

## 7. Canonical page shell

Every customer-facing page follows this shape:

```jsx
<section className="max-w-{bucket} mx-auto px-4 sm:px-6 lg:px-8 py-{rhythm}">
  <PageHeader
    eyebrow="..."          // optional, xs uppercase tracking-wider, text-ink-400
    title="..."            // h1, font-serif text-4xl md:text-5xl text-forest-700
    subtitle="..."         // optional, text-ink-600, max-w-2xl
  />
  {/* page content — cards, forms, lists */}
</section>
```

**Components to build** (one PR, no behavior change):

1. **`<PageShell bucket subface>`** — renders the `<section>` wrapper with the right width and padding. Receives one of `"form" | "reading" | "detail" | "index"` and one of `"marketing" | "functional" | "list"`. Type errors at build time if a page hardcodes a width class.

2. **`<PageHeader eyebrow title subtitle level surface align>`** — renders the three-line header. Title is `<h1 className="font-serif text-4xl md:text-5xl font-medium text-forest-700 leading-tight tracking-tight">` by default. Props:
   - `level: "h1" | "h2"` (default `"h1"`) — switches the element while preserving identical visual treatment. Use `"h2"` for section headers inside multi-section pages (e.g. the home page's features and pricing sections).
   - `surface: "light" | "forest"` (default `"light"`) — swaps title to `text-paper`, eyebrow to `text-saffron-300`, subtitle to `text-forest-200` for Forest substrates.
   - `align: "left" | "center"` (default `"left"`) — centers the block and constrains the subtitle to a centered reading column.
   - Eyebrow and subtitle are optional.

Once these exist, every page becomes:

```jsx
<PageShell bucket="reading" surface="functional">
  <PageHeader eyebrow="Profile" title="Investor profile" subtitle="..." />
  {/* form */}
</PageShell>
```

This makes drift mechanically impossible — the only way to deviate is to bypass the shell, which review can catch in one glance.

---

## 8. Pricing consolidation (mandate)

The home pricing section ([`app/page.tsx`](../../app/page.tsx) §Pricing) and the `/subscriptions` page ([`app/subscriptions/page.tsx`](../../app/subscriptions/page.tsx)) currently render the same data with two different implementations. This is the single worst drift case in the codebase and the cause that prompted this standard.

**The fix is structural, not cosmetic:**

1. Extract a `<PricingPlans>` component that accepts plan data + optional live-state props (`currentPlanSlug`, `currentPeriodEnd`, `onSubscribe` handler). Component lives at `app/components/PricingPlans.tsx`.
2. The component implements the home-pricing shape: eyebrow + Fraunces title + ink-600 subtitle; `max-w-5xl mx-auto`; `grid md:grid-cols-3 gap-6`; featured tier = `ring-2 ring-forest-400 md:scale-[1.03]` + forest-400 "Most popular" pill; premium tier = `ring-1 ring-saffron-300` + saffron-400 "Premium" pill; plan name in Fraunces; price in JetBrains Mono (`font-data`); CTAs via brand button utilities.
3. **`/` consumes `<PricingPlans>`** in its pricing section — no live state, three static plans, marketing CTAs (`Get started` / `Subscribe`).
4. **`/subscriptions` consumes `<PricingPlans>`** with live state — current-plan banner above (forest-50 background, not blue), "Current plan" disabled CTA on the user's current tier, footer copy about INR pricing and cancellation.
5. The existing inline pricing implementation in `app/subscriptions/page.tsx` is **deleted entirely**, not refactored. (See [`feedback-small-commits-per-surface`](../../memory/feedback_small_commits_per_surface.md) — this should be one PR.)

After this change, the two surfaces can never drift again because there is only one source.

---

## 9. Page-by-page migration mapping

Every customer-facing page mapped to its target bucket and rhythm. "Current" is what's in the codebase as of 2026-05-13; "Target" is what this standard requires.

| Page | Current width | Current padding | Target bucket | Target rhythm |
|---|---|---|---|---|
| `/` (home) | mixed (4xl hero / 5xl sections / 3xl closing) | py-24 / py-20 | **Reference implementation — keep as designed.** This is the canonical marketing layout. | Marketing rhythm |
| `/advisors` (list) | 7xl | py-12 | Index 7xl ✓ | py-12 ✓ |
| `/advisors/[id]` | 4xl | py-12 | Detail 5xl | py-16 |
| `/articles` (list) | 7xl | py-12 | Index 7xl ✓ | py-12 ✓ |
| `/articles/[id]` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/articles/create` | 7xl | py-12 | Reading 3xl | py-16 |
| `/forum` (list) | 4xl | py-12 | Index 7xl | py-12 ✓ |
| `/forum/ask` | 2xl | py-12 | Reading 3xl | py-16 |
| `/forum/questions/[id]` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/calculators` (index) | 7xl | py-12 | Index 7xl ✓ | py-12 ✓ |
| `/calculators/cash-flow` | 4xl | py-12 | Reading 3xl | py-16 |
| `/calculators/goal-planner` | 4xl | py-12 | Reading 3xl | py-16 |
| `/calculators/insurance-needs` | 4xl | py-12 | Reading 3xl | py-16 |
| `/calculators/net-worth` | 4xl | py-12 | Reading 3xl | py-16 |
| `/calculators/priority-ranker` | 4xl | py-12 | Reading 3xl | py-16 |
| `/calculators/risk-profiler` | mixed 2xl/4xl | py-12 | Reading 3xl | py-16 |
| `/calculators/future-value` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/calculators/target-value` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/calculators/rate-finder` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/calculators/tenure-finder` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/profile` (router) | n/a | n/a | Routes to `/profile/{role}` — bucket determined by destination |
| `/profile/advisor` | 4xl | py-12 | Reading 3xl | py-16 |
| `/profile/investor` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/dashboard` | 7xl | py-12 | Detail 5xl | py-16 |
| `/dashboard/subscription` | 3xl | py-12 | Reading 3xl ✓ | py-16 |
| `/subscriptions` | 6xl | py-12 | Detail 5xl (rebuilt via `<PricingPlans>` — see §8) | py-16 |
| `/auth/signin` | md | py-12 | Form md ✓ | special (centered full-screen) |
| `/auth/role-selection` | 3xl | py-12 | Reading 3xl ✓ (form with options) | py-16 |

Pages with `✓` already match the standard on that dimension. Pages without need a single-class change.

**Pages that don't need any change:** `/advisors`, `/articles`, `/calculators` (index), `/forum/questions/[id]`, `/calculators/future-value`, `/calculators/target-value`, `/calculators/rate-finder`, `/calculators/tenure-finder`, `/profile/investor`, `/dashboard/subscription`, `/auth/signin`, `/auth/role-selection` (12 pages).

**Pages needing width-only change:** ~10. Touching one container line each.

**Pages needing structural change:** `/subscriptions` (§8 consolidation), `/` (no change — already the reference).

---

## 10. Rollout order

1. **Build `<PageShell>` and `<PageHeader>`.** One PR, no consumer migrations yet. Reference implementation in the home page.
2. **Migrate home page** to use the new shell components. Smallest possible diff, proves the shells work.
3. **Extract `<PricingPlans>` and rebuild `/subscriptions`.** Kills the worst drift case. (§8.)
4. **Migrate the 10 width-only pages** in surface-by-surface commits — fold into the in-flight color audit pass (one PR per page touches both color tokens AND width bucket; see [`feedback-small-commits-per-surface`](../../memory/feedback_small_commits_per_surface.md)).
5. **Migrate the remaining pages** that need both width and padding changes.
6. **Add lint guard.** ESLint rule to reject `bg-gray-`, `max-w-2xl|4xl|6xl`, `text-blue-`, `bg-blue-` on outermost containers — catches drift in PR review automatically. Optional but cheap.

Estimated scope: 1 PR for shells, 1 PR for pricing, 10–15 small PRs for page migrations (one per surface).

---

## 11. Lint guard (optional, recommended)

After the migration is complete, add an ESLint rule that fails CI if:

- `bg-gray-*` appears anywhere in `app/**`
- `bg-blue-*`, `bg-purple-*`, `bg-indigo-*` appear anywhere in `app/**` (off-brand colors)
- `max-w-2xl`, `max-w-4xl`, `max-w-6xl` appear on a className containing `mx-auto` at the top level of a page component (outermost container)
- Raw hex values appear in any `className` or inline `style` outside of `app/components/Logo.tsx` and `app/globals.css`

These rules are mechanical guardrails. They catch the kind of drift that compounds over six months and is expensive to retrofit (which is exactly how the codebase got into the state that prompted this file).

---

## 12. What this document does and does not cover

### Covered
- Outer container widths and how to pick them
- Section vertical padding and intra-section spacing
- Horizontal gutters
- Page background system
- Canonical page shell and the two helper components
- The pricing duplication and how to fix it
- Every existing customer-facing page mapped to a target

### Not covered (downstream)
- Component-level layouts (card internals, form field spacing, table layouts) — should follow the brand spacing tokens but are not standardised here yet.
- Dark mode — deferred per brand §5; the canonical shell + token-only colors make this a non-destructive retrofit when business signs off.
- Admin pages — they have their own constraints (dense tables, bulk actions) and are not customer-facing; revisit when admin gets brand polish.
- Email and PDF templates — outside the React app surface.

### Requires business decisions
- Whether `/subscriptions` and the home pricing section should show the same three tiers or eventually diverge (e.g. annual billing on `/subscriptions` only). If they diverge, the shared component grows props rather than splitting.
