# AI opportunities — calculators

**Date:** 2026-05-13
**Scope:** All 15 calculators under [app/calculators/](../../app/calculators/) + their libs at [lib/calculators/](../../lib/calculators/) + the save/share path at [app/api/calculators/save/route.ts](../../app/api/calculators/save/route.ts).
**References:** BRD §3.3 (financial planning flow), §5.3 (plan sharing), §8.3 (content rules), §8.5 (data & privacy), §12.1–12.2 (SEBI / financial-advice rules), §13.2; [brand.md](../branding/brand.md) §4 (voice — "Authoritative · Plain · Considered", explicit ban on "AI-powered"), §8 (NRI surface). [Calculators_Requirements.md](../requirements/Calculators_Requirements.md) for spec.
**Already registered in `ai_features`:** none at audit time (table was fresh — admin UI landed in commit `559428c`). After this audit: `calc-narration-goal-planner` registered as `is_enabled=false`.

---

## Candidates (ranked)

### 1. Calculator-result narration

**User problem.** Calculator outputs are dense — Goal Planner returns 6 fields (`futureCost`, `futureValue`, `finalCorpus`, `monthlyInv`, `annualInv`, `rateOfReturn`); EMI returns 7 plus a 240-row schedule; Rate Change Impact returns two parallel approaches. The investor often can't translate that into "what does this mean for me?" without an advisor in the loop. Touches all 15 calculator surfaces.

**Non-AI baseline today.** Per-calculator static template: *"To accumulate ₹X in Y years you need to save ₹Z per month."* Decent floor, but one template per calculator × 15 calculators × every input combination = static templates can't address what the user actually finds surprising.

**LLM advantage.** Given six structured inputs and six structured outputs, an LLM can produce three sentences in plain English that highlight *the surprising number* — "₹50L today will cost ₹81L in 2036 because inflation eats 5% a year. Your current ₹10L will grow to ₹22L over that span. The ₹60L gap is what your ₹29k/month investment fills." Templates can't pick the surprise. The LLM never computes — it narrates structured outputs we computed deterministically.

**Compliance surface.**
- SEBI / financial-advice rule: **No advice given.** The narrator describes the math; it does not recommend products, asset classes, or actions. Prompt locks down: "Explain what these numbers mean. Do not recommend any product, asset class, or course of action. Do not predict outcomes."
- PII: Reads investor-entered numbers (goal amount, current savings, income, expenses depending on calculator). Already on-page; no new data egress beyond the LLM call itself. Standard consent flow on the calculator surface.
- Hallucination tolerance: **Zero on figures, low on framing.** All numbers in the narration must come verbatim from the calculator output — we pass them in as quoted strings and prompt-instruct the LLM not to compute, derive, or round. Low tolerance on framing — periodic compliance review samples narrations for drift toward advice.

**Brand voice compatibility.**
- User-facing copy does NOT need to use "AI" — the surface just shows "Summary" above the narration paragraph. Identical visual treatment to the existing static summary.
- "Authoritative · Plain · Considered" fits. The narration is literal, not aspirational.

**Effort.** Prompt engineering. No RAG. No fine-tune. One prompt template per calculator family (goal, loan, balance-sheet, projection) — four templates cover all 15.

**First experiment.** Pick Goal Planner alone. Write one prompt; call from the existing calculate handler; render output in a new "Plain-English summary" card below the existing stat grid. Gate behind `isAIFeatureEnabled('calc-narration-goal-planner')`. Run 5 internal scenarios + 5 BRD example scenarios; review prompts against §12.2 advice-vs-education boundary; iterate. **Ship surface 1 of 15 only — generalize after.**

**Status check.** Registered as `calc-narration-goal-planner` (disabled) after this audit. No conflict with planned BRD features — BRD §3.3 says "System Calculates & Provides Output" but is silent on the narration layer.

---

### 2. Free-text goal → Goal Planner inputs

**User problem.** Investor knows their goal in their own words ("I want ₹2cr for my daughter's wedding in 18 years, currently have ₹15L saved") but doesn't know which of the 15 calculators to use, what fields map to what, or what reasonable defaults are. The current friction is invisible — it shows up as users not running calculators at all.

