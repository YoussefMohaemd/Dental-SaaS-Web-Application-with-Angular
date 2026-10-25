# Dental SaaS Web Application with Angular

Angular 21 proof-of-concept for a dental SaaS UI foundation. The repository demonstrates reusable UI components, routed business screens, backend API-connected services, and a design system built with PrimeNG, Taiga UI, Angular CDK, Tailwind CSS, and signals-based Angular patterns.

## Scope

This repository is an Angular-based dental SaaS POC. It focuses on reusable components, enterprise UI patterns, order and workflow surfaces, accessibility, and evidence-backed documentation.

## Documentation Map

- [Component architecture](./docs/component-architecture.md)
- [UI component inventory](./docs/ui-component-inventory.md)
- [Technology comparison](./docs/technology-comparison.md)
- [Weighted comparison matrix](./docs/weighted-comparison-matrix.md)
- [Deliverable scoring](./docs/deliverable-scoring.md)
- [Licensing review](./docs/licensing-review.md)
- [Scope exceptions](./docs/scope-exceptions.md)
- [Test matrix](./docs/test-matrix.md)
- [Final recommendation](./docs/final-recommendation.md)
- [Demo script](./docs/demo-script.md)
- [AI protocol](./docs/ai-comparison-protocol.md)
- [AI usage log](./AI_USAGE_LOG.md)
- [Contribution summary](./CONTRIBUTION_SUMMARY.md)

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

### Backend dependency for login/API

The frontend now calls backend APIs. Before signing in, run the backend service and MongoDB:

```text
# terminal 1 (backend)
cd ../dental-saas-backend
npm install
npm run dev

# terminal 2 (optional seed users/data)
cd ../dental-saas-backend
npm run seed:dev
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

## Current Status (2026-10-25)

| Gate | Result |
| --- | --- |
| `npm run build` | Passing; non-blocking Sass/CSS budget warnings remain |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 393/393 passing |
| `npm run lint` | Passing |
| `npm run type-check` | Passing |
| `npm run build-storybook` | Existing Storybook gate remains documented in `evidence/` |

Raw logs live under `evidence/`.

## Configuration

- `src/styles/tokens.scss` defines the design tokens.
- `src/styles/theme.scss` maps token values into the browser/Tailwind theme layer.
- `src/styles.scss` applies global styles and component overrides.
- `src/app/app.config.ts` wires routing, HTTP, animations, and UI providers.
- `src/environments/environment*.ts` sets backend API base URL and default tenant ID (`/api` in production, `http://localhost:3000/api` in development).
- `proxy.conf.json` forwards `/api` during `ng serve` to `http://localhost:3000` (backend).

## Supported Scenarios

- Orders page with shared header toolbar, shared status badges, and service-driven preview states (normal/loading/empty/error)
- Role-aware UX wiring: navigation, order creation/edit entry points, and bulk/order action buttons are now gated by backend-issued user capabilities to prevent unsupported actions before API calls
- Order detail, sub-order detail, and create/edit order flows with patient autocomplete, doctor lookup by name/ID (required on create), bill-to targeting (Doctor/Scan Center), service pricing summaries, service-specific form capture, automatic due-date generation, and teeth-aware validation
- Workflow board drag/drop transitions
- Forms, scan/file, patient, doctor, clinic, billing, change-request, report, notification, and settings pages
- Reports workflow extensions: Orders by Date Range (month-scoped record pagination), Quarter Targets + Quarter Detail drill-down (Q1-Q4 rendering), and Team Performance roster with role-based distribution insights
- Shared controls such as buttons, inputs, search input, status badges, avatars, and loading/empty states

## Evidence

- `evidence/build/` - build and lint logs
- `evidence/tests/` - test log
- `evidence/storybook/` - Storybook build log and screenshots
- `evidence/ai-comparison/` - controlled AI comparison slots (pending human execution)
- `evidence/states/` - order state screenshots
- `evidence/responsive/` - responsive screenshots and checklist
- `evidence/accessibility/` - axe-core and keyboard walkthrough artifacts

## Limitations and backend boundaries

- Business data, dashboard/report data, documents, orders, patients, doctors,
  clinics, billing, cases, notifications, and scan-center references are
  loaded from authenticated backend APIs. The removed `public/data` fixture
  assets are not part of the build.
- Settings appearance, notification, density, and language preferences are
  persisted through the authenticated settings API. Profile and organization
  administration remains restricted to the appropriate backend user-management
  workflow and is not reported as saved by this screen.
- Document upload currently persists document metadata through the API. Binary
  storage, virus scanning, download authorization, and retention policy still
  require an approved object-storage contract.
- Quarterly target values are sourced from the backend; when no target
  configuration exists, the API returns zero targets rather than inventing
  client-side values.
- The AI Assistant phase has not started. Any future AI order operation must
  use authenticated server-derived tenant/doctor scope, confirmation for
  writes, and audit events.

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
