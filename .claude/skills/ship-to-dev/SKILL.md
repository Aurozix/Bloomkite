---
name: ship-to-dev
description: Ship the current branch's work to origin/dev. Runs type-check + tests, commits cleanly, pushes to dev. Use when a feature/fix is ready to merge into the integration branch.
---

# Ship to dev

`dev` is the integration branch. `main` is production. Everything lands in `dev` first.

## Pre-flight (do not skip)

1. **Where am I?**
   ```
   git status
   git branch --show-current
   ```
   - If on `main` or `dev` directly: abort. Feature work should be on a feature branch (or `dev` for trivial work that you've explicitly OK'd to land directly). If user explicitly said to commit directly on `dev`, proceed.
   - If there are uncommitted changes: review them with `git diff`. Stage the right files (per file, not `-A`).

2. **Type check.**
   ```
   npm run type-check
   ```
   Baseline: 3 pre-existing errors as of branch creation. If your changes introduce new errors, fix them. Pre-existing errors do not block.

3. **Tests.**
   ```
   npm test -- --silent
   ```
   Baseline: 29 pre-existing failures as of branch creation. Any new failure your changes introduced — fix.

4. **Optional reviews** (if not already done):
   - [[code-quality-review]] — final read of the diff.
   - [[architectural-review]] — consistency check.
   - [[ui-review]] — if frontend changed.
   - [[functional-review]] — if business logic changed.
   - [[test-coverage]] — if you added meaningful new logic.

## Commit + push

1. **Stage explicitly** — never `git add -A`. List the files you want.
2. **Compose the message.** Use the recent commit-log style: title under 70 chars, optional body explaining the why (not the what). Include the trailer:
   ```
   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```
3. **Commit.** Use HEREDOC for multi-line messages — see CLAUDE.md global guidance for the exact pattern.
4. **Push to dev.**
   ```
   git push origin <current-branch>:dev
   ```
   If you're already on `dev`:
   ```
   git push origin dev
   ```
   If branch is divergent (remote has commits you don't): STOP. Fetch, rebase, re-verify type-check and tests, then push.

5. **Confirm.**
   ```
   git log --oneline origin/dev -3
   ```
   Report the new HEAD on dev.

## Never

- Never `--force` or `--force-with-lease` to dev without explicit user OK.
- Never skip hooks (`--no-verify`) unless the user said so.
- Never amend a commit that's already been pushed.
- Never push to dev if type-check has NEW errors or NEW test failures.
