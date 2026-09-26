# React → Angular Parity Report

Date: 2026-09-21
Source of truth: `Dental SaaS Web Application with React` (untouched — reference only)
Target: `Dental SaaS Web Application with Angular` (Angular 21, zoneless)

## Audit method

Compared React `App.tsx`, `NavContext`, `AppLayout`, `mockData`, `index.css`
against Angular routes, layout, services, models, feature pages, shared
components, and styles — file by file for Orders / View Order / Sub-order /
Order Files / theme / buttons. A page existing was never accepted as proof of
completeness; JSX structure, handlers, states, and styles were each verified.

Notable finding: React itself is broken as a build — `App.tsx` imports
`FormsPage` and `SubOrderPage`, which do not exist in `src/pages`. The Angular
app already routes both (`/forms`, `/orders/:orderId/sub-orders/:subOrderId`),
so Angular is ahead there; the sub-order detail was rebuilt from the View
Order contract (`subOrderId`, forms/scans counts, teeth, notes) instead.

## What was missing / broken → what was fixed

### Buttons (shared `app-button`)
- Missing `rounded-lg` radius, wrong size scale (`md` was `px-4 py-2 text-sm`;
  React primary is `px-3.5 py-2 text-xs`), weak active/disabled states, no
  `aria-busy`/`aria-disabled`, deprecated `*ngIf`, focus ring offset pointed at
  the wrong surface, no full-width support for `class="w-full"` usages.
- Fixed: React-parity variant/size maps, `rounded-lg`, `focus-visible` ring,
  `disabled:opacity-50` + `pointer-events-none`, loading forces disabled,
  `@if/@else` link-vs-button rendering, `:host(.w-full)` stretch, SVG sizing.

### Sorting (Orders + `OrderDataService.applyFilters`)
- Broken: every column sorted with `String(...).localeCompare`, so amounts
  sorted lexicographically (`100 < 20`) and dates sorted as plain strings.
- Fixed: shared type-aware comparator — numbers numerically, ISO dates
  chronologically, strings via `localeCompare` (`compareOrderValues` in
  `orders.component.ts`, `compareValues` in `order-data.service.ts`).
- Added `aria-sort` on sortable `<th>`, per-column `aria-label` describing the
  sort state, sticky table header + sticky right Actions column + zebra
  striping in SCSS (React table parity).

### Pagination (Orders)
- Broken: page list was always `1..7`, so the current page disappeared on
  large data sets; `goToPage` did not clamp.
- Fixed: sliding 7-page window centered on the current page with leading /
  trailing ellipsis, clamped navigation, `aria-current="page"`, `role="status"`
  on the range label.

### Order Files
- Broken: `fileIcon()` returned mojibake (`dY-…`) from an encoding error.
- Fixed: proper type icons (image / PDF / 3D scan / DICOM / generic) plus
  `fileIconLabel()` for assistive text. Dropzone, progress, preview dialog,
  retry, delete, and failed-section behavior verified against React
  `OrderFilesPage` (whose `failed` state is likewise dead code — kept for
  completeness).

### Sub-order (full rebuild — was a summary placeholder)
New in `sub-order.component.*`, backed by new `SubOrderDataService`
(RxJS `HttpClient + delay + catchError` → Signals, `/data/sub-orders.json`
with local fallback, icon mapping):
- Details, status pill, readiness bar, teeth/priority/due/notes.
- 6-step workflow timeline (completed / current / pending, assignees, required
  actions).
- Clinical Forms as Angular Reactive Forms with TS-side validation (required
  notes ≥ 10 chars, occlusal/margin/material/shade required except material on
  Treatment Plan, instructions ≤ 500), inline errors, `aria-invalid`, saving /
  success / error states.
- Scans & Files: drag-and-drop + browse upload, type/size/count validation
  (STL/PLY/OBJ/JPG/PNG/PDF/DCM, 50 MB, max 10), progress rows, preview
  (PrimeNG dialog), remove with confirmation dialog, retry + failed section,
  empty state.
- Workflow actions (Approve / Request Changes / Mark Complete) with PrimeNG
  confirmation dialog, loading, and success banner; error view state with retry.
- Responsive (`sm:` grids, dialog full-width on mobile), CDK `DragDropModule`
  imported for interaction primitives, visuals in Tailwind + SCSS.

### View Order (hardened, was static + snapshot-based)
- Route params now reactive via `toSignal(route.paramMap)` instead of
  `snapshot` (survives in-place navigation).
- Header More-menu is now a working dropdown (Workflow / Files / Add Note /
  Export JSON / Delete with confirmation); Export downloads the order as JSON;
  Delete removes via `OrderDataService` and returns to the list.
- Add Note is now a real PrimeNG dialog with saving/success states; notes
  render in the new Order Summary panel (restoration, arch, shade, units,
  amount, bill-to, scan center).
- Not-found empty state; action confirmation banner.

### Priority badge
- Broken: `colorClass` was `'text-' + priority.toLowerCase() + '-500'`
  (`text-normal-500` — invalid, diverged from React).
- Fixed to the React map: Low slate / Normal blue / High amber / Urgent red.

### Test suite (was red before this work)
- Production build passed, but `ng test` could not compile (3 specs imported
  `../../../core/...` instead of `../../core/...` / `@core/...`) and 42 tests
  failed (required signal inputs created without inputs, `{ asReadonly: … }`
  objects mocked in place of signals, stale selectors, `fakeAsync` in a
  zoneless app, placeholder attribute-vs-property mismatch).