**Non-AI baseline today.** Calculator landing page at [app/calculators/page.tsx](../../app/calculators/page.tsx) — a 15-tile grid. No preset library. Adding presets ("Retirement", "Home", "Child education") is straightforward without an LLM and would catch ~80% of cases.

**LLM advantage.** The remaining 20% — multi-goal phrasings, embedded numbers ("save ₹X over Y years"), NRI-specific framings ("convert ₹X USD to INR goal"), goals that don't map to a preset. Structured extraction with a JSON schema → user lands on the right calculator with fields pre-filled and editable.

**Compliance surface.**
- SEBI: No advice. AI structures intent, doesn't recommend anything.
- PII: Reads the investor's free-text goal description, which may contain financial figures. Standard.
- Hallucination tolerance: **Medium.** The user reviews and edits before the calculator runs — every number ends up on screen for confirmation. Wrong extraction is annoying, not dangerous.

**Brand voice compatibility.**
- Surface needs zero "AI" copy. Field is labeled "Describe your goal" with a placeholder example.
- Fits Plain voice.

**Effort.** Prompt engineering + JSON schema. No RAG. Tiny.

**First experiment.** Add a single free-text box on `/calculators` landing page that routes to the matching calculator with prefilled inputs. Behind `isAIFeatureEnabled('calc-intent-router')`. Start with only Goal Planner and Loans cluster as routing targets — expand later.

**Status check.** Not registered. Not shipped. No conflict.

---

### 3. Plan-share narrative draft

**User problem.** When the investor shares a plan with an advisor (BRD §5.3), the advisor receives raw calculator output. Reading six fields cold has friction. A natural-language intro — "this investor is saving for a home in Mumbai in 10 years, has ₹10L baseline at 8%, can do ₹29k/mo, risk profile = moderate" — gives the advisor a 10-second orientation before they review the numbers. Saves advisor time, which is the scarce resource.

**Non-AI baseline today.** Plan-sharing isn't built yet (Gap §4 is 0% per Gap_Analysis.md). When it lands, a template summary auto-generated from the structured results will cover the basic case.

**LLM advantage.** Weaving multiple plans + the investor's risk profile + their NRI context (if applicable) into a coherent intro. Templates struggle when 3 calculators have been run and combined. The investor reviews and edits the draft before sending — they're the author of record.

**Compliance surface.**
- SEBI: Borderline-careful. The narrative summarizes the investor's own data and choices to a SEBI-registered advisor — that's the advisor consultation flow the platform is designed for. The LLM does NOT advise; the human investor authors a summary. Hard prompt-lock against "recommendations" framing.
- PII: **High.** Narrative aggregates the investor's full financial picture and ships it to an advisor. Already covered by BRD §8.5 plan-sharing consent, but the AI generation step adds a third-party (LLM provider) data hop that needs explicit consent + log-free / no-retain inference config.
- Hallucination tolerance: **Zero on figures, low on context.** Same prompt discipline as candidate #1 — numbers passed in verbatim, prompt forbids derivation.

**Brand voice compatibility.**
- Copy: "Draft summary for advisor" — no "AI". Fits.
- Authoritative voice fits the investor-to-advisor handoff register.

**Effort.** Prompt engineering. Blocked: needs plan-sharing schema (Gap §4) to exist first.

**First experiment.** Don't build until plan-sharing lands. When it does: one prompt, one optional "Generate draft" button on the share screen, user reviews/edits before send. Behind `isAIFeatureEnabled('plan-share-narrative-draft')`.

**Status check.** Not registered. Blocked on Gap §4 plan-sharing schema. Worth registering ahead of time as `is_enabled=false` so the slug exists when plan-sharing lands.

---

### 4. Cash-flow statement parser

