# Re-Audit Checklist

Date: 2026-09-22 (reconciled 2026-09-26)
Scope: UI-preserving architecture gap closure + compliance evidence closure

## Confirmed
- Rendered geometry, spacing, colors, typography, breakpoints, and interaction states were not intentionally redesigned in this slice.
- Shared non-visual helpers now cover table filtering/sorting/pagination, workflow status lookup, search normalization, and accessible sort headers (`sort-a11y.ts`).
- Route safety coverage now includes invalid order ids for workflow and files pages.
- Create Order contract coverage now asserts nested service details, clinical form values, selected teeth, and file-reference boundaries.
- Forms attachment dropzone keyboard activation is explicit and tested.
- Documentation now reflects the helper-extraction policy and the current validation snapshot.
- Evidence pack is complete for build, tests, Storybook, order states, responsive viewports, and accessibility.

## Validation state
- Unit tests: 336 passed, 0 failed (`evidence/tests/test.log`)
- Build: passed (`evidence/build/build.log`)
- Lint: passed via `npm run lint` (`tsc --noEmit -p tsconfig.lint.json`, `evidence/build/lint.log`); the earlier unavailable-builder fallback is resolved
- Storybook build: passed (`evidence/storybook/build-storybook.log`)
- Accessibility: axe-core 0 violations across 24 route-states, keyboard walkthrough recorded (`evidence/accessibility/`)
- Responsive: 0 horizontal overflow in 15 page × viewport combinations (`evidence/responsive/overflow-results.json`)

## Open items carried forward
- Controlled AI comparison run: **AWAITING HUMAN EXECUTION** (`docs/ai-comparison-protocol.md`, empty slots in `evidence/ai-comparison/`).
- Human-validated a11y items (screen reader announcement, focus rings eyes-on, dark theme, zoom/reflow) are marked REQUIRES HUMAN VALIDATION in `evidence/accessibility/keyboard-walkthrough-checklist.md`.
- Theme parity screenshots/computed-style snapshots remain to be refreshed if the protected surfaces change again.
- Optional reusable-control extraction remains conditional on DOM/computed-style parity proof.
