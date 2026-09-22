# Implementation / Gap-Closure Plan

Status: Phase A gate artifact recorded on 2026-09-22.

This plan is based on the current repository state inspected before any production source edit. The implementation direction is UI-preserving only: no redesign, no geometry drift, no token refresh, and no library replacement unless the rendered output can be proven equivalent.

## Current-State Audit

The app is an Angular 21 standalone application using PrimeNG 21, Angular CDK 21, Tailwind 4, Taiga UI 4, Signals, RxJS, and static JSON-backed in-memory services. The stack is already separated correctly: Angular is the framework, PrimeNG is the enterprise component library, Taiga UI supplies the root and UI primitives where used, Angular CDK supplies interaction primitives, and Tailwind provides utility styling.

The current codebase already contains a substantial reusable layer:

- Basic controls: `ButtonComponent`, `InputComponent`, `SearchInputComponent`, `StatusBadgeComponent`, `PriorityBadgeComponent`, `AvatarComponent`, `LoadingStateComponent`, `EmptyStateComponent`, `ArchBadgeComponent`, `TeethChartComponent`.
- Shared helpers: `table-state.ts`, `safe-html.pipe.ts`, `lucide-icons.ts`.
- Core layout: `SidebarComponent`, `HeaderComponent`, `LayoutComponent`.
- Domain views: Orders TreeTable, order detail, sub-order detail, create/edit workflow, workflow board, forms, files, doctors, patients, billing, change requests, reports, scan center, documents, notifications, settings.
- Design system foundation: centralized token files and theme mapping already exist in `src/styles/tokens.scss`, `src/styles/theme.scss`, and `src/styles.scss`.

The most concrete gaps found in code are not visual redesign gaps. They are mostly evidence and documentation gaps, plus a few bounded implementation/evidence slices:

- No Storybook configuration or stories were found.
- No `README.md`, `AI_USAGE_LOG.md`, `CONTRIBUTION_SUMMARY.md`, or `CHECKPOINT_STATUS.md` exists yet.
- No `evidence/` folder was found in the current repository snapshot.
- The current plan still needs a formal component inventory and technology comparison artifact grounded in the live Angular stack.
- Existing routed detail pages and POC surfaces need continued verification for explicit missing/empty/error states and accessibility behavior, but the visual shell and component geometry are already established.

## Phase A Baseline and Invariants

Baseline capture is partially present in prior validation docs, but the repository snapshot inspected here does not yet include a complete evidence pack for all protected surfaces. The protected surfaces include Orders TreeTable, Order View, Sub Order View, Create Order, Workflow Board, Forms, Scans / Order Files, Doctors, Patients, Billing, Change Requests, Sidebar, Navbar, dialogs, reusable controls, and themes.

No intentionally visible property may change: layout, order, width, height, spacing, typography, color, border, shadow, iconography, state rendering, breakpoint behavior, or animation timing are frozen.

## Change Matrix

