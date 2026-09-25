# Library Usage Rules

This document defines practical ownership boundaries for approved frontend libraries while preserving the existing UI.

## PrimeNG

Use PrimeNG for enterprise and data-heavy widgets:

- Data tables, tree tables, sorting, filtering, pagination, row selection
- Dialogs and confirmation dialogs tied to business workflows
- Loading and empty states related to PrimeNG table/list surfaces

Avoid PrimeNG for simple form controls when shared Taiga-backed controls are sufficient.

Current standard wrappers:

- `app-entity-dialog` wraps PrimeNG `p-dialog` as the single app-level modal shell
- `app-enterprise-paginator` wraps PrimeNG `p-paginator` as the default enterprise pagination control
- Orders, billing, patients, change-requests, and cases list pagination should use `app-enterprise-paginator` instead of page-button markup

## Taiga UI

Use Taiga UI for lightweight control behavior via shared components:

- Shared button behavior and interactions
- Shared input/select wrappers where lightweight control primitives are needed
- Reusable control-level accessibility and focus conventions

Avoid direct ad-hoc usage in feature templates when a shared component already exists.

Current standard wrappers:

- `app-button` is the preferred basic action primitive and includes Taiga button behavior
- `app-status-badge` includes Taiga status semantics for lightweight status display
- `app-icon-action-button` is the preferred row-level/icon-only action primitive for preview/download/delete type controls
- Keep feature templates on shared wrappers instead of raw Taiga primitives unless a feature requires a unique behavior

## Angular CDK

Use CDK only for interaction primitives:

- Drag and drop (especially workflow board)
- Focus, keyboard, overlay, and positioning primitives

Current standard usage:

- `workflow-board` uses CDK drag/drop as the canonical board interaction
- `app-entity-dialog` applies CDK focus trapping for keyboard focus containment within modal content

Do not use CDK as a visual component library.

## Tailwind CSS

Use Tailwind utilities as the first choice for:

- Layout, spacing, alignment, sizing, and responsive behavior
- Utility-level typography, border, radius, and state styles

Use component SCSS only when style logic cannot be cleanly represented with utilities.

## Native HTML and Custom SCSS

Use native elements only when approved libraries are not appropriate.
Use custom SCSS only for:

- PrimeNG/Taiga style integration and overrides
- Component-specific logic that should not be utility-driven

## Duplication Rules

Avoid maintaining multiple competing systems for the same responsibility:

- One shared button API
- One shared input/select API
- One enterprise pagination system
- One enterprise dialog pattern
- One shared enterprise toolbar pattern (`app-search-filter-toolbar`) for search/filter/action rows
- One shared enterprise table header pattern (`app-data-table-toolbar`) for title/subtitle blocks
- One shared enterprise table feedback pattern (`app-table-feedback`) for loading/empty list states
- One shared icon action pattern (`app-icon-action-button`) for hover-revealed row actions

If an exception is required, document the reason in the relevant feature decision note.
