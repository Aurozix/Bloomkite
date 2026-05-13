---
name: ai-opportunities
description: Audit one product surface for genuine LLM-shaped opportunities that respect Bloomkite's brand voice (no "AI-powered" copy) and SEBI compliance (no financial advice from AI). Manual invocation, scoped per call. Produces a ranked shortlist of 2-5 candidates with a single recommendation, never a backlog dump. Pairs with /admin/ai-features for shipping behind a kill switch.
---

# AI opportunities

This skill is the disciplined version of "where should we add AI?" — the undisciplined version produces slop and brand-voice violations. The discipline is: only land opportunities that **respect the brand voice**, **respect SEBI compliance**, and **unlock product behavior that wasn't possible without an LLM**.

## Why this skill exists

The undisciplined sweep produces a backlog of chatbots glued onto things that don't need them. Three filters cut that down hard:

1. **Brand voice.** docs/branding/brand.md §4 explicitly bans "AI-powered", "revolutionary", "unlock your potential". Anything that needs that copy to sell it is a brand-voice violation. Reject.
2. **SEBI compliance.** docs/requirements/Business_Requirements.md §8.3 and §12 ban specific stock recs, guaranteed returns, and giving financial advice. Bloomkite does NOT give advice — it connects to advisors who do. Anything that would have AI give advice = reject.
3. **Asymmetry.** AI has to unlock product behavior that the rule-based baseline can't reach. "We could use AI for X" where X is already deterministic = reject; just write the deterministic code.

What survives those three filters is small, sharp, and ship-worthy. That's what this skill produces.

## Inputs to read before generating

- **BRD**: docs/requirements/Business_Requirements.md (positioning, audience model, business rules, compliance)
- **Calculator spec**: docs/requirements/Calculators_Requirements.md (calculator surfaces specifically)
- **Brand file**: docs/branding/brand.md (voice rules, NRI surface treatment, anti-hype rule)
- **Relevant code paths** for the requested surface (e.g., `app/calculators/` for calculator opportunities, `app/api/admin/` for admin-surface, `app/advisors/` for advisor surface)
- **Existing ai_features table** via `GET /api/admin/ai-features` — don't propose what's already registered

## Procedure

### 1. Scope the audit — DEMAND a surface

If the user invocation doesn't include a surface, ask. Acceptable scopes:

- `pricing` — subscription tier + paywall surface
- `calculators` — financial calculator outputs
- `advisor-credentialing` — credential upload + admin moderation
- `forum` — Q&A + article moderation
- `nri` — the NRI-investor surface (strategic wedge per brand §8)
- `onboarding` — investor / advisor signup flow
- `admin` — admin operations (user management, content moderation, etc.)
- Or a specific code path: `app/advisors/`, `app/calculators/risk-profiler/`, etc.

**Refuse to audit "everywhere" in one call.** Quality decays with scope. If the user wants to audit multiple surfaces, run the skill multiple times.

### 2. Read the matching docs + code

Always read:
- The BRD section that covers the surface
- The brand file's voice rules (§4) and NRI surface (§8) if relevant
- The actual code on that surface
- The existing `ai_features` table to skip duplicates

Skim only — surface understanding is enough. Don't try to redesign the surface.

### 3. Generate 2-5 candidates

For each candidate, fill in this exact structure:

```
### N. <Candidate name — verb-noun, no marketing flourish>

**User problem.** <One sentence. BRD-referenced where possible.>

**Non-AI baseline today.** <What we do or could do without an LLM. Be specific —
"rule-based scoring", "admin-manual review", "fixed-tier limits", etc.>

**LLM advantage.** <Why an LLM specifically. If the baseline could match it,
this isn't an AI opportunity — reject.>

**Compliance surface.**
- SEBI / financial-advice rule: <Does this give advice? Yes/no + reasoning.>
- PII: <Does this read investor financial data? If yes, what's the consent flow?>
- Hallucination tolerance: <Zero (financial figures, regulatory claims) / Low /
  Medium. If zero, the LLM can only narrate, never generate.>

**Brand voice compatibility.**
- Does the surface need to use "AI" in the user-facing copy to make sense?
  If yes — reject.
- Does the value proposition fit "Authoritative · Plain · Considered"?
  If no — reject.

**Effort.** prompt-engineering / retrieval (RAG) / fine-tune / training-data.

**First experiment.** <One concrete shippable thing. Not "build this whole
feature" — one prompt to write, one route to add, one A/B to run.>

**Status check.** <Already in ai_features table? Already shipped? Conflicting
with a planned feature in the BRD? Note it.>
```

