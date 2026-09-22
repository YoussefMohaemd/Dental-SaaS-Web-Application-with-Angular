# Dental SaaS Web Application with Angular

Angular 21 proof-of-concept for a dental SaaS UI foundation. The repository demonstrates a reusable design system, orders and workflow surfaces, in-memory JSON-backed data services, and a UI stack based on PrimeNG, Taiga UI, Angular CDK, and Tailwind CSS.

## Scope

This repository is an Angular-based adaptation of the IMP-FE-003 POC. It focuses on reusable components, enterprise UI patterns, order management, workflow interactions, and truthful documentation/evidence rather than a visual redesign.

## Stack

- Angular 21 + TypeScript
- PrimeNG 21
- Taiga UI 4
- Angular CDK 21
- Tailwind CSS 4
- RxJS
- Signals

## Setup

Install dependencies and build the Tailwind output used by the app shell.

```text
npm install
npm run tailwind:build
```

## Run

```text
npm start
```

The `start` script runs Tailwind in watch mode together with the Angular dev server.

## Tests

```text
npm test
npm test -- --watch=false --browsers=ChromeHeadless
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
```

## Configuration

- `src/styles/tokens.scss` defines design tokens and CSS custom properties.
- `src/styles/theme.scss` maps the token system into browser variables and Tailwind theme values.
- `src/styles.scss` applies global base styles and PrimeNG overrides.
- `src/app/app.config.ts` wires routing, PrimeNG, Taiga UI language setup, HTTP, and animations.

## Supported Scenarios

- Orders TreeTable browsing and filtering
- Order detail, sub-order detail, and create-order flows
- Workflow board drag/drop transitions
- Forms, scan/file, patient, doctor, clinic, billing, change-request, report, notification, and settings pages
- Shared reusable controls such as buttons, inputs, search input, status badges, avatars, and loading/empty states

## Limitations

- This is a POC with in-memory/static JSON data, not a production backend.
- Controlled AI-comparison evidence is not yet present in the repository snapshot.
- Storybook is not yet configured in the repository snapshot.
- Some submission evidence must remain human-generated and cannot be fabricated.

## Demo Notes

- Start at the login route, then navigate into the authenticated shell.
- Use the Orders and Workflow surfaces to observe the main reusable UI patterns.
- Use the routed detail pages to review entity relationships and protected UI states.

## Architecture Overview

- Angular owns application composition and routing.
- PrimeNG provides the enterprise widget layer such as TreeTable and dialogs.
- Taiga UI supplies the app root and language integration.
- Angular CDK provides drag/drop primitives for the workflow board.
- Tailwind provides utility-first layout and spacing.
- Shared token files centralize the app's effective visual values without changing the current rendered UI.