| Area | Current State | Gap | Required Change | Change Type | UI Risk | Validation |
| ---- | ------------- | --- | --------------- | ----------- | ------- | ---------- |
| Current-state evidence and documentation | Prior audit artifacts exist, but the repo still lacks a final README, AI usage log, contribution summary, checkpoint status, and complete evidence pack. | Required submission artifacts are incomplete and not yet truthfully auditable. | Create factual documentation artifacts only from verified repo/history/current behavior. | DOCUMENTATION ONLY | None if documentation stays external to runtime UI. | File presence checks, content review, and validation against observed codebase facts. |
| Storybook coverage | No Storybook config or stories were found in the workspace. | Required minimum story coverage for basic, composite, and business components is missing. | Add the minimum Storybook setup and stories only for real existing components. | DOCUMENTATION ONLY | None unless story code diverges from production code. | Storybook build and story render verification. |
| UI component inventory | Real reusable controls exist, but no consolidated inventory artifact was found. | The task requires at least 20 real components/patterns documented with reuse priority and issues. | Produce a verified inventory based on existing components/patterns only. | DOCUMENTATION ONLY | None. | Manual inventory review against actual source files and cross-check with component locations. |
| Technology comparison | The Angular stack and library roles are visible in code, but no dedicated comparison artifact is present. | A truthful comparison across PrimeNG, Taiga UI, Angular CDK, and Tailwind is missing. | Document each tool by role, strengths, limitations, maintainability, accessibility, customization, and fit. | DOCUMENTATION ONLY | None. | Review against current code usage and current official docs where needed. |
| Weighted matrix | No verified weighted matrix artifact was found in the current repo snapshot. | The 100% matrix with AI-assisted development at 15% is missing. | Create the matrix from verified evidence only and explicitly mark missing controlled AI evidence as pending. | DOCUMENTATION ONLY | None. | Matrix total check and citation/source review. |
| Controlled AI comparison | No controlled comparison evidence or AI usage log was found. | The mandatory AI-output comparison cannot be claimed complete. | Record only real AI usage now; leave controlled experiment results clearly pending where absent. | DOCUMENTATION ONLY | None. | Evidence-status review against existing logs and conversation/project artifacts. |
| Required reusable component mapping | Core equivalents exist for button, input, status badge, search input, and several helpers, but the required task mapping is not yet documented. | The repo needs a verified mapping from required task names to actual Angular components. | Document the actual equivalents and only implement missing ones if a true gap remains. | ARCHITECTURE ONLY | Low if documentation-only; medium if new wrappers are added. | Component API review and reuse mapping validation. |
| Composite/business component gap check | Existing order and workflow views already provide most required business behavior, but formal reusable composites are not yet isolated as task artifacts. | SearchFilterToolbar, DataTableToolbar, OrderSummaryCard, and WorkflowTimeline need truth-table verification and possible extraction. | Reuse or extract only if a documented gap remains after inspection. | UI-PRESERVING IMPLEMENTATION | Medium if extraction changes DOM or computed styles. | Component tests plus before/after visual parity checks. |
| Order Management POC states | The Orders feature already has a normal state and internal loading/error/service behavior, but the required public-facing POC state coverage still needs verification and documentation. | Need explicit confirmation that normal, loading, empty, and error states are all demonstrated in the required POC scope. | Keep the existing layout and add only missing state handling if a state is truly absent. | BEHAVIOR ONLY | Medium if state switching affects rendered table geometry. | Targeted tests and browser verification on the orders surface. |
| Design token completeness | Token files already define colors, spacing, radius, shadows, typography, breakpoints, and focus-related values via CSS variables and Sass constants. | Some token categories still need a formal consumption audit across shared components. | Centralize/alias only where needed and keep effective values unchanged. | ARCHITECTURE ONLY | Low if aliasing preserves current values. | Token usage audit and component style checks. |
| Test coverage | There are many unit tests already, but the repo still needs confirmation against the specific task matrix. | Required behavior coverage for the task needs explicit mapping and, where missing, focused tests. | Add only the missing tests that verify meaningful behavior. | TEST ONLY | None. | Angular/Karma and TypeScript checks. |
| Accessibility validation | Controls and pages exist, but the task requires explicit validation records for the reusable surface and order POC. | Need honest accessibility validation and notes for any remaining gaps. | Fix only genuine accessibility defects and document what was validated. | BEHAVIOR ONLY | Low if semantics are preserved. | Keyboard and semantic review plus automated checks where available. |
| Responsive validation | The app uses responsive layout patterns and Tailwind utilities, but validation evidence is incomplete. | Need documented desktop/tablet/mobile verification for the required POC surfaces. | Preserve the current responsive behavior and fix only confirmed breakage. | BEHAVIOR ONLY | Medium if breakpoint-dependent layouts shift. | Browser viewport checks and responsive test evidence. |

## Per-Change Contract

### Current-state documentation closure

Current implementation: the repository already contains the technical surface, but not the full required submission artifacts.

Required change: create factual documentation and evidence templates from the verified current state.

Why: the task requires auditable proof, not implied completion.

Expected behavior: the repo gains truthful artifacts without changing runtime UI.

UI preservation: no production styling, layout, or component output changes.

Validation: presence checks and content review against actual codebase facts.

### Storybook coverage

Current implementation: Storybook is not configured in the repository snapshot.

Required change: add the minimum Storybook setup and stories for real existing components only.

Why: the task requires demonstrable component examples.

Expected behavior: at least two basic components, one composite component, and one business component are documented in Storybook.

UI preservation: story files must reuse production components and must not alter runtime styling.

Validation: Storybook build/render verification.

### Required reusable component mapping

Current implementation: Angular reusable controls already exist, but the required task names are not yet mapped to actual components in documentation.

Required change: identify equivalent components and only implement missing ones if inspection proves a gap.

Why: duplication would be unnecessary and could introduce visual drift.

Expected behavior: task-required controls are either mapped to existing components or implemented once, as needed.

UI preservation: any new wrapper must keep the same computed styles and geometry.

Validation: component API review, unit tests, and visual parity checks where wrappers are added.

### Order Management POC state coverage

Current implementation: Orders already has filtering, loading/error service plumbing, and a TreeTable-driven hierarchy.

Required change: verify whether the task-defined normal/loading/empty/error states are all exposed in the required POC scope and add only the missing state branch if needed.

Why: the POC must explicitly demonstrate all required states.

Expected behavior: the orders POC shows the required state set without altering protected geometry.

UI preservation: keep the existing Orders TreeTable and surrounding shell unchanged.

Validation: focused tests and browser checks on the orders surface.

## Dependencies and Order

1. Finalize documentation and evidence artifacts first so later implementation claims stay grounded.
2. Confirm the exact mapping for required reusable controls before adding any new component wrappers.
3. Only extract or add composite/business components if the inspection proves the current equivalents are insufficient.
4. Run focused validation after any implementation slice and record only what was actually observed.

## Risk and Stop Conditions

Stop any change slice if it alters geometry, computed styles, responsive breakpoints, or motion timing on protected surfaces. Do not replace PrimeNG, CDK, Tailwind, or Taiga just to simplify internals. Do not change JSON fixture shapes or introduce a backend as part of this plan.

## Planned Verification Commands

```text
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run lint
```

## Phase A Gate Decision

The repository has enough evidence to proceed, but the next step is documentation-first closure of the actual gaps already verified in the current codebase. Any code change must remain UI-preserving and must be justified by an inspected requirement gap, not by a desire to redesign the current application.
