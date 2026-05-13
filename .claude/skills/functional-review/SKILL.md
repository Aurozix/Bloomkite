---
name: functional-review
description: Verify the changed code actually implements the requirement it was supposed to. Cross-check against docs/Bloomkite_Master_RAD.md (formulas, business rules, sprint scope). Use when business logic, calculator math, advisor workflow, moderation, or subscription rules change.
---

# Functional review

The compiler and unit tests prove code does what its code says. This skill proves the code does what the **product** says.

## Procedure

1. **Locate the source-of-truth requirement.** For Bloomkite, that's [docs/Bloomkite_Master_RAD.md](../../../docs/Bloomkite_Master_RAD.md). Find the section that governs the changed area:
   - Calculator math → §2.3 (formulas, scoring tables, examples).
   - Advisor workflow → §2.2 Process 1, §2.4 (credentialing rules).
   - Content moderation → §2.2 Process 3.
   - Subscription/payments → §2.2 Process 4 + §2.5 (tiers).
   - Data privacy → §2.4.

2. **Quote the rule the change implements.** State it back in one sentence. If you can't find the rule, that's a red flag — the change might be unspecified scope.

3. **Walk a worked example from the RAD through the code.** Pick an example given in the spec (e.g., the Insurance Needs ₹10L → ₹1.5Cr example, or the Risk Profiler "investor scores 28 → Conservative" example). Trace it through the new code and confirm the output matches.

4. **Check the business rules listed in the spec.** Each calculator/feature in the RAD has explicit rules ("urgency level 4 signals goal should be deleted", "no specific stock recommendations", "credentials expire annually"). For every rule that touches the changed code, confirm it's enforced. If a rule isn't enforceable in code (e.g., compliance disclaimers), at least confirm we're not silently bypassing it.

5. **Run integration tests for the changed area.**
   ```
   npx jest __tests__/integration/api/<area>
   ```
   If a test was changed alongside the code, run it. If no test exists for the rule you just verified by hand, flag that — see [[test-coverage]].

6. **Manual smoke if applicable.** For UI-driven business rules, drive the path once in the browser with realistic inputs. Wire to [[ui-review]] when appropriate.

7. **Report.** Which RAD section(s) you cross-checked, which worked examples you ran, which rules are enforced vs unenforced. If the implementation diverges from the spec, surface the divergence — don't silently "fix" the spec.

## Note on RAD inconsistencies

The RAD has known internal contradictions (e.g., Risk Profiler scoring direction). When you spot one, flag it explicitly with both interpretations — don't pick one silently. The current Risk Profiler implementation inverts the questionnaire scores to reconcile; future calculators may need similar reconciliation.
