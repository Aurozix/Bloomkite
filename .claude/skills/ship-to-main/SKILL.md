---
name: ship-to-main
description: Promote dev to main. Runs the full verification suite against dev, merges dev → main, pushes main. Use only when an explicit set of changes on dev is ready for production. Higher bar than [[ship-to-dev]].
---

# Ship to main

`main` is production. Promotions from `dev` to `main` are not routine — they're release events. Always confirm with the user before the final push.

## Pre-flight

1. **Working tree clean.**
   ```
   git status
   ```
   If anything is uncommitted, stop and resolve it. Either commit it to dev (via [[ship-to-dev]]) or stash it.

2. **Sync both branches.**
   ```
   git fetch --all --prune
   git checkout dev && git pull --ff-only origin dev
   git checkout main && git pull --ff-only origin main
   ```
   If `main` has commits that aren't on `dev` (e.g., a hotfix), STOP. Rebase or merge those into dev first, re-verify, then come back.

3. **Verify on dev.**
   ```
   git checkout dev
   npm run type-check
   npm test -- --silent
   ```
   - Type-check: no NEW errors vs the recorded baseline (3 as of 2026-05-13).
   - Tests: no NEW failures vs the recorded baseline (29 as of 2026-05-13).
   - If either has regressed, ship-to-main is BLOCKED. Fix on dev, push via [[ship-to-dev]], come back.

4. **Summarize what's shipping.** List the commits on dev that aren't yet on main:
   ```
   git log --oneline main..dev
   ```
   Present this list to the user. Confirm they want to ship this exact set. If anything looks experimental or half-baked, surface it — better to delay than to ship a regression.

## Merge + push

1. **Switch to main.**
   ```
   git checkout main
   ```

2. **Merge dev with `--no-ff`** (preserves the "this was a release" boundary in history):
   ```
   git merge --no-ff dev -m "Release: <one-line summary of what's shipping>"
   ```
   Resolve conflicts if any. Re-verify type-check + tests after resolution.

3. **Tag the release** (optional but recommended for trace-back):
   ```
   git tag -a v<YYYY.MM.DD>-<short> -m "<release notes one-liner>"
   ```

4. **Final confirmation.** Show the user the resulting state:
   ```
   git log --oneline -5
   ```
   Ask: "Push main to origin?"

5. **Push** only after explicit user confirmation:
   ```
   git push origin main
   git push origin --tags    # if you tagged
   ```

## Never

- Never `git push --force` to main. Ever.
- Never rebase main. Merges only.
- Never push to main without first running tests on dev.
- Never skip the user-confirmation step before `git push origin main`. The user's "yes ship it" earlier in the conversation does not authorize a second push later — re-confirm.
- Never push hotfixes directly to main without also back-merging into dev (or you'll cause a divergence the next ship-to-main will trip on).

## After the push

- Watch the deployment pipeline (Vercel) for green.
- If it fails: do NOT revert main; investigate first. A reverted main is harder to recover from than a broken deploy.