### 4. Cap at 5; rank

If you've generated more than 5, cut to 5. The cap is not negotiable — it forces ranking, which forces opinion, which is the point of the skill.

Rank by `(asymmetry × user-problem-severity) / compliance-risk`. Don't show the math; show the ranking.

### 5. State the top pick with reasoning

End with a single recommendation:

> **Top pick: <name>**. <Two sentences. Why this one over the others. What changes about the product if it lands.>

Not "all of these are valuable!" — the user needs an opinion. If the surface is genuinely barren of AI opportunities, say so explicitly: "Surface audited; no candidates pass the three filters. The deterministic baseline is appropriate here."

### 6. Wire next step to the admin flag system

Every recommendation closes with the same paragraph, paraphrased:

> Next step: register `<slug>` in `/admin/ai-features` with `is_enabled=false`. Gate the experiment behind `isAIFeatureEnabled('<slug>')`. Flip enabled only after compliance + brand review pass on the actual implementation, not the proposal.

That puts a kill switch on every AI feature from day one.

## Hard guardrails — refuse these patterns

| Pattern | Why it's rejected |
|---|---|
| "AI gives the user a stock recommendation" | SEBI violation. Bloomkite does NOT give financial advice. |
| "AI predicts what return the user will get" | Hallucination on financial figures. Zero tolerance. |
| "AI replaces the advisor" | Whole platform thesis is verified humans. Brand identity violation. |
| "AI generates the calculator output" | Calculators are deterministic by design. Use AI to narrate the output, never to compute it. |
| "AI-powered" anywhere in the copy | Brand voice §4 explicitly bans this. |
| "Chatbot for general financial questions" | Slop. Reject unless there's a sharp scoped reason. |
| Touching investor financial data without consent | BRD §13.2 / §8.5. Surface this as a flag, not silent-pass. |

If a candidate hits any of these, omit it from the shortlist. Don't water it down to "borderline yes" — the skill's value is the rejection.

## Output template

```
# AI opportunities — <surface>

Scope: <what was audited>
References: <BRD §, brand file §, code paths>
Already registered in ai_features: <slugs found, or "none">

## Candidates (ranked)

### 1. <name>
[full structure as above]

### 2. <name>
[full structure as above]

...

## Top pick

**<name>**. <Reasoning in 2 sentences>

Next step: register `<slug>` in `/admin/ai-features` with is_enabled=false.
Gate the experiment behind isAIFeatureEnabled('<slug>'). Flip enabled only
after compliance + brand review pass on the actual implementation.

## Rejected candidates (for visibility)

If any were considered but cut by the guardrails, list one-liner why:
- <name>: SEBI rule (gives advice)
- <name>: hallucination risk (generates numbers)
- <name>: brand voice (needs "AI-powered" copy)
```

## What this skill does NOT do

- Does not write the implementation. The shortlist is a proposal; the user (and a future build session) does the work.
- Does not promise an ROI estimate. Bloomkite is pre-launch; revenue impact is theory. Stick to "what becomes possible" and "what the user problem is".
- Does not audit multiple surfaces in one call.
- Does not run on a schedule. Manual only. Trigger after milestones, not periodically.
- Does not invent BRD scope. If the requested surface isn't in the BRD or the brand file, say so — that's a finding, not a failure of the skill.

## Pairing

- Run **before** /architectural-review when prototyping an AI feature, so the proposal stays disciplined.
- Run **after** /cleanup if a refactor exposed a previously-hidden surface — fresh eyes on a freshly-trimmed area.
- Hand off the registered slug to a future build session; that session implements the experiment behind the flag.
