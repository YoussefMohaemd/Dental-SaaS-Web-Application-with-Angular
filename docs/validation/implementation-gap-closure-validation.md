# Implementation Gap-Closure Validation

Date: 2026-09-22 (checks re-executed and reconciled 2026-09-26)

## Baseline Evidence

- `evidence/baseline-invariants.json` records the browser/runtime, viewport samples, Orders bounds/computed styles, and seven Workflow Board drop-list measurements.
- `evidence/baseline-orders-desktop.png` and `evidence/baseline-orders-mobile.png` capture the protected Orders surface.
- `evidence/baseline-workflow-desktop.png` captures the protected Workflow Board surface.
- The initial repository working tree was clean.

## Completed Slices

- Invalid order and sub-order route ids no longer fall back to the first available record or the `so-2` detail. The existing page containers render deterministic in-page not-found text.
- Create Order now carries service details, clinical-form values, selected teeth, scan requirements, and file-reference slots through the in-memory parent and sub-order contracts.
- Order Files now rejects unsupported extensions, files over 100 MB, and case-insensitive duplicate names while retaining the existing valid upload path.
- Forms and files prototype/in-memory boundaries are documented in `docs/decisions/forms-files-policy.md`.
- Reusable business components now exist for the order summary card and workflow timeline, and the live order detail and workflow pages consume those shared components without changing the rendered layout.
- A reusable select control now exists for native-select reuse with the same geometry and styling conventions as the existing pages.

## Executed Checks

| Check | Result |
| --- | --- |
| `npm run build` before implementation | Passed |
| `npm run build` after invalid-route slice | Passed |
| `npm run build` after create-order contract slice | Passed |
| `npm run build` after Order Files validation | Passed |
| Focused Angular/Karma test command | Passed: 10/10 after restoring `karma.conf.js` and updating the routed fixture |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Passed: 232/232 |
| `npx tsc -p tsconfig.app.json --noEmit` | Passed |
| `npx tsc -p tsconfig.spec.json --noEmit` | Passed |
| `npm run build` after reusable-component extraction | Passed |
| `npm run lint` | Originally blocked: configured `@angular/build:tsc` builder unavailable in the installed CLI environment |
| `npm run lint` (replaced by `tsc --noEmit -p tsconfig.lint.json`) | Passed 2026-09-26 (`evidence/build/lint.log`) |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Passed: 336/336 (2026-09-26, `evidence/tests/test.log`) |
| `npm run build` | Passed 2026-09-26 (`evidence/build/build.log`) |
| `npm run build-storybook` | Passed 2026-09-26 (`evidence/storybook/build-storybook.log`) |
| axe-core scan (wcag2a/aa + best-practice, 24 route-states) | Passed: 0 violations (`evidence/accessibility/axe-summary.md`) |

Known non-blocking build output consists of existing Sass deprecation notices and stylesheet budget warnings. The original lint builder gap was closed by the `tsconfig.lint.json` fallback script, which is now the configured `npm run lint`.

## UI Preservation Record

No stylesheet, token, renderer-library, or protected layout values were intentionally redesigned. Valid route/data paths retain the existing templates and controls. The reusable order summary and workflow timeline components were extracted from existing markup and then wired back into the live pages using the same visual structure. The only new rendered branches are missing-entity and rejected-upload states, both behavior-driven states required by the plan. The baseline screenshots and measurements remain the comparison reference for subsequent slices.

## Remaining Work

Status reconciled 2026-09-26:

- Keep the restored `karma.conf.js` test-runner configuration and run it in CI/local environments. — ongoing (336/336 passing locally).
- Focused tests for invalid ids, creation metadata, Order Files validation, and the new reusable components — completed (336 tests, incl. specs for shared composites, sortable-header a11y, and sort-a11y utilities).
- Complete shared table-state/icon extraction only where DOM/computed-style parity is demonstrated. — optional; unchanged.
- Capture accessibility scans and responsive artifacts — completed (`evidence/accessibility/`, `evidence/responsive/`, `evidence/states/`).
- Controlled AI comparison pack — prepared (`docs/ai-comparison-protocol.md` + empty slots); **AWAITING HUMAN EXECUTION**.
- Final re-audit and documentation reconciliation — tracked by the compliance plan (Phase 6/7).
