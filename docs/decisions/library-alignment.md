# Library Alignment Decisions

Date: 2026-09-21
Scope: `Dental SaaS Web Application with Angular` — dependency and provider fixes.

## 1. PrimeNG pinned to exactly `21.0.4`

- Installed Angular is `21.0.x`. PrimeNG `21.1.x` compiles its components with
  `ChangeDetectionStrategy.Eager`, which only exists in Angular `>= 21.1`.
  With Angular 21.0 the AOT compiler fails with
  `Unsupported change detection strategy` (seen in `primeng-table.mjs`).
- `package.json` therefore pins `"primeng": "21.0.4"` (no caret).
- Do NOT widen to `^21.x`: the next `npm install` would pull 21.1+ and break
  the build. Only unpin when Angular itself is upgraded to `>= 21.1`.
- `@primeng/themes@21.0.4` is the matching theme package for this PrimeNG
  line (hence `import Aura from '@primeng/themes/aura'` in `app.config.ts`).
  npm flags it deprecated in favor of `@primeuix/themes`, but that package
  pairs with PrimeNG 21.1+ — same upgrade gate applies.

## 2. Removed bogus `@angular/signals` dependency

- No such npm package exists; signals ship inside `@angular/core`.
- Nothing in `src/` imported it. Its presence broke every `npm install`
  with a 404, so it was deleted from `package.json`.

## 3. Tailwind CSS v4 wired through the standalone CLI

- Finding: `@import 'tailwindcss'` inside `styles.scss` resolved but the
  Tailwind engine never ran in the Angular (esbuild) pipeline, so zero
  utilities were emitted (verified: no `.px-6{`, `.flex{` rules in dist CSS).
  All Tailwind-based layouts were unstyled.
- Fix: `tailwindcss` added to `dependencies`, `@tailwindcss/cli` +
  `concurrently` to `devDependencies`.
- `src/tailwind.input.css` (`@import "tailwindcss";`) is compiled to the
  tracked file `src/styles/tailwind-generated.css`, which is listed in
  `angular.json` `styles` (build + test) after `styles.scss`.
- `npm run build` / `npm run start` regenerate it via `prebuild`/`prestart`;
  `npm start` also runs `tailwind:watch` alongside `ng serve`.
- The generated file is intentionally committed so bare `npx ng build`
  works without a pre-step.
- Removing the SCSS `@import` also eliminated the Dart Sass `@import`
  deprecation warnings.

## 4. Static JSON served via asset mapping

- Finding: `public/data/*.json` returned 404 from `ng serve` and was absent
  from `dist/` — every data service would fail at runtime.
- Fix (config-only, no service changes): `angular.json` maps
  `{ "glob": "**/*", "input": "public/data", "output": "data" }` for build
  and test targets, so `/data/*.json` resolves in dev and prod.
- Verified: `dist/.../browser/data/*.json` present; dev-server returns
  200 for `orders/patients/billing.json`.

## 5. Taiga UI locale + root

- Default language was Russian (`TUI_RUSSIAN_LANGUAGE`) in an English app;
  switched to `TUI_ENGLISH_LANGUAGE`.
- Added `TuiRoot` (`<tui-root>`) to `AppComponent` as required host for
  Taiga overlays/dialogs.

## 6. `app.config.ts` cleanup

- Removed unused `bootstrapApplication` import (belongs to `main.ts`).
- Removed duplicate `provideAnimations()`; `provideAnimationsAsync()`
  alone is the async animation provider.

## 7. Production budget

- `initial` budget raised to warning `1mb` / error `2mb`: the required
  stack (PrimeNG + Taiga + CDK + charts of enterprise pages, all eager
  routes) legitimately exceeds the CLI default 1 MB cap.
- Follow-up: convert feature routes to `loadComponent` lazy loading to
  bring the initial bundle back down (tracked separately).

## Validation (2026-09-21)

- `npx ng build` → `Application bundle generation complete`, 0 errors.
- dist CSS contains generated utilities (`.px-6{`, `.text-xs{`, `.flex{`,
  `.grid{`, `.rounded-xl{` all present).
- `ng serve` smoke test: `/` → 200; `/data/*.json` → 200.

## Follow-up applied: lazy routes + 404 note (2026-09-21)

- All 26 feature routes converted from eager `component:` to
  `loadComponent:` dynamic imports in `app.routes.ts` (shell + guard stay
  eager). Result: 26 lazy chunks, main bundle 1.38 MB → ~205 KB.
- Reported `GET /data/*.json 404` on a running `ng serve`: the
  `public/data → /data` asset mapping in `angular.json` was verified
  intact and a fresh dev-server returns 200 for every JSON dataset.
  Cause was a stale dev-server started before the mapping was added —
  `angular.json` changes require restarting `ng serve`.
