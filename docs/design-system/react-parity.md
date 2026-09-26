# React Design Parity — Token & Utility Wiring

Date: 2026-09-21
Source of truth: `Dental SaaS Web Application with react/src/index.css` + `AppLayout.tsx`.

## Root cause

Templates used the full React token vocabulary (`bg-background`,
`text-muted-foreground`, `bg-sidebar`, `border-border`, `font-display`, …)
but Tailwind v4 had no `@theme` mapping, so none of those utilities were
generated — the app rendered without its color system. In parallel,
`styles.scss` / `theme.scss` / `utilities.scss` consumed React-style
variables (`var(--primary)`, `var(--background)`, …) while `tokens.scss`
only defined `--color-*` names, leaving most global styles unresolved.

## Fixes

1. `src/tailwind.input.css` — exact port of React's `@theme inline` block
   (all colors, sidebar tokens, radius, fonts) plus the same
   `@custom-variant dark` selector. Utilities — including opacity
   modifiers like `bg-primary/10` — now resolve against the runtime
   variables and follow the light/dark theme automatically.
2. `src/styles/tokens.scss` — corrected values to React: page background
   `#F1F5F9` (was `#F8FAFC`), display font `Outfit` (was Plus Jakarta
   Sans), secondary `#F8FAFC`/`#475569`, dark sidebar `#020617`,
   dark sidebar foreground `#CBD5E1`, dark sidebar muted `#475569`.
   `theme.scss` propagates these into `--background`, `--primary`, …
   for `:root` and `[data-theme="dark"]` (unchanged mechanism).
3. `src/index.html` — Google Fonts links for Outfit / Inter /
   JetBrains Mono (same set and weights as React).
4. PrimeNG visuals stay aligned through the existing `styles.scss`
   `.p-*` overrides, which now resolve against the fixed variables.

## Responsibility split (unchanged)

- PrimeNG → data tables (`p-table`), dialogs (`p-dialog`).
- Taiga UI → app providers (`TUI_LANGUAGE`, `TuiRoot`); basic-control
  migration tracked separately.
- Angular CDK → drag & drop (workflow board), overlays/focus as needed.
- Tailwind → layout, spacing, responsive, and all token-driven color /
  typography utilities via the `@theme` bridge above.
- SCSS → design tokens, theme variables, PrimeNG overrides,
  component-specific rules.

## Validation (2026-09-21)

- `npm run tailwind:build` emits all semantic utilities
  (`.bg-background`, `.text-muted-foreground`, `.bg-primary`,
  `.bg-sidebar`, `.font-display`, …).
- `npx ng build` → `Application bundle generation complete`, 0 errors.
- dist CSS contains utilities and `--background: #F1F5F9`.

## Follow-up note (2026-09-22)

- The visual token mapping above remains unchanged.
- Later work in this branch focused on non-visual helper extraction and
   validation coverage (table state, workflow status lookup, create-order
   contract tests, route-safety tests, forms keyboard behavior).
- No additional token or utility rewiring was required for that follow-up.

## Follow-up note (2026-09-26) — deliberate contrast deviation

- Foreground/accent colors were darkened relative to the React-exact values
   for WCAG 2.1 AA contrast (axe-core failures on the original values):
   `--color-primary` → `#1D4ED8`, `--color-primary-hover` → `#1E40AF`,
   `--color-foreground-muted` → `#5B6779`, `--color-success` → `#047857`,
   `--color-warning` → `#B45309`, `--color-danger` → `#B91C1C`,
   `--color-accent` → `#0E7490`.
- Full table and rationale: `docs/validation/react-angular-parity-report.md`
   § "Accessibility contrast deviation (2026-09-26)".
- Layout, spacing, typography, radii, and the dark-theme values are unchanged.
