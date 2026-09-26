# UI Component Inventory

Inventory date: 2026-09-22 (synced 2026-09-26 against the source tree)

This inventory is based on real source files in the current repository snapshot. It documents existing UI components and patterns only; no invented components are included.

## Sanitized source provenance

The inventory was compiled from sanitized repository surfaces representing CRM/customer-portal workflows:

- orders, sub-orders, workflow, billing, documents, notifications
- patients, doctors, clinics, scan-center, change-requests
- shared shell/navigation and shared components under `src/app/shared/`

No private patient records, production secrets, or external tenant data were used to compile this list.

## Inventory

| Component / Pattern | Purpose | Location | Variants | Current Reuse Level | Reuse Priority | Observed Inconsistency / Issue | Should Become Shared? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AppButtonComponent | Primary reusable action control | `src/app/shared/components/button/` | primary, secondary, outline, ghost, danger, success; sm/md/lg/icon sizes | High | High | none observed | Yes |
| AppTextFieldComponent | Labeled form input with optional icons | `src/app/shared/components/input/` | text, email, password, tel, number | High | High | none observed | Yes |
| SearchInputComponent | Search field with debounce support | `src/app/shared/components/search-input/` | xs/sm, clearable, shortcut hint | High | High | none observed | Yes |
| AppSelectComponent | Custom select with label/aria-label and placeholder fallback | `src/app/shared/components/select/` | labeled/aria-labeled, option lists | High | High | none observed | Yes |
| DataTableToolbarComponent | Page-level data table toolbar wrapper | `src/app/shared/components/data-table-toolbar/` | default | High (orders, patients, doctors, billing, change-requests) | High | none observed | Yes |
| SearchFilterToolbarComponent | Search + select filters + advanced/action toolbar | `src/app/shared/components/search-filter-toolbar/` | with/without action button, active filters | High (doctors, patients, billing, change-requests) | High | Consumer variance still exists in action semantics (filter reset vs create actions). | Yes |
| EntityDialogComponent | Modal dialog shell (PrimeNG dialog) with title/subtitle/actions | `src/app/shared/components/entity-dialog/` | add/edit variants via inputs | High | High | none observed | Yes |
| IconActionButtonComponent | Icon-only action button with aria-label | `src/app/shared/components/icon-action-button/` | header/sidebar actions | High | High | none observed | Yes |
| EnterprisePaginatorComponent | Table pagination control | `src/app/shared/components/enterprise-paginator/` | page size variants | High | High | none observed | Yes |
| TableFeedbackComponent | Loading/empty/error feedback for tables | `src/app/shared/components/table-feedback/` | loading/empty/error | High | High | none observed | Yes |
| OrderSummaryCardComponent | Shared order summary display | `src/app/shared/components/order-summary-card/` | order + completedServices + totalServices inputs | Medium | High | none observed | Yes |
| WorkflowTimelineComponent | Workflow stage timeline | `src/app/shared/components/workflow-timeline/` | in-progress/final stage | Medium | High | none observed | Yes |
| StatusBadgeComponent | Status pill for workflow/state labels | `src/app/shared/components/status-badge/` | size xs/sm/md | High | High | Local status palette mapping is component-specific | Yes |
| PriorityBadgeComponent | Priority indicator chip | `src/app/shared/components/priority-badge/` | low/normal/high/urgent | Medium | Medium | Similar pattern appears in workflow and tables and is not yet centralized with `StatusBadge` color semantics. | Yes |
| AvatarComponent | User/avatar display | `src/app/shared/components/avatar/` | image/initials states | Medium | Medium | none observed | Yes |
| LoadingStateComponent | Loading placeholder state | `src/app/shared/components/loading-state/` | default variants | Medium | Medium | none observed | Yes |
| EmptyStateComponent | Empty-result display | `src/app/shared/components/empty-state/` | default variants | Medium | Medium | none observed | Yes |
| ArchBadgeComponent | Dental arch badge | `src/app/shared/components/arch-badge/` | maxilla/mandible | Medium | Medium | none observed | Yes |
| TeethChartComponent | Dental tooth selector/display | `src/app/shared/components/teeth-chart/` | selected/available/disabled teeth | Medium | High | none observed | Yes |
| Sidebar pattern | Primary app navigation shell | `src/app/core/layout/sidebar/` | expanded/collapsed | High | High | none observed | Yes |
| Header pattern | Top shell and utility bar | `src/app/core/layout/navbar/` | search, theme, notifications, profile | High | High | none observed | Yes |
| Layout shell | App frame and routed outlet wrapper | `src/app/core/layout/shell/` | authenticated shell | High | High | none observed | Yes |
| Orders TreeTable | Hierarchical order/service view | `src/app/features/orders/orders.component.*` | normal/filter/search/pagination/tree rows | High | High | TreeTable column set is wider than viewport and depends on horizontal scrolling for narrow screens. | Yes |
| Order detail page | Full order summary and actions | `src/app/features/orders/view-order/` | normal / missing entity | High | High | none observed | Yes |
| Sub-order detail page | Sub-order forms, scans, activity | `src/app/features/orders/sub-order/` | tabs, forms, scans, activity | High | High | none observed | Yes |
| Create order flow | New order wizard/form | `src/app/features/orders/create-order/` | step-driven sections | High | High | none observed | Yes |
| Edit order flow | Existing order editing surface | `src/app/features/orders/edit-order/` | edit states | Medium | Medium | none observed | Yes |
| Order workflow board | Status column review board | `src/app/features/orders/order-workflow/` | seven workflow stages | High | High | Workflow summary style differs from the drag/drop workflow-board surface | Yes |
| Order files page | File upload/review surface | `src/app/features/orders/order-files/` | normal/loading/error/preview | High | High | none observed | Yes |
| Workflow board | Column-based order progression board | `src/app/features/workflow-board/` | drag active / hover / idle | High | High | Card density and lane spacing differ from order-workflow summaries, creating inconsistent workflow visuals. | Yes |
| Doctor list/detail pages | Doctor directory and profile detail | `src/app/features/doctors/` | list/detail | Medium | Medium | none observed | Yes |
| Patient list/detail pages | Patient directory and profile detail | `src/app/features/patients/` | list/detail | Medium | Medium | none observed | Yes |
| Billing table/page | Billing records table | `src/app/features/billing/` | table states | Medium | Medium | none observed | Yes |
| Change requests table/page | Change-request tracking | `src/app/features/change-requests/` | table states | Medium | Medium | none observed | Yes |
| Reports dashboard | Report listing and summaries | `src/app/features/reports/` | summary/table patterns | Medium | Medium | none observed | Yes |
| Notifications panel/page | Notification list and unread state | `src/app/features/notifications/` | unread/read | Medium | Medium | none observed | Yes |
| Settings page | Configuration surface | `src/app/features/settings/` | form/settings patterns | Medium | Medium | none observed | Yes |
| Forms page | Prototype form workflow | `src/app/features/forms/` | active/prototype states | Medium | Medium | Form sections mix wrapper components and unstyled native controls, so visual consistency varies between examples. | Yes |
| Scan center page | Scan intake and review surface | `src/app/features/scan-center/` | scan states | Medium | Medium | none observed | Yes |
| Documents page | Document listing/dialog surface | `src/app/features/documents/` | table/dialog | Medium | Medium | none observed | Yes |

## Shared utilities

| Utility | Purpose | Location |
| --- | --- | --- |
| `table-state.ts` | Table filtering/sorting/pagination helpers | `src/app/shared/utils/table-state.ts` |
| `status-label.ts` | Workflow status label lookup | `src/app/shared/utils/status-label.ts` |
| `sort-a11y.ts` | Accessible sort state helpers (`aria-sort` values and button labels for sortable table headers) | `src/app/shared/utils/sort-a11y.ts` |

## Notes

- The inventory is intentionally conservative: if a pattern was not directly verified in the source tree, it was not added.
- Some reusable business patterns exist inside feature modules rather than a dedicated shared folder; that is acceptable for the POC, but their reuse value is still documented here.
- The next implementation step should reuse these existing surfaces before adding any new wrappers.