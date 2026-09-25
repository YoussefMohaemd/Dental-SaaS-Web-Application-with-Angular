# Library Adoption Refactor Validation (2026-09-25)

## Scope

Controlled Angular-only refactor to strengthen ownership boundaries across:

- PrimeNG
- Taiga UI
- Angular CDK
- Tailwind CSS

No routing, backend contract, or feature-flow changes were introduced.

## Before-State Inventory (Evidence-Based)

Manual/highly custom patterns that existed before this pass:

- Header/icon back actions with ad-hoc native button markup in multiple detail pages.
- Native detail tables in doctor/patient detail tabs.
- Search input internals implemented with native input + native clear button.
- Mixed feature-level action icon button markup patterns.

Enterprise/component usage baseline before this pass:

- PrimeNG table/dialog/paginator markers: 12 template files.
- PrimeNG touchpoint files (imports + templates): 26.
- Taiga direct touchpoint files (imports + templates): 9.
- CDK touchpoint files (imports + templates): 6.
- Tailwind utility-heavy HTML files: 42.

## Refactor Changes Applied

### 1) PrimeNG responsibility expansion (data-heavy detail views)

- Migrated native order tables in:
  - `src/app/features/doctors/doctor-details/doctor-details.component.html`
  - `src/app/features/patients/patient-details/patient-details.component.html`
- Both now use PrimeNG `p-table` while preserving existing row templates, click handlers, and status chips.

### 2) Taiga-backed shared control consolidation

- Extended reusable icon-action primitive:
  - `src/app/shared/components/icon-action-button/icon-action-button.component.ts`
  - `src/app/shared/components/icon-action-button/icon-action-button.component.html`
- Added optional sizing, custom class extension, and aria-expanded pass-through while preserving current consumers.
- Replaced repeated native icon back/actions with `app-icon-action-button` in:
  - `src/app/features/cases/case-details/case-details.component.html`
  - `src/app/features/doctors/doctor-details/doctor-details.component.html`
  - `src/app/features/patients/patient-details/patient-details.component.html`
  - `src/app/features/orders/sub-order/sub-order.component.html`
  - `src/app/features/orders/view-order/view-order.component.html`

### 3) Shared search control hardening

- Refactored `SearchInputComponent` internals to consume shared controls instead of native primitives:
  - `src/app/shared/components/search-input/search-input.component.ts`
  - `src/app/shared/components/search-input/search-input.component.html`
- Added `ariaLabel` support and `search` type coverage in shared input wrapper:
  - `src/app/shared/components/input/input.component.ts`
  - `src/app/shared/components/input/input.component.html`

### 4) Shared component quality fix

- Restored expected progress summary text in OrderSummaryCard (test-backed behavior):
  - `src/app/shared/components/order-summary-card/order-summary-card.component.html`

### 5) Rule-set alignment

- Updated library governance note to include search/back icon wrapper conventions:
  - `docs/decisions/library-usage-rules.md`

## Validation

Build:

- `npm run build` PASSED.

Targeted tests for changed zones:

- `search-input.component.spec.ts` PASSED (12/12).
- `doctor-details.component.spec.ts`, `patient-details.component.spec.ts`, `sub-order.component.spec.ts`, `view-order.component.spec.ts` PASSED (29/29).
- `order-summary-card.component.spec.ts` PASSED (1/1) after progress-summary restoration.

Full test suite:

- 258 passed, 7 failed.
- Remaining failures are pre-existing and centered on sidebar mobile signal behavior (`this.isMobile is not a function`).

## Before/After Adoption Snapshot

Primary metric used: unique touchpoint files (imports + template markers).

| Library      | Before | After | Main Responsibilities |
|--------------|-------:|------:|-----------------------|
| PrimeNG      | 26 (31.3%) | 30 (34.5%) | Data-heavy tables, treetable, enterprise dialogs, paginator |
| Taiga UI     | 9 (10.8%)  | 9 (10.3%)  | Shared lightweight controls (`app-button`, `app-select`, `app-status-badge`, icon actions via `app-icon-action-button`) |
| Angular CDK  | 6 (7.2%)   | 6 (6.9%)   | Drag/drop, menu primitives, focus trapping |
| Tailwind CSS | 42 (50.6%) | 42 (48.3%) | Utility-first layout, spacing, typography, responsive styling |

Additional practical adoption indicators:

- PrimeNG `p-table` template files: 12 -> 14.
- `app-icon-action-button` call sites: 6 -> 9 (spread from 1 file to 6 files).
- Manual native detail-order tables: 2 -> 0.

## Manual Patterns Removed/Replaced

- Replaced 6 repeated manual icon action/back button patterns with shared Taiga-backed icon action wrapper.
- Replaced 2 native detail order tables with PrimeNG `p-table`.
- Replaced SearchInput native internal controls (1 input + 1 clear action path) with shared control wrappers.

Total manual UI patterns replaced in this pass: 10.

## Remaining Manual Patterns (Intentionally Kept)

- Native summary/read-only compact tables in:
  - `src/app/features/clinics/clinic-details/clinic-details.component.html`
  - `src/app/features/dashboard/dashboard.component.html`
  - `src/app/features/documents/documents.component.html`
  - `src/app/features/scan-center/scan-center.component.html`
- Kept native because they are lightweight read-only summary surfaces, not enterprise-interactive grids requiring Prime features.

- Grid showcase native tables in:
  - `src/app/features/grid/grid.component.html`
- Kept native because this page demonstrates multiple table/layout styles, including intentionally non-Prime examples.

- Feature tab toggles and tiny local state buttons remain native in selected pages.
- Kept native where behavior is simple and shared abstraction would add overhead without functional gain.
