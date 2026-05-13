---
name: ui-review
description: Review UI/frontend changes by exercising them in a browser. Use when frontend code under app/, components, pages, or CSS has changed. CLAUDE.md mandates this — type-check and unit tests do not catch UI regressions.
---

# UI review

Trigger: the current branch's diff touches `app/**/*.tsx`, `app/**/*.css`, `tailwind.config.ts`, or any component file. Run this BEFORE reporting a UI task complete.

## Procedure

1. **Identify what changed.** `git diff --stat main...HEAD` (or against the relevant base). List every page/component touched.

2. **Start the dev server in background.**
   ```
   npm run dev
   ```
   Wait for "ready" log. Default port is 3000.

3. **Exercise the golden path.** For each changed page/component:
   - Open the route in a browser.
   - Drive the primary user flow end-to-end. Form fields, buttons, navigation, save/submit, success state.
   - Confirm the new behavior actually works — don't assume code that compiles renders correctly.

4. **Edge cases.** For each changed component, try:
   - Empty inputs, max-length inputs, invalid inputs.
   - Loading state (slow network or by mocking).
   - Error state (force a 4xx/5xx from the API).
   - Unauthenticated viewer if the route is public; authenticated viewer with the wrong role.

5. **Regression scan.** Click through pages adjacent to the change — shared layout, common components, navigation links — to confirm nothing broke.

6. **Responsive.** Resize the viewport to ~375px (mobile) and ~768px (tablet). Bloomkite's RAD requires mobile-first; check that touch targets are reachable and text doesn't overflow.

7. **Report explicitly.** State which flows you tested in the browser and which you couldn't reach. If you couldn't actually drive the UI (no DISPLAY, no headless browser), say so — do NOT claim success based on type-check alone.

## What this skill does NOT do

- Does not lint code style — see [[code-quality-review]].
- Does not check business-logic correctness — see [[functional-review]].
- Does not run test suites — see [[test-coverage]].
