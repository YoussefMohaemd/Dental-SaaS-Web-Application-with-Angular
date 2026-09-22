# UI Component Inventory

Inventory date: 2026-09-22

This inventory is based on real source files in the current repository snapshot. It documents existing UI components and patterns only; no invented components are included.

## Inventory

| Component / Pattern | Purpose | Location | Variants | Current Reuse Level | Reuse Priority | Observed Inconsistency / Issue | Should Become Shared? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ButtonComponent | Primary reusable action control | `src/app/shared/components/button/` | primary, secondary, outline, ghost, danger, success; sm/md/lg/icon sizes | High | High | Core action control, already reusable | Yes |
| InputComponent | Labeled form input with optional icons | `src/app/shared/components/input/` | text, email, password, tel, number | High | High | Input state is reusable across forms | Yes |
| SearchInputComponent | Search field with debounce support | `src/app/shared/components/search-input/` | xs/sm, clearable, shortcut hint | High | High | Used as a shared search affordance | Yes |
| StatusBadgeComponent | Status pill for workflow/state labels | `src/app/shared/components/status-badge/` | size xs/sm/md | High | High | Local status palette mapping is component-specific | Yes |
| PriorityBadgeComponent | Priority indicator chip | `src/app/shared/components/priority-badge/` | low/normal/high/urgent | Medium | Medium | Similar pattern appears in workflow and tables | Yes |
| AvatarComponent | User/avatar display | `src/app/shared/components/avatar/` | image/initials states | Medium | Medium | Used in shell and detail contexts | Yes |
| LoadingStateComponent | Loading placeholder state | `src/app/shared/components/loading-state/` | default variants | Medium | Medium | Useful for page and card loading states | Yes |
| EmptyStateComponent | Empty-result display | `src/app/shared/components/empty-state/` | default variants | Medium | Medium | Useful for table, page, and detail empty states | Yes |
| ArchBadgeComponent | Dental arch badge | `src/app/shared/components/arch-badge/` | maxilla/mandible | Medium | Medium | Domain-specific chip already reusable | Yes |
| TeethChartComponent | Dental tooth selector/display | `src/app/shared/components/teeth-chart/` | selected/available/disabled teeth | Medium | High | Domain-specific but important to reuse | Yes |
| Sidebar pattern | Primary app navigation shell | `src/app/core/layout/sidebar/` | expanded/collapsed | High | High | Shell geometry is protected | Yes |
| Header pattern | Top shell and utility bar | `src/app/core/layout/navbar/` | search, theme, notifications, profile | High | High | Interactive shell surface | Yes |
| Layout shell | App frame and routed outlet wrapper | `src/app/core/layout/shell/` | authenticated shell | High | High | Structural pattern, not a visual primitive | Yes |
| Orders TreeTable | Hierarchical order/service view | `src/app/features/orders/orders.component.*` | normal/filter/search/pagination/tree rows | High | High | PrimeNG-driven and central to POC | Yes |
| Order detail page | Full order summary and actions | `src/app/features/orders/view-order/` | normal / missing entity | High | High | Business-critical detail surface | Yes |
| Sub-order detail page | Sub-order forms, scans, activity | `src/app/features/orders/sub-order/` | tabs, forms, scans, activity | High | High | Business-critical detail surface | Yes |
| Create order flow | New order wizard/form | `src/app/features/orders/create-order/` | step-driven sections | High | High | Strong POC candidate for reuse | Yes |
| Edit order flow | Existing order editing surface | `src/app/features/orders/edit-order/` | edit states | Medium | Medium | Reuses create-order patterns | Yes |
| Order workflow board | Status column drag/drop board | `src/app/features/orders/order-workflow/` | seven workflow stages | High | High | Uses CDK drag/drop and timeline summary | Yes |
| Order files page | File upload/review surface | `src/app/features/orders/order-files/` | normal/loading/error/preview | High | High | Important for clinical workflow | Yes |
| Workflow board | Column-based order progression board | `src/app/features/workflow-board/` | drag active / hover / idle | High | High | Central enterprise workflow pattern | Yes |
| Doctor list/detail pages | Doctor directory and profile detail | `src/app/features/doctors/` | list/detail | Medium | Medium | Table/detail behavior should stay aligned | Yes |
| Patient list/detail pages | Patient directory and profile detail | `src/app/features/patients/` | list/detail | Medium | Medium | Table/detail behavior should stay aligned | Yes |
| Billing table/page | Billing records table | `src/app/features/billing/` | table states | Medium | Medium | Table-heavy surface with shared state potential | Yes |
| Change requests table/page | Change-request tracking | `src/app/features/change-requests/` | table states | Medium | Medium | Table-heavy surface with shared state potential | Yes |
| Reports dashboard | Report listing and summaries | `src/app/features/reports/` | summary/table patterns | Medium | Medium | Data display pattern rather than unique UI | Yes |
| Notifications panel/page | Notification list and unread state | `src/app/features/notifications/` | unread/read | Medium | Medium | Shared utility surface | Yes |
| Settings page | Configuration surface | `src/app/features/settings/` | form/settings patterns | Medium | Medium | Mostly static, but reusable patterns may exist | Yes |
| Forms page | Prototype form workflow | `src/app/features/forms/` | active/prototype states | Medium | Medium | Policy/documentation boundary is important | Yes |
| Scan center page | Scan intake and review surface | `src/app/features/scan-center/` | scan states | Medium | Medium | Domain workflow pattern | Yes |
| Documents page | Document listing/dialog surface | `src/app/features/documents/` | table/dialog | Medium | Medium | Table/dialog integration | Yes |

## Notes

- The inventory is intentionally conservative: if a pattern was not directly verified in the source tree, it was not added.
- Some reusable business patterns exist inside feature modules rather than a dedicated shared folder; that is acceptable for the POC, but their reuse value is still documented here.
- The next implementation step should reuse these existing surfaces before adding any new wrappers.