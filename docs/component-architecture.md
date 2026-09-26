# Component Architecture and Naming Rules

## 1) Folder structure

The Angular app is organized by cross-cutting core infrastructure, reusable shared UI, and feature slices:

- `src/app/core/`
  - `guards/` (for example `AuthGuard`)
  - `interceptors/` (for example `authInterceptor`)
  - `layout/` (shell, header, sidebar)
  - `models/` (domain interfaces/types)
  - `services/` (data/state/domain utilities)
- `src/app/shared/`
  - `components/` (`app-*` reusable controls and composites)
  - `icons/` (SVG icon helpers)
  - `pipes/` (formatting/safe-render pipes)
  - `utils/` (pure helpers: sorting labels, table filtering, status labels)
- `src/app/features/<feature-name>/`
  - route-level screens and feature-specific state/behavior.

Routing is lazy-first via `loadComponent` in [`app.routes.ts`](../src/app/app.routes.ts) for feature entries.

Test and story location conventions:

- Unit tests: `x.component.spec.ts` alongside source.
- Storybook stories: `x.stories.ts` alongside source.

## 2) Naming rules

- Component file pattern:
  - `x.component.ts`
  - `x.component.html`
  - `x.component.scss`
  - `x.component.spec.ts`
  - `x.stories.ts`
- Selector pattern: `app-kebab-case`.
- Class pattern: `PascalCaseComponent`.

Required spec-name mapping:

| Spec component name | Angular class | Selector |
| --- | --- | --- |
| AppButton | `AppButtonComponent` | `app-button` |
| AppTextField | `AppTextFieldComponent` | `app-input` |
| AppSelect | `AppSelectComponent` | `app-select` |
| StatusBadge | `StatusBadgeComponent` | `app-status-badge` |
| SearchFilterToolbar | `SearchFilterToolbarComponent` | `app-search-filter-toolbar` |
| DataTableToolbar | `DataTableToolbarComponent` | `app-data-table-toolbar` |
| OrderSummaryCard | `OrderSummaryCardComponent` | `app-order-summary-card` |
| WorkflowTimeline | `WorkflowTimelineComponent` | `app-workflow-timeline` |

Storybook title buckets:

- `Basic/*`
- `Composite/*`
- `Business/*`

## 3) Wrapper and library-usage rules

- **PrimeNG**: enterprise data widgets and table/dialog primitives (`p-table`, `p-treetable`, `p-dialog`, `p-paginator`).
- **Taiga UI**: root integration and lightweight directives only (`tui-root`, `TuiButton`, `TuiStatus`, `TuiLabel`) inside app wrappers.
- **Angular CDK**: behavior primitives (`drag-drop`, focus trap, menu, keyboard mechanics).
- **Tailwind**: utility-first layout and spacing.
- **`styles/utilities.scss`**: sanctioned compatibility utility layer until incremental cleanup completes.

Form controls should use shared wrappers (`app-input`, `app-select`, `app-button`) so accessibility, visuals, and API shape remain consistent.

Raw `<button>` is allowed for structural controls where wrappers are not a fit (for example sortable headers, tab toggles, tree expanders, menu trigger internals).

Use a wrapper when:

- third-party API may drift and needs a stable app-facing interface,
- a11y behaviors/labels must be normalized,
- loading/empty/error or form semantics are reused across pages.

Use direct vendor components only for feature-specific, heavy widgets that are not practical shared wrappers.

## 4) Component interfaces and ownership rules

- Prefer signal-based public API: `input()`, `input.required()`, `model()`, `output()`.
- Form components implement `ControlValueAccessor`.
- Interactive controls should expose accessible-name inputs (`ariaLabel`, and feature-specific labels where needed).

State ownership:

- Service signals are the source of truth for async page states.
- `app-table-feedback` owns in-table feedback rows and table-oriented state messaging.
- `app-loading-state` and `app-empty-state` own page-level loading/empty sections.

## 5) Documentation approach

- Storybook is the living usage reference for shared components.
- Inventory and usage mapping: [`ui-component-inventory.md`](./ui-component-inventory.md).
- Architectural/decision records: `docs/*.md`.
- Verifiable runtime evidence: `evidence/*`.

Token namespace note:

- `--color-*` variables are the Tailwind `@theme` bridge.
- unprefixed `--*` variables are the app/PrimeNG usage layer.
- This POC keeps both namespaces intentionally to avoid wide visual-regression churn.