- Fixed all spec mocks to signal-based stubs, set required inputs before first
  change detection, corrected stale expectations, replaced `fakeAsync` with
  real timers, added `stat-card` hook class on login stats.
- Result: `ng test` → **173/173 SUCCESS**; `npm run build` → clean
  (only pre-existing Dart Sass `map-get` deprecation warnings in
  `styles/theme.scss`).

## Library usage (verified, responsibilities kept)

| Layer | Usage |
|---|---|
| PrimeNG 21 (Aura, `darkModeSelector: '[data-theme="dark"]'`) | Data tables (`p-table` orders), dialogs (file preview, confirm remove, sub-order actions, order notes, delete) |
| Taiga UI 4 | Root provider (`TuiRoot`, language); basic-control behavior contract kept — visual parity enforced in `app-button` SCSS + Tailwind so React design wins over library defaults |
| Angular CDK 21 | `DragDropModule` on sub-order; drag/drop board on workflow-board; focus/keyboard handling on dropzones and dialogs |
| Tailwind 4 | Layout, flex/grid, spacing, responsive composition in all touched templates |
| SCSS | Component states (dropzone drag-over, invalid fields, table stickiness/zebra, button spinner, dialog mobile widths), dark-mode guards |
| Signals | UI state everywhere touched (filters, pagination, dialogs, uploads, notes, theme) |
| RxJS | `HttpClient` data flows (`OrderDataService`, new `SubOrderDataService`), router events in `NavigationService` |
| Static data | `public/data/*.json` (orders, sub-orders, patients, doctors, clinics, …); no large hard-coded data sets in components |

Exception documented: file dropzones use native HTML5 drag-and-drop events
instead of CDK `cdkDropList` — no list reordering is involved, so the lighter
primitive is the correct tool; CDK remains the behavior layer for overlays,
focus, keyboard, and board drag/drop.

## Theming (verified, no changes needed)
- Tokens match React `index.css` exactly (`#F1F5F9/#0F172A` light,
  `#0F172A/#1E293B/#020617` dark, primary `#2563EB`/`#3B82F6`).
- `ThemeService` (signals + `localStorage` + `prefers-color-scheme` + document
  `data-theme` effect) is initialized in `AppComponent`; header toggle wires to
  `toggle()`; PrimeNG Aura follows `[data-theme="dark"]`. Verified across
  touched pages; header spec now covers the toggle.

## Tests added / updated
- `button`: parity (radius/weight), `disabled:opacity-50`, `aria-busy`, link
  variant, focus ring, router provider.
- `orders`: numeric/date/string comparator, `aria-sort`, windowed pagination,
  clamping.
- `sub-order` (new coverage): form valid/invalid + submit error, file accept /
  reject, upload start, remove confirm, action dialog, preview dialog.
- `view-order`: more-menu, note dialog open/close, empty-note guard, delete
  confirm.
- Repaired pre-existing specs: badges, avatar, arch, select, header, sidebar,
  dashboard, login.

## Remaining known limitations
- React reference itself does not build (missing `SubOrderPage`, `FormsPage`);
  sub-order detail follows the View Order contract rather than a React page.
- Bulk Archive/Delete on the orders toolbar and the header Export/Refresh icon
  buttons remain visual affordances (same as React) — no backend exists.
- `Advanced` filters toggle is informational, matching React.
- Sass `map-get` deprecation warnings in `styles/theme.scss` pre-date this
  work; build is unaffected.

## Follow-up validation (2026-09-22)

- Shared table-state helpers now cover filter/sort/pagination semantics for
  Patients, Doctors, and `OrderDataService.applyFilters`.
- Workflow board status resolution is centralized in a pure helper and covered
  by a focused unit test.
- Forms attachment dropzone keyboard activation is explicit and tested.
- Create Order contract coverage now asserts nested service details, clinical
  form values, selected teeth, and file-reference boundaries.
- Invalid order-id route coverage now includes workflow and files pages in
  addition to the existing View Order empty state.
- Validation snapshot at the end of this slice: `248` unit tests passing and
  `npm run build` passing; lint remains unavailable via the configured
  `@angular/build:tsc` builder, so the documented fallback path still applies.

## Accessibility contrast deviation (2026-09-26)

The earlier theming claim ("tokens match React `index.css` exactly") is **no
longer literally true** for foreground/accent colors, by deliberate decision to
satisfy WCAG 2.1 AA contrast (axe-core reported failures on the React-exact
values):

| Token | React-exact value | Current value (WCAG AA) |
| --- | --- | --- |
| `--color-primary` / sidebar active | `#2563EB` | `#1D4ED8` |
| `--color-primary-hover` | `#1D4ED8` | `#1E40AF` |
| `--color-foreground-muted` | `#64748B` | `#5B6779` |
| `--color-success` | `#10B981` | `#047857` |
| `--color-warning` | `#F59E0B` | `#B45309` |
| `--color-danger` | `#EF4444` | `#B91C1C` |
| `--color-accent` | `#06B6D4` | `#0E7490` |
| Status badge text (`status-badge.component.ts`) | `#64748B` | `#5B6779` |

Layout, spacing, typography, radii, and geometry remain parity-verified. Evidence: `evidence/accessibility/axe-summary.md` (0 violations across 24 route-states after the change).
