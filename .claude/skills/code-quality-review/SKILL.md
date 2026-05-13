---
name: code-quality-review
description: Review changed code for clarity, redundancy, and adherence to Bloomkite's style. Light-touch — flags issues that survived the other reviews. Use as a final pass before shipping.
---

# Code quality review

Goal: catch the small things that make a codebase rot — dead code, misleading names, narrative comments, half-finished abstractions. Not a style police; a sanity pass.

## What to look for

1. **Dead code introduced by the change.**
   - Unused imports, unused variables, unreachable branches.
   - `// TODO` and `// FIXME` left behind without a follow-up issue.
   - Don't remove pre-existing dead code unless asked.

2. **Misleading names.**
   - `data`, `result`, `info` as the only descriptor — fine for one-liners, suspect in a 30-line function.
   - Boolean fields that need a comment to know which direction is "true" (e.g., `disabled` vs `enabled`).
   - Functions whose name describes the call site, not the behavior (`handleSubmit` is fine; `handleArticleFormSubmit` adds nothing the file path doesn't already say).

3. **Narrative comments.**
   - Per CLAUDE.md: default to no comments. Comments explain WHY (non-obvious constraint, workaround for a specific bug). Comments that explain WHAT — delete them; the code already says it.
   - "Used by X" / "Added for Y flow" / "Handles case from issue #123" → delete. Belongs in PR description, not code.

4. **Error handling.**
   - Validate at system boundaries (user input, external APIs). Don't validate internal calls.
   - Catch-and-log-and-rethrow with no transformation = noise, delete.
   - `try { ... } catch { /* swallow */ }` is a smell — explain WHY or remove.

5. **Premature abstraction.**
   - One-shot operation extracted into a helper used once: inline it.
   - Generic interface with one implementation: collapse it.
   - Per CLAUDE.md: "three similar lines is better than a premature abstraction."

6. **Type signatures.**
   - `any` in new code: flag and ask why. Existing `any` survives.
   - Functions returning `Promise<any>`: missing type, fix it.
   - Optional fields used as required: should be required, not defensively-coalesced.

7. **Tailwind / JSX repetition.**
   - The same Tailwind class string repeated >3 times in a file → extract to a CSS class or a small component.
   - Inline `style={{ ... }}` patterns mixed with Tailwind: pick one. Bloomkite leans Tailwind; CSS custom properties for theme tokens are fine.

8. **Backwards-compat shims you didn't need to write.**
   - "Renamed but kept old name as alias": delete the alias.
   - "Removed feature flag but left the branch": delete the branch.

## Procedure

1. `git diff main...HEAD` (or relevant base) — read every chunk.
2. For each chunk, ask the 8 questions above. Most chunks pass; the ones that don't get a comment.
3. Report findings as a punch list: file:line + the one-line issue. Don't write a doctoral thesis — the developer should be able to fix each item in <60 seconds.
4. Mark severity: **fix-before-ship** (clear bug or maintainability landmine) vs **nit** (style preference, optional).
