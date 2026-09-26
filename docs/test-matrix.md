# Test Matrix (IMP-FE-003)

Date: 2026-09-26

This matrix maps requirement-style test categories to concrete repository tests.

Current automated baseline: **363 passing unit tests** (`npm test -- --watch=false --browsers=ChromeHeadless`).

## Category coverage

| Category | Shared basics | Toolbars / composites | Orders page | Auth/security | Services |
| --- | --- | --- | --- | --- | --- |
| Normal | `input.component.spec.ts::should bind value to input` | `search-filter-toolbar.component.spec.ts::should wire search, filter and action through a host page` | `orders.component.spec.ts::should show the normal table when orders are loaded` | `auth.guard.spec.ts::allows navigation when an auth marker exists in localStorage` | `order-data.service.spec.ts::should preserve the create-order payload boundary` |
| Empty | `select.component.spec.ts::renders the placeholder and options` | `table-feedback.component.spec.ts::should default to empty mode` | `orders.component.spec.ts::should show the empty state when no orders are available` | - | `order-data.service.spec.ts::should set error state and stop loading when the data request fails` |
| Invalid | `input.component.spec.ts::should set aria-invalid when an error is present` | `search-filter-toolbar.component.spec.ts::should forward the configured search aria-label to the search input` | `orders.component.spec.ts::should compare strings with localeCompare fallback` | — | `order-data.service.spec.ts::should set error state and stop loading when the data request fails` |
| Boundary | `select.component.spec.ts::applies ControlValueAccessor disabled state from forms` | `workflow-timeline.component.spec.ts::marks only the active stage with aria-current step` | `orders.component.spec.ts::should clamp pagination within valid bounds` | — | `order-data.service.spec.ts::create-order payload boundary` |
| Permission / security | - | - | - | `auth.guard.spec.ts::redirects to /login when auth marker is missing`; `auth.interceptor.spec.ts::attaches an Authorization header when a token exists` | `auth.interceptor.spec.ts::forwards the original request when no token exists` |
| Dependency-failure | — | `table-feedback.component.spec.ts::should accept error mode for failed table states` | `orders.component.spec.ts::should show the error state when the service reports an error` | — | `order-data.service.spec.ts::should set error state and stop loading when the data request fails` |
| Retry | — | — | `orders.component.spec.ts::should reload orders on retry` | — | `order-data.service.spec.ts::should recover from error after reload` |
| Recovery | `status-badge.component.spec.ts::should expose status semantics for assistive technologies` | `workflow-timeline.component.spec.ts::renders an empty-state summary when no stages are provided` | `orders.component.spec.ts::should show the normal table when orders are loaded` | `auth.guard.spec.ts::allows navigation when an auth marker exists in localStorage` | `order-data.service.spec.ts::should recover from error after reload` |

Legend: `- = GAP (no coverage)`.

## Runner ownership

- `npm test` runs the authoritative Karma/Jasmine suite that backs the 357+ baseline numbers and all `evidence/tests` gate totals.
- Vitest is installed for Storybook tooling (`@storybook/addon-vitest`) and has no standalone repository test script.
- Coverage packages exist for multiple ecosystems, but repository evidence counts are produced by `karma-coverage`.

## Current gaps

- No e2e-level permission flow (unit coverage only).
- No strict coverage threshold gate (baseline-only measurement).
