---
name: cleanup
description: Sweep the codebase for loose ends after a refactor or library migration — dead files, orphaned imports, stale TODOs, legacy aliases marked for removal, leftover usages of a replaced pattern. Report-first; deletes are applied in user-approved batches with verification between each. Use after a structural change settles, before the cruft becomes invisible.
---

# Cleanup

This skill is the dedicated tool for **deleting things that no longer earn their place**. Use it after a refactor or migration has landed and worked end-to-end, but left a trail.

## Why this skill exists

The other review skills look at code that's changing:

- [[code-quality-review]] reads the current diff for issues in the new code.
- [[simplify]] improves the implementation of existing code.
- [[architectural-review]] checks consistency with project patterns.

None of them look at code that *should not be there at all*. Cleanup does.

Concrete examples of what cleanup targets:

- A pattern was migrated wholesale (Supabase Auth → Auth.js, Heroicons → Phosphor, old color tokens → brand tokens) but a handful of files still use the old pattern.
- A backwards-compat shim was deliberately added with a "delete this once migrated" comment. The migration finished. The shim is still there.
- An API route was renamed. The old route still exists.
- A test helper was rewritten. The old version is still imported by two files.
- A doc, README, or migration plan references a function that no longer exists.
- A dependency was swapped out. The old package is still in `package.json`.
- A directory holds one file. That file moved months ago. The directory is empty.

These are not bugs. The code works. But each one is a small mental tax on every future read.

## Procedure

### 1. Scope the cleanup

Ask the user **what they're cleaning up after**. Examples:

> "I migrated auth from Supabase to Auth.js. What's left over?"
> "We adopted the brand tokens last week. Find old `var(--primary-*)` / `bg-blue-*` references."
> "Sprint 4 just shipped. General cleanup pass on anything touched."

The scope **narrows the audit**. Do not freelance dead-code removal that has nothing to do with the user's stated focus — that's a separate request. Per CLAUDE.md: don't remove pre-existing dead code unless asked. This skill is the *asked* path, but the ask is bounded.

If the user can't articulate the scope, suggest one based on the last 3-5 commits (`git log --oneline -10`). They'll either confirm or correct.

### 2. Audit

Run a systematic sweep across these categories. Use Grep liberally — fast, focused, cheap. Skip categories that obviously don't apply to the user's focus.

| Category | How to find |
|---|---|
| Leftover usages of the replaced pattern | Grep for the old API/function/import path. Example: `supabase.auth.getUser`, `from-blue-`, `Bloomkite.png`, `--primary-`, the old library's package name. |
| Files that should have been deleted | Files only referenced by other deleted files. Glob the relevant area and check imports. |
| Unused exports | For each export in the changed area, grep for imports. Zero hits = orphan. |
| Unused imports | `tsc --noUnusedLocals --noUnusedParameters` (don't enable globally; spot-check). |
| Backwards-compat shims | Grep for `legacy`, `compat`, `deprecated`, `TODO: remove`, `// remove once`, `// old API`, plus any literal "alias" comments left during the original change. |
| Stale TODO / FIXME | Grep for `TODO`/`FIXME`/`XXX`/`HACK`. Cross-reference against the cleanup focus and the commits since the TODO was added. |
| Empty / near-empty directories | `find` for directories with ≤1 file; check whether the parent still has any reason to exist. |
| Tests for removed code | Grep test file imports against the production tree. Test importing a non-existent module = dead test. |
| Documentation rot | Grep `docs/`, `README.md`, `CLAUDE.md`, and any in-repo markdown for symbols that no longer exist. |
| Unused dependencies | For each entry in `package.json`'s `dependencies` and `devDependencies`, grep the source. Zero hits in `app/`, `lib/`, `scripts/`, `__tests__/`, `*.config.*` = candidate. |
| Half-completed migrations | Files that mix the old and new pattern (a sign the refactor stopped mid-file). |
| Generated artifacts checked in by accident | `.tsbuildinfo`, `_tmp_*`, `*.log`, dist folders that should be gitignored. |

For each finding, capture: file path, line number(s) where relevant, why it's a candidate, and severity (`safe-to-delete` vs `needs-review`).

### 3. Report

Present the punch list **grouped by category** in the chat. Inline each item as:

```
[SAFE]   path/to/file.ts:42  reason in one line
[REVIEW] another/file.tsx    reason in one line
```

`SAFE` = no internal references, not a public API, deleting it changes nothing observable. Apply without per-item confirmation if the user says "go".
`REVIEW` = the user needs to decide. The skill explains why it's ambiguous.

Group the list so the user can pick whole categories (e.g., "Delete all SAFE items in 'leftover usages' and 'unused imports', skip everything else").

**Do not delete anything yet.** Wait for direction.

### 4. Apply in batches

Once the user picks what to delete, work through categories one at a time. After each category:

1. Apply the deletions for that category.
2. Run `npm run type-check` and `npx jest --silent`.
3. If either regresses, the category had a false positive. Revert the offending file and surface the surprise — that's a finding, not a failure.
4. Commit just that category, with a precise message naming what category was cleaned up and what reference (the original commit, the migration name, the brand-token cutover, etc.) it was paired with.
5. Move to the next category.

This means one cleanup pass becomes several small commits, each independently reviewable. That's the point. If something breaks in production a week later, a per-category commit makes the revert trivial.

### 5. Update the scope tracking

If the cleanup focus had a tracking artifact — a TODO in a doc, a follow-up list in a commit message, an issue — close it out. Otherwise the next cleanup pass will rediscover the same items and ask whether they're done.

## What this skill does NOT do

- Does not look for bugs. (That's testing.)
- Does not propose new abstractions. (Per CLAUDE.md: three similar lines beats premature abstraction. Cleanup *removes* abstractions whose justification is gone, not adds them.)
- Does not reformat code or change style. (Linting is for that.)
- Does not delete pre-existing dead code unrelated to the cleanup focus, even when stumbled across. Surface it as a finding for a future scoped pass.

## Edge cases

- **The user wants to delete something the skill thinks is in use.** Trust the user but show the reference. Often the apparent reference is itself dead and will be removed in the same pass.
- **A category turns up zero findings.** Say so explicitly. "Audited 47 imports under `app/api/`, all referenced." A clean category is a reportable outcome, not a silent skip.
- **The cleanup focus is vague ("just clean up").** Push back. Get a specific recent change to anchor against, or pick the most recent commit and propose that as the focus.
- **Deleting a file breaks a test.** That's the test telling you the code WAS in use. Surface it; don't suppress the test to make the delete go through.
- **Backwards-compat shim is still load-bearing.** Find the remaining consumers. If finite, migrate them in this pass; if not, the shim isn't actually a cleanup candidate yet.

## Pairing

- Run [[code-quality-review]] *before* cleanup if you suspect the area has quality issues that masquerade as deletable code.
- Run [[architectural-review]] *after* cleanup if the deletions touched route patterns, auth flows, or other architectural surfaces.
- Hand off the result to [[ship-to-dev]] when the per-category commits are ready to land.
