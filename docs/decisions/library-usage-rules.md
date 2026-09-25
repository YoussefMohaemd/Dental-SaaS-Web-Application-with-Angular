# Library Usage Rules

This document defines practical ownership boundaries for approved frontend libraries while preserving the existing UI.

## PrimeNG

Use PrimeNG for enterprise and data-heavy widgets:

- Data tables, tree tables, sorting, filtering, pagination, row selection
- Dialogs and confirmation dialogs tied to business workflows
- Loading and empty states related to PrimeNG table/list surfaces

Avoid PrimeNG for simple form controls when shared Taiga-backed controls are sufficient.

## Taiga UI

Use Taiga UI for lightweight control behavior via shared components:

- Shared button behavior and interactions
- Shared input/select wrappers where lightweight control primitives are needed
- Reusable control-level accessibility and focus conventions

Avoid direct ad-hoc usage in feature templates when a shared component already exists.

## Angular CDK

Use CDK only for interaction primitives:

- Drag and drop (especially workflow board)
- Focus, keyboard, overlay, and positioning primitives

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

If an exception is required, document the reason in the relevant feature decision note.
