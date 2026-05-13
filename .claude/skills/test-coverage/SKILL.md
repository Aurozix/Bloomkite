---
name: test-coverage
description: Run the test suite with coverage focused on changed files. Flag untested branches in new/modified code. Use before shipping or when adding a feature without obvious test scaffolding.
---

# Test coverage

The repo currently has ~218 jest tests (29 pre-existing failures as of 2026-05-13 — track them but don't conflate them with new failures). Coverage thresholds are configured in `jest.config.js`; the goal of this skill is to keep them honest as new code lands.

## Procedure

1. **Identify changed files.**
   ```
   git diff --name-only main...HEAD
   ```
   Filter to `lib/**`, `app/api/**`, `app/**` (TSX). Skip pure config and migrations.

2. **Baseline check — are current tests still green?**
   ```
   npm test -- --silent
   ```
   Compare failure count to known baseline (29 failed at branch creation). New failures introduced by your changes must be fixed before shipping. Pre-existing ones are out of scope unless your changes touch the same area.

3. **Coverage scoped to the changes.**
   ```
   npm run test:coverage -- --collectCoverageFrom="<changed-path>"
   ```
   Read the line / branch coverage for the changed files. Anything <80% line or <70% branch in NEW code is a flag.

4. **Identify untested branches.**
   For each uncovered branch in new code:
   - Is it a real path (e.g., an error case the API can return)? Add a test.
   - Is it defensive code that can't happen (e.g., a guard for an impossible null)? Per CLAUDE.md, delete the defensive code rather than add a test for unreachable code.

5. **For new API routes — minimum integration test bar:**
   - 401 for missing/invalid auth.
   - 400 for missing required fields.
   - 200 for happy path.
   - One business-rule edge case from the RAD.
   Look at `__tests__/integration/api/calculators/save.test.ts` for the pattern (mock @supabase/supabase-js with a `createClient` that honors the auth header).

6. **For new calculator logic in `lib/calculators/` — minimum unit test bar:**
   - Happy-path example from the RAD (use the exact numbers given).
   - At least one boundary case from the RAD's "Business Rules" list.
   - Decimal-precision verification (financial math must use Decimal.js, not floats — test it).
   Look at `__tests__/unit/lib/calculators/riskProfiler.test.ts` for the pattern.

7. **Report.** Files with coverage above bar / below bar. The specific untested branches you'd add tests for if you had another hour. Whether the new failures, if any, are yours or pre-existing.

## What this skill does NOT do

- Does not write the missing tests for you — you can ask Claude to do that as a separate step.
- Does not enforce coverage thresholds in CI — that's in `jest.config.js`.
