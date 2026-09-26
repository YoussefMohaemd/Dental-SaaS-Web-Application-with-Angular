# Demo Script (10–15 minutes)

Date: 2026-09-26

## 0) Setup (before recording/live demo)

1. Run `npm install` (if needed).
2. Run `npm start`.
3. Ensure test baseline is green with `npm test -- --watch=false --browsers=ChromeHeadless`.

## 1) Login and shell entry (1 min)

1. Open `/login`.
2. Authenticate with demo credentials.
3. Show main shell, sidebar navigation, and theme consistency.

## 2) Orders POC walkthrough (4–5 min)

Route: `/orders`

1. Show page header rendered by shared toolbar component.
2. Use search/filter controls and explain reusable toolbar behavior.
3. Use **Preview data states (POC control)**:
   - `normal`
   - `loading`
   - `empty`
   - `error`
4. In `error`, click **Try Again** to show retry behavior.
5. Highlight status badges and sortable headers.

## 3) Storybook shared components (3–4 min)

Route: Storybook UI (`npm run storybook`)

Show:

- Basic: `AppButton`, `AppTextField`, `AppSelect`, `StatusBadge`
- Composite: `SearchFilterToolbar`, `DataTableToolbar`
- Business: `OrderSummaryCard`, `WorkflowTimeline`

Call out accessibility improvements (aria labels, status semantics, aria-current on timeline).

## 4) Tokens and theming (1–2 min)

1. Open token/theme files and show disabled-state tokens.
2. Demonstrate visible keyboard focus behavior (`:focus-visible` outline).
3. Mention namespace split (`--color-*` vs unprefixed `--*`) and why it is intentionally preserved in this POC.

## 5) Evidence and docs tour (2–3 min)

Show:

- `docs/weighted-comparison-matrix.md`
- `docs/licensing-review.md`
- `docs/test-matrix.md`
- `docs/final-recommendation.md`
- `evidence/` folders (tests/storybook/accessibility/responsive)

## 6) Close with recommendation and open items (1 min)

1. Final recommendation: continue approved Angular stack for this POC.
2. Open items:
   - controlled AI comparison runs
   - mentor sign-offs for recorded deviations
   - live presentation checkpoint.
