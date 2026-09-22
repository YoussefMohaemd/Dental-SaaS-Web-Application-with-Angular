# Icon System Root Cause — Diagnosis & Fix

Date: 2026-09-22
Scope: `Dental SaaS Web Application with Angular` — missing/invisible icons app-wide + Login UI defects.
Reference (read-only): `Dental SaaS Web Application with react`.

## Forensic summary

```text
React Icon Source:
  lucide-react ^1.47.0 — individual component imports
  (e.g. `import { Eye, EyeOff, Lock, Mail } from 'lucide-react'`),
  rendered as inline SVG with size/className props. No icon fonts,
  no SVG asset files, no custom wrapper.

Angular Icon Source (current, kept):
  Hand-inlined Lucide-style SVG strings returned by per-component
  helpers (`getIconSvg()`, `sortIcon()`, `uploadIconSvg()`,
  `typeIconSvg()`, `fileIcon()`, …) plus static inline `<svg>`
  in templates (login mail/lock, header search input).
  No icon library installed — and none needed.

Problem:
  1. Angular's DOM sanitizer strips `<svg>` bound via `[innerHTML]`
     unless the value is marked trusted. Only header + login eye used
     the existing `SafeHtmlPipe`; sidebar + 24 feature templates
     (~200 bindings) did not → every such span rendered EMPTY.
     Icons were in the component code but absent from the DOM.
  2. `src/styles/utilities.scss` (and a few component SCSS files)
     styled shared classes with Tailwind `@apply`, but that file is
     compiled by Angular Sass — never by the Tailwind CLI — so the
     rules were emitted literally (`.input-base{@apply ...}` seen in
     dist CSS) and browsers ignored them. `.input-base`,
     `.select-base`, `.label-base`, `.field-hint`, `.field-error`
     therefore contributed ZERO styling → login Email/Password
     inputs rendered as plain borderless fields with no focus ring.

Fix:
  1. Piping every icon `[innerHTML]` binding through the existing
     shared `SafeHtmlPipe` (`| safeHtml`, 26 templates) and importing
     the pipe in each standalone component. Helper return types and
     SVG artwork unchanged (React parity preserved).
  2. Rewriting all `@apply` blocks in `utilities.scss` (forms,
     buttons, cards, tables, badges, avatars, dropdowns, modals,
     empty-states, loading) and `login.component.scss` as plain CSS
     using the theme vars (`var(--border)`, `--primary`, …) with
     React-parity metrics (radius 0.5rem, text-sm 0.875rem,
     primary focus ring `0 0 0 2px color-mix(... 30%)`). Also added
     `[aria-invalid='true']` danger styling so inputs communicate the
     error state. Dead duplicate SCSS classes that are never
     referenced by their templates (sidebar `.nav-item`, clinics
     `.clinic-card`, dashboard `.stat-card`, …) were intentionally
     left untouched — zero runtime effect.

Library:
  No new dependency. Rationale: React's `lucide-react` has an
  Angular sibling, but the codebase already carries faithful inline
  Lucide SVG artwork; adding a library would duplicate the icon
  source and require touching every template anyway. PrimeIcons /
  Taiga icons were deliberately NOT mixed in (per architecture:
  PrimeNG = data-heavy controls, Taiga = light controls, CDK =
  behavior, Tailwind = layout/styling).
```

## Evidence

- `package.json` (React): only icon dep is `lucide-react`; no fonts/assets.
- `grep lucide-react src` (React): 52 usages incl. `LoginPage.tsx`
  (`Eye, EyeOff, Lock, Mail`), `AppLayout.tsx` sidebar icons.
- Angular `dist/.../styles*.css` before fix contained
  `.input-base{@apply w-full text-sm ...}` verbatim → browsers drop
  the whole rule (verified: inputs had padding utilities only).
- `Select-String '\[innerHTML\]=' src/app` before fix: 26 templates;
  only `header.component.html` + login eye used `| safeHtml`.
- Login inputs use static inline `<svg>` (mail/lock) → were never
  sanitizer victims; their defect was the missing `input-base` box
  (border/bg/focus), now restored.

## Login specifics (React parity)

- Sign In button: `app-button` variant `primary` / size `lg` renders
  `bg-primary text-primary-foreground …` → `#2563EB` bg, `#FFFFFF`
  text (both themes); text comes from projected content
  (`Sign in` / `Signing in...`), spinner via `.loading-spinner`,
  disabled+`aria-busy` while loading. Verified in DOM spec
  (`login.component.spec.ts` asserts text + classes), in the bundle
  (`Signing in...` string present), and in generated CSS
  (`.bg-primary`, `.text-primary-foreground` present with correct
  vars). No separate button defect found; if an invisible label is
  ever observed again, capture computed `color`/`background-color`
  — with the two shared causes fixed there is no code path left
  that hides it.
- Email input: leading mail icon at `left-3` (15px, muted), input
  reserves `pl-9 pr-4`, focus ring + border-primary, placeholder
  `you@dentalab.com` in muted color, dark-mode via vars.
- Password input: leading lock icon, trailing eye/eye-off toggle at
  `right-3` (sanitized via pipe), `pr-10` so text never underlaps
  the toggle; `passwordType` getter switches `text`/`password`.

## Validation (2026-09-22)

- `npm run build` → `Application bundle generation complete`, 0 errors.
- `npx tsc -p tsconfig.app.json --noEmit` → exit 0 (strictTemplates
  validates all 201 `| safeHtml` bindings + pipe imports).
- dist CSS: `.input-base{width:100%;…border:1px solid
  var(--border);background-color:var(--card)…}` + `:focus` ring;
  `@apply` count in dist CSS = 0.
- `innerHTML` without `| safeHtml`: 0 remaining (201 with pipe).
- No icon fonts/SVG assets required → no 404 surface; no console
  sanitizer warnings expected.
- React project untouched (reference only).

## Follow-ups (not regressions, pre-existing)

- `npm run lint` fails: `Cannot find builder "@angular/build:tsc"`
  (repo `angular.json` references a builder absent in Angular 21).
  Use `npx tsc -p tsconfig.app.json --noEmit` until the lint target
  is migrated.
- Dart Sass `map-get` deprecation warnings in `theme.scss`
  (pre-existing, cosmetic).
