# AI In-Chat Order Create/Update Workflow Design

**Date:** 2026-11-06  
**Status:** Approved  
**Scope:** Front-end first (AI page + existing data services), with no LLM dependency for this guided flow

## Intent and why

Implement a deterministic conversational workflow inside the AI page so users can complete **Create Order** and **Update Order** through guided steps, not free-form prompting. The goal is to match operational behavior requested by users: ask only essential fields in sequence, present service choices with pricing, collect tooth selection via T-sheet chart, submit, then show a clickable summary that opens order details.

## Goals

1. Add a guided **Create Order** lifecycle inside AI chat:
   - patient
   - doctor
   - clinic
   - bill-to (doctor / scan center)
   - multi-select services (cards + prices)
   - T-sheet tooth selection
   - submit and show order summary + open details action
2. Add a guided **Update Order** lifecycle inside AI chat:
   - identify order by ID/order number/patient
   - display resolved order details
   - accept user edits for supported fields
   - apply update and show updated summary + open details action
3. Keep existing generic AI chat behavior intact for non-workflow prompts.
4. Keep capability/authorization checks consistent with current quick-action visibility.

## Non-goals

1. No replacement of [create-order.component.ts](/D:/programming code/VS Project/Dental SaaS Web Application/Dental SaaS Web Application with Angular/src/app/features/orders/create-order/create-order.component.ts) full advanced workflow (all optional deep service forms/files) inside chat in phase 1.
2. No changes to backend assistant LLM planning behavior for this feature.
3. No deletion/cancellation order operations.

## Current-state grounding

1. AI quick actions currently prefill or send text only in [ai-chat.facade.ts](/D:/programming code/VS Project/Dental SaaS Web Application/Dental SaaS Web Application with Angular/src/app/features/ai/state/ai-chat.facade.ts).
2. Existing order forms already have rich logic and service metadata in:
   - [create-order.interface.ts](/D:/programming code/VS Project/Dental SaaS Web Application/Dental SaaS Web Application with Angular/src/app/core/interfaces/create-order.interface.ts)
   - [teeth-chart.component.ts](/D:/programming code/VS Project/Dental SaaS Web Application/Dental SaaS Web Application with Angular/src/app/shared/components/teeth-chart/teeth-chart.component.ts)
3. Shared data services exist for patients/doctors/clinics/orders and can be reused.

## Constraints

1. Keep Angular standalone patterns and existing state style in AI feature.
2. Preserve existing AI conversation/history behavior.
3. Keep UX bilingual-safe (user can type Arabic/English names) without forcing locale-specific parsing.
4. Must fail explicitly with visible error messages when required data cannot be resolved.

## Approaches considered

1. **A — Full in-chat deterministic workflow component (selected)**
   - Add workflow state machine in AI feature and interactive step UI surfaces.
   - Uses existing data services directly for lookups/create/update.
   - Pros: matches requested lifecycle exactly, predictable, no LLM ambiguity.
   - Cons: larger front-end implementation.

2. **B — Hybrid chat-to-existing forms**
   - Collect minimal fields in chat then redirect to existing create/edit pages.
   - Pros: faster.
   - Cons: does not satisfy “full lifecycle inside chat” request.

3. **C — Backend LLM-only prompting**
   - Depend on assistant text prompts and tool execution.
   - Pros: lowest front-end effort.
   - Cons: cannot deliver card-based service chooser + T-sheet UX reliably.

## Selected design (A)

### 1) Workflow session model in AI state

Add an in-memory workflow session in AI facade for active guided flow:
- `mode`: `create` or `update`
- `step`: enum of lifecycle steps
- collected values (patient/doctor/clinic/billTo/service ids/teeth/order target/edits)
- loading/error flags

### 2) New interactive workflow panel inside AI page

Render a dedicated component below messages when workflow is active:
- shows current step prompt
- input control for current step
- service cards grid (multi-select, shows price)
- embedded [teeth-chart.component.ts](/D:/programming code/VS Project/Dental SaaS Web Application/Dental SaaS Web Application with Angular/src/app/shared/components/teeth-chart/teeth-chart.component.ts) for selection
- next/back/submit actions

### 3) Quick action wiring

In `runQuickAction`:
- `ops-create-order` starts `create` workflow
- `ops-update-order` starts `update` workflow
- suppresses legacy prefill for these two actions

### 4) Create submit behavior

On submit:
1. resolve required entity IDs from selections
2. construct minimal valid order payload using existing defaults for non-collected fields
3. call `orderDataService.createOrder$`
4. append assistant summary message and action card:
   - “Open Order Details” (navigates to view order)

### 5) Update submit behavior

On submit:
1. resolve target order from ID/order number/patient search
2. show current editable fields summary
3. apply user-provided edits via `orderDataService.updateOrder$`
4. append updated summary and “Open Order Details” action

### 6) Message/CTA behavior

Add a specific shortcut action intent for opening resolved order details by id to preserve click-through from summary.

## Data choices and defaults (builder call)

1. Use `AVAILABLE_SERVICES` as source for service cards and pricing in phase 1.
2. Keep bill-to options as: `doctor`, `scan-center`.
3. For create minimal payload, derive safe defaults from existing create-order behavior for untouched optional fields.
4. Require at least one service and at least one selected tooth before submit.

## Validation and error handling

1. Step-level validation: block moving forward when required input is empty/invalid.
2. Submit-level validation: show explicit message if entity/order resolution fails.
3. API errors: show assistant error bubble with actionable next step.

## Test strategy

1. Facade unit tests:
   - start/advance/reset workflow
   - create flow payload composition
   - update flow target resolution logic
2. Component tests:
   - service multi-select
   - T-sheet selection handoff
   - summary CTA emission
3. Regression tests for existing quick actions and normal chat behavior.

## Builder-owned decisions

1. Exact field subset editable in update phase 1 (likely: patient/doctor/clinic/bill-to/services/teeth/notes).
2. Final rendering style for summary block (text + shortcut card vs dedicated summary card).
3. Whether workflow panel appears inline under latest assistant message or as pinned section under transcript.

## Approved decisions from product owner

1. Update semantics for list-like fields (services/teeth): **patch add/remove** (not full replace).
2. Multi-match lookup behavior: **force user pick** from explicit choices.
3. Update-by-patient order scope: **show all patient orders and let user pick**.
4. Typed text intent support: **start workflow from quick actions and typed intents**.
5. Authorization behavior: **hide unavailable actions**.
6. Create payload defaults source: **mirror Create Order component defaults**.
7. Dependency change policy: **reset dependent selections with user notice**.