**User problem.** Cash Flow Analyzer (calculator #2) asks the investor to type every income and expense item. A typical Indian household has 20–40 recurring items across salary, rent, EMIs, utilities, subscriptions, groceries, school fees, etc. Manual entry is the reason most users give up before saving the plan.

**Non-AI baseline today.** Manual entry only. A strict CSV upload format would help but is still tedious; bank statement formats vary across HDFC/ICICI/SBI/Axis and UPI exports.

**LLM advantage.** Parsing unstructured bank statement PDFs, UPI exports, or pasted SMS digests into categorized line items with `isRecurring` flags. Asymmetry over rules is high — formats vary by bank, by month, by UPI app. User reviews/edits the extracted table before save.

**Compliance surface.**
- SEBI: No advice (just structuring).
- PII: **Highest in this list.** Bank statements contain account numbers, full transaction history, merchant names, balances. Needs explicit consent flow, no-retain LLM config, and clear "we extract once and discard the source" guarantee. BRD §13.2 (sensitive data classification) and §8.5 (data minimisation) apply — this is the surface that needs the most compliance scrutiny.
- Hallucination tolerance: **Medium.** Mis-categorization is annoying not dangerous; user reviews. But missing a recurring EMI is a real defect — would skew the downstream EMI Capacity calculator.

**Brand voice compatibility.**
- Copy: "Upload statement to autofill" — no "AI" hook needed.
- Fits Plain voice.

**Effort.** Substantial. Needs OCR or trusted PDF text extraction (we have neither today). The LLM step is small; the document pipeline is the work.

**First experiment.** Defer. Surface lower-effort wins first (#1, #2) before committing to a document-ingestion path. If pursued: text-paste version first (UPI export, SMS digest paste) before PDF/OCR. Behind `isAIFeatureEnabled('cashflow-statement-parser')` with a `consent_required` flag.

**Status check.** Not registered. Not shipped. **Flag for compliance review** before any implementation work — the PII surface is materially heavier than the other candidates.

---

### 5. Risk-Profiler question contextualizer

**User problem.** Risk Profiler asks 10 questions (e.g. "How would you react to a 30% market drop in a single quarter?"). Many investors don't have a reference frame to answer truthfully — they don't know what a 30% drop *feels like* or *historically how often it happens*.

**Non-AI baseline today.** Static tooltip per question with one example. Decent. With effort, a designer can write strong static copy that covers 80% of cases.

**LLM advantage.** Tailored examples to the investor's profile context — age, time horizon, NRI vs domestic. Low asymmetry over good static copy. The win is mostly in covering the long tail of "what does this mean for my situation?"

**Compliance surface.**
- SEBI: **Highest risk** in this list of advice-drift. The LLM is one prompt-slip away from "for someone your age, you should pick option C". Hard prompt-lock and tight evaluation needed.
- PII: Reads investor profile fields (age, income, dependents). Standard.
- Hallucination tolerance: Low — answers feed the scoring algorithm.

**Brand voice compatibility.**
- "Need help answering?" → tooltip. No "AI" copy. Fits.

**Effort.** Prompt engineering. Small.

**First experiment.** Skip this until #1 and #2 land; the value is marginal vs. just writing better static tooltips. If pursued: behind `isAIFeatureEnabled('risk-profiler-question-help')` with aggressive prompt-lock-against-advice + sample audit.

**Status check.** Not registered. Marginal value; lower priority than #1 and #2.

---

## Top pick

**Calculator-result narration (#1).** Universal — touches all 15 calculators. Lowest compliance risk because the LLM never generates a number; it narrates outputs we already computed deterministically. Asymmetry is real (templates can't pick the surprising figure across 6+ input variables), and a working version can ship behind a flag against one calculator in a single afternoon's prompt iteration. Most concretely, it makes the calculator output *useful to non-experts* — which is the missing piece between "we have 15 calculators" and "investors actually finish and share plans".

Next step: register `calc-narration-goal-planner` in `/admin/ai-features` with `is_enabled=false`. Gate the experiment behind `isAIFeatureEnabled('calc-narration-goal-planner')`. Flip enabled only after compliance + brand review pass on the actual implementation, not the proposal.

## Rejected candidates (for visibility)

- **"AI predicts probability your goal will be met"** — hallucination on financial figures. Zero tolerance. Reject.
- **"AI suggests which asset allocation fits your risk profile"** — Risk Profiler already does this rule-based per BRD §6.3 fixed bands. Adding LLM here = advice surface, not asymmetry. Reject.
- **"AI chatbot for general calculator help"** — slop. Scoped help via narration (#1) covers the legitimate need; a general chatbot adds advice-drift risk for no asymmetry gain. Reject.
