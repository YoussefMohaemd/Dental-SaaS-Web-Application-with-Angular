# Implementation / Gap-Closure Plan

Status: Phase A gate artifact recorded on 2026-09-22.

This plan is based on the current repository state inspected before any production source edit. The implementation direction is UI-preserving only: no redesign, no geometry drift, no token refresh, and no library replacement unless the rendered output can be proven equivalent.

## Current-State Audit

The app is an Angular 21 standalone application using PrimeNG 21, Angular CDK 21, Tailwind 4, Taiga UI 4, Signals, RxJS, and static JSON-backed in-memory services. Orders use a PrimeNG TreeTable, workflow uses a seven-column CDK board, and create-order already captures service details, clinical forms, teeth, scan requirements, and creation metadata in memory.

The most concrete current gaps found in code are silent invalid-id handling on routed detail pages, local duplication of table/relationship logic, and the need to formalize evidence for protected UI surfaces. The build and route shell are already present, so the safe first implementation slice is invalid-id handling using existing containers and styles.

## Phase A Baseline and Invariants

Baseline capture is partially present in `evidence/baseline-invariants.json` and existing screenshots, but additional protected surfaces still need coverage before any visual-affecting change. The protected surfaces include Orders TreeTable, Order View, Sub Order View, Create Order, Workflow Board, Forms, Scans / Order Files, Doctors, Patients, Billing, Change Requests, Sidebar, Navbar, dialogs, reusable controls, and themes.

No intentionally visible property may change: layout, order, width, height, spacing, typography, color, border, shadow, iconography, state rendering, breakpoint behavior, or animation timing are frozen.

## Change Matrix

| Area | Current State | Gap | Required Change | Change Type | UI Risk | Validation |
| ---- | ------------- | --- | --------------- | ----------- | ------- | ---------- |
| Invalid route ids and missing entity states | View Order, Sub Order, Doctors, and Patients pages read route params and only populate data when an entity is found. Missing records currently render silent empties or rely on indirect fallbacks. | Invalid deep links can imply success while showing no explicit state. | Surface explicit in-page not-found handling using the existing shell/container styling and keep the same visual container geometry. | BEHAVIOR ONLY | Low if existing containers are reused; medium if route assumptions change. | Invalid-id route tests, manual deep-link checks, and before/after visual parity for the shell containers. |
| Create Order persistence boundary | Create Order already carries service details, forms, teeth, scan requirements, and creationData into in-memory services. | The boundary needs documentation and contract verification, not a redesign. | Keep the current payload shape and add contract coverage for required service/file/tooth references. | DATA ONLY | Low if payload shape stays stable. | DTO and service contract tests plus creation-flow assertions. |
| Sub-order detail contract | Sub-order data service owns list rows and separate detail records, with scan and form updates already flowing through the service. | Detail fallback behavior needs to stay explicit and consistent with invalid-id policy. | Align detail lookup with an explicit missing-entity state and preserve current tabs, labels, and file/form behavior. | DATA ONLY | Low to medium depending on empty-state reuse. | Detail lookup/update tests and routed sub-order walkthroughs. |
| Workflow Board status handling | Board columns, drag/drop, and in-memory order updates already exist. | Status handling is distributed and should be documented and verified, not visually changed. | Encapsulate status transition rules in the existing board logic while preserving the seven-column layout and card geometry. | BEHAVIOR ONLY | Medium if status-to-column mapping changes. | Component transition tests and drag regression checks. |
| Forms and Order Files policy | Forms is a prototype-style page and Order Files simulates upload state with explicit local behavior. | Prototype-vs-production boundaries need clearer documentation and keyboard behavior checks. | Document the policy and keep the current interactions and file rules intact. | DOCUMENTATION ONLY | Low. | Documentation review plus targeted keyboard/upload tests. |
| Table-heavy page shared logic | Doctors, Patients, Billing, and Change Requests each own their own table state. | Duplicated logic can drift while the rendered tables stay visually frozen. | Extract shared state helpers without changing renderer-specific DOM or style output. | ARCHITECTURE ONLY | Medium due to row-order and pagination sensitivity. | Helper tests plus table parity checks. |
| Reusable controls | Shared controls already exist, but some page-local markup is still duplicated. | Reuse opportunities remain, but they must not alter rendered output. | Wrap current markup/classes/tokens only where computed styles and DOM geometry remain equivalent. | UI-PRESERVING IMPLEMENTATION | High if wrapper output diverges. | Fixture snapshots, DOM diff, computed-style checks, and screenshots. |
| Accessibility hardening | Several custom controls use click-driven interactions with incomplete keyboard/focus semantics. | Keyboard parity is inconsistent on some interactive surfaces. | Add non-visual accessibility behavior and keep presentational states unchanged. | BEHAVIOR ONLY | Low to medium if focus order changes. | Keyboard matrix, automated a11y scans, and focus-state snapshots. |
| Testing, evidence, and docs closure | Existing parity docs are historical and evidence retention is incomplete. | Claims are not yet fully auditable. | Record command outputs, screenshots, and re-audit notes under `evidence/` and refresh the docs to match actual behavior. | TEST ONLY | None for runtime UI. | Build, test, typecheck, and screenshot/evidence artifact validation. |

## Per-Change Contract

### Invalid route ids and missing entity states

Current implementation: routed detail pages read `orderId`, `subOrderId`, `doctorId`, and `patientId`, then only populate state when a matching record exists.

Required change: show an explicit not-found state inside the existing shell/container pattern when the id does not resolve.

Why: invalid deep links must not imply a valid entity or render a silent empty page.

Expected behavior: bad ids never show the wrong record and never change the protected visual geometry.

UI preservation: reuse current containers, spacing, typography, and action placement; only the content state changes.

Validation: route tests for invalid ids, manual deep-link checks, and visual parity confirmation on the affected pages.

### Create Order persistence boundary

Current implementation: the create flow already builds service rows with service details, forms, selected teeth, scan requirements, and creationData.

Required change: preserve that contract with tests and documentation so the shape does not drift.

Why: clinical and workflow references must remain intact across the in-memory boundary.

Expected behavior: created records retain the required references for downstream order and sub-order pages.

UI preservation: no layout or form control changes.

Validation: service contract tests and create-flow assertions.

### Sub-order detail contract

Current implementation: detail records are service-owned and updated in memory.

Required change: make missing detail handling explicit and keep list/detail alignment stable.

Why: list and detail views should not diverge or fail silently.

Expected behavior: sub-order list and detail remain consistent after updates and invalid ids are handled clearly.

UI preservation: keep current tabs, text hierarchy, and file/form cards unchanged.

Validation: unit tests for detail mapping and routed detail walkthroughs.

## Dependencies and Order

1. Finish the invalid-id handling slice first because it is the clearest behavioral defect.
2. Lock the create-order and sub-order contract coverage so the downstream workflow has a stable data boundary.
3. Add shared table and accessibility helpers only after the critical routed flows are stable.
4. Capture the remaining evidence and update the docs with actual command results.

## Risk and Stop Conditions

Stop any change slice if it alters geometry, computed styles, responsive breakpoints, or motion timing on protected surfaces. Do not replace PrimeNG, CDK, Tailwind, or Taiga just to simplify internals. Do not change JSON fixture shapes or introduce a backend as part of this plan.

## Planned Verification Commands

```text
npm ci
npm run tailwind:build
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
```

## Phase A Gate Decision

The repository has enough evidence to proceed with a narrow implementation slice. The first slice should address invalid-id handling on routed detail pages while preserving the current shell and page containers exactly.
