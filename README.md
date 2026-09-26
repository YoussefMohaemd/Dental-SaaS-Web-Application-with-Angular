# Dental SaaS Web Application with Angular

Angular 21 proof-of-concept for a dental SaaS UI foundation. The repository demonstrates reusable UI components, routed business screens, in-memory JSON-backed services, and a design system built with PrimeNG, Taiga UI, Angular CDK, Tailwind CSS, and signals-based Angular patterns.

## Scope

This repository is an Angular-based dental SaaS POC. It focuses on reusable components, enterprise UI patterns, order and workflow surfaces, accessibility, and evidence-backed documentation.

## Documentation Map

- [Component architecture](./docs/component-architecture.md)
- [Weighted comparison matrix](./docs/weighted-comparison-matrix.md)
- [Licensing review](./docs/licensing-review.md)
- [Scope exceptions](./docs/scope-exceptions.md)
- [Test matrix](./docs/test-matrix.md)
- [Final recommendation](./docs/final-recommendation.md)
- [Demo script](./docs/demo-script.md)
- [AI protocol](./docs/ai-comparison-protocol.md)

## Stack

- Angular 21 + TypeScript
- PrimeNG 21
- Taiga UI 4
- Angular CDK 21
- Tailwind CSS 4
- RxJS
- Signals

## Setup

```text
npm install
npm run tailwind:build
```

## Run

```text
npm start
```

## Tests

```text
npm test
npm test -- --watch=false --browsers=ChromeHeadless
npm run lint
npm run type-check
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
```

## Storybook

```text
npm run storybook
npm run build-storybook
```

Storybook covers the shared controls and reusable composite/business patterns. Static output is generated in `storybook-static/`.

## Current Status (2026-09-26)

| Gate | Result |
| --- | --- |
| `npm run build` | Passing, with non-blocking Sass/CSS budget warnings |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 357/357 passing |
| `npm run lint` | Passing |
| `npm run build-storybook` | Passing |
| axe-core scan (wcag2a/aa + best-practice, 24 route-states) | 0 violations |

Raw logs live under `evidence/`.

## Configuration

- `src/styles/tokens.scss` defines the design tokens.
- `src/styles/theme.scss` maps token values into the browser/Tailwind theme layer.
- `src/styles.scss` applies global styles and component overrides.
- `src/app/app.config.ts` wires routing, HTTP, animations, and UI providers.

## Supported Scenarios

- Orders page with shared header toolbar, shared status badges, and service-driven preview states (normal/loading/empty/error)
- Order detail, sub-order detail, and create-order flows
- Workflow board drag/drop transitions
- Forms, scan/file, patient, doctor, clinic, billing, change-request, report, notification, and settings pages
- Shared controls such as buttons, inputs, search input, status badges, avatars, and loading/empty states

## Evidence

- `evidence/build/` - build and lint logs
- `evidence/tests/` - test log
- `evidence/storybook/` - Storybook build log and screenshots
- `evidence/states/` - order state screenshots
- `evidence/responsive/` - responsive screenshots and checklist
- `evidence/accessibility/` - axe-core and keyboard walkthrough artifacts

## Limitations

- This is a POC with in-memory/static JSON data, not a production backend.
- Controlled AI-comparison evidence is pending human execution.
- Mentor checkpoint approvals are pending for recorded deviations.
- Some evidence items are intentionally human-validated and must not be fabricated.

## Demo Notes

- Start at the login route, then enter the authenticated shell.
- Open `/orders` and use the `normal | loading | empty | error` POC control in the header.
- Show retry from error state and shared component usage (header, toolbar, status badges).
- Walk Storybook Basic/Composite/Business stories and conclude with docs + evidence tour.

## Architecture Overview

- Angular owns routing and application composition.
- PrimeNG provides the enterprise widget layer.
- Taiga UI supports root-level UI integration where used.
- Angular CDK provides drag/drop primitives.
- Tailwind provides utility-first layout and spacing.
