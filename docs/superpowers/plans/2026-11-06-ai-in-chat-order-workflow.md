# AI In-Chat Order Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic in-chat Create/Update Order workflow with guided steps, service cards with pricing, T-sheet tooth selection, and post-submit order summary with open-details navigation.

**Architecture:** Extend AI feature state with a dedicated workflow state machine (create/update modes + explicit steps), and render a focused workflow panel component inside the AI page. Reuse existing domain services (`PatientDataService`, `DoctorDataService`, `ClinicDataService`, `OrderDataService`) and existing order constants (`AVAILABLE_SERVICES`) to avoid duplicating business rules and to keep default payload behavior aligned with current order forms.

**Tech Stack:** Angular 21 standalone components, TypeScript strict mode, Angular Signals/computed/effect, existing shared UI components, existing TeethChart component, Jasmine/Karma unit tests.

**Spec:** `docs/superpowers/specs/2026-11-06-ai-in-chat-order-workflow-design.md`

## Global Constraints

- Keep implementation in Angular standalone patterns already used in the codebase.
- Preserve existing AI conversation/history behavior.
- Keep UX bilingual-safe (user can type Arabic/English names) without forcing locale-specific parsing.
- Must fail explicitly with visible error messages when required data cannot be resolved.
- Update list semantics for services/teeth must be patch add/remove.
- Multi-match resolution must force explicit user selection.
- Update-by-patient must show all candidate orders and require pick.
- Workflow entry must work from quick actions and typed intents.
- Unavailable actions must be hidden by authorization.
- Create payload defaults must mirror existing Create Order behavior.
- Changing earlier dependencies must reset downstream selections with a user notice.

## Review Focus

- Typed-intent false positives: ordinary chat messages containing “create”/“update” should not hijack into workflow mode unexpectedly.
- Multi-match entity ambiguity: when several matches exist, the UI must block progression until one explicit choice is selected.
- Dependency resets: changing patient/doctor/clinic after service/teeth selection must clear dependent values and clearly explain what was reset.
- Partial update patch semantics: adding/removing services/teeth must not silently replace untouched existing values.
- Summary navigation integrity: post-submit “open details” action must always resolve to the exact created/updated order id.

---

### Task 1: Defining Workflow Contracts and Intent Types

**Files:**
- Modify: `src/app/core/interfaces/ai.interface.ts`
- Modify: `src/app/core/interfaces/index.ts`
- Create: `src/app/features/ai/state/ai-order-workflow.models.ts`
- Test: `src/app/core/interfaces/ai.interface.spec.ts`

**Interfaces:**
- Consumes:
  - Existing `AiActionIntent`, `AiChatMessage`, `AiShortcutAction`.
  - Existing order-side types from `create-order.interface.ts` and `order.interface.ts`.
- Produces:
  - New/extended intents including explicit order-details intent with order id context.
  - `AiOrderWorkflowMode = "create" | "update"`.
  - `AiOrderWorkflowStep` enum union.
  - `AiOrderWorkflowState` with collected data, candidate matches, and error/reset notices.

- [ ] **Step 1: Write the failing type contract tests**

```ts
it("should expose typed order workflow state contracts", () => {
  const mode: AiOrderWorkflowMode = "create";
  const step: AiOrderWorkflowStep = "patient";
  expect(mode).toBe("create");
  expect(step).toBe("patient");
});

it("should include open-order-details intent with order context", () => {
  const action: AiShortcutAction = {
    id: "open-1",
    title: "Open",
    intent: "openOrderDetails",
    orderId: "ord-1",
  } as AiShortcutAction;
  expect(action.intent).toBe("openOrderDetails");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL with missing workflow types and/or new intent fields.

- [ ] **Step 3: Implement workflow contracts and intent extensions**

Implement workflow model interfaces in `ai-order-workflow.models.ts`, extend `AiActionIntent` and `AiShortcutAction` in `ai.interface.ts`, and export from `index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/interfaces/ai.interface.ts src/app/core/interfaces/index.ts src/app/features/ai/state/ai-order-workflow.models.ts src/app/core/interfaces/ai.interface.spec.ts
git commit -m "feat: add AI in-chat order workflow contracts"
```

### Task 2: Adding Order Workflow State Machine in AI Facade

**Files:**
- Modify: `src/app/features/ai/state/ai-chat.facade.ts`
- Modify: `src/app/features/ai/data/ai-chat.config.ts`
- Test: `src/app/features/ai/state/ai-chat.facade.spec.ts`

**Interfaces:**
- Consumes:
  - `AiOrderWorkflowState` models from Task 1.
  - Existing services: `PatientDataService`, `DoctorDataService`, `ClinicDataService`, `OrderDataService`, `AuthorizationService`, `NavigationService`.
  - `AVAILABLE_SERVICES` defaults from `create-order.interface.ts`.
- Produces:
  - Facade API for workflow lifecycle:
    - `startOrderWorkflow(mode: AiOrderWorkflowMode): void`
    - `cancelOrderWorkflow(): void`
    - `submitWorkflowStep(input: string): Promise<void>`
    - `toggleWorkflowService(serviceId: string): void`
    - `toggleWorkflowTooth(tooth: number): void`
    - `submitCreateWorkflow(): Promise<void>`
    - `submitUpdateWorkflow(): Promise<void>`
  - Quick-action routing for `ops-create-order` and `ops-update-order` into workflow mode.
  - Typed-intent entry detection from composer prompts.

- [ ] **Step 1: Write failing facade tests for lifecycle and routing**

```ts
it("starts create workflow from quick action instead of prefill", () => { /* ... */ });
it("starts update workflow from typed intent prompt", async () => { /* ... */ });
it("forces explicit pick when multiple matches are returned", async () => { /* ... */ });
it("resets dependent selections with notice after parent change", () => { /* ... */ });
it("hides unavailable workflow actions by capability", () => { /* ... */ });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --watch=false --include=src/app/features/ai/state/ai-chat.facade.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL with missing workflow state and handlers.

- [ ] **Step 3: Implement workflow state machine and intent detection**

Implement explicit step transitions, candidate-pick gating, dependency reset behavior, and quick-action/typed-intent routing while preserving existing non-workflow chat behavior.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/features/ai/state/ai-chat.facade.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/state/ai-chat.facade.ts src/app/features/ai/data/ai-chat.config.ts src/app/features/ai/state/ai-chat.facade.spec.ts
git commit -m "feat: add AI order workflow state machine"
```

### Task 3: Building In-Chat Workflow Panel UI (Cards + T-Sheet)

**Files:**
- Create: `src/app/features/ai/components/ai-order-workflow-panel/ai-order-workflow-panel.component.ts`
- Create: `src/app/features/ai/components/ai-order-workflow-panel/ai-order-workflow-panel.component.html`
- Create: `src/app/features/ai/components/ai-order-workflow-panel/ai-order-workflow-panel.component.scss`
- Create: `src/app/features/ai/components/ai-order-workflow-panel/ai-order-workflow-panel.component.spec.ts`
- Modify: `src/app/features/ai/ai.component.ts`
- Modify: `src/app/features/ai/ai.component.html`

**Interfaces:**
- Consumes:
  - Facade workflow state/actions from Task 2.
  - `TeethChartComponent`.
  - Existing shared button/input/select components used in AI and order features.
- Produces:
  - Interactive panel UI for step-specific input.
  - Multi-select service cards with price display.
  - T-sheet interaction with selected teeth count/list.
  - Candidate pick controls for ambiguous matches.

- [ ] **Step 1: Write failing component tests**

```ts
it("renders service cards with prices and supports multi-select", () => { /* ... */ });
it("renders teeth chart step and emits tooth toggles", () => { /* ... */ });
it("blocks continue until explicit candidate pick on multi-match", () => { /* ... */ });
it("shows dependency reset notice when upstream value changes", () => { /* ... */ });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --watch=false --include=src/app/features/ai/components/ai-order-workflow-panel/ai-order-workflow-panel.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL because workflow panel is not implemented.

- [ ] **Step 3: Implement workflow panel and wire into AI page**

Implement a standalone workflow panel and render it in `ai.component.html` only when workflow is active, without disturbing existing chat timeline/history/composer behavior.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/features/ai/components/ai-order-workflow-panel/ai-order-workflow-panel.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/components/ai-order-workflow-panel src/app/features/ai/ai.component.ts src/app/features/ai/ai.component.html
git commit -m "feat: add in-chat order workflow panel UI"
```

### Task 4: Implementing Create/Update Submission, Patch Semantics, and Summary CTA

**Files:**
- Modify: `src/app/features/ai/state/ai-chat.facade.ts`
- Modify: `src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.ts`
- Test: `src/app/features/ai/state/ai-chat.facade.spec.ts`
- Test: `src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts`

**Interfaces:**
- Consumes:
  - Workflow state from Task 2.
  - UI inputs from Task 3.
  - `OrderDataService.createOrder$` and `OrderDataService.updateOrder$`.
- Produces:
  - Create payload composition that mirrors create-order defaults.
  - Update patch behavior for services/teeth add/remove (no full overwrite unless explicitly requested).
  - Assistant summary messages with clickable “Open Order Details” shortcut action.
  - Message action handler for `openOrderDetails` intent.

- [ ] **Step 1: Write failing tests for submit and summary behavior**

```ts
it("creates order from collected workflow data and appends open-details action", async () => { /* ... */ });
it("updates order with patch add/remove semantics for services and teeth", async () => { /* ... */ });
it("navigates to resolved order detail from summary action", () => { /* ... */ });
it("shows explicit error bubble when submit resolution fails", async () => { /* ... */ });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --watch=false --include=src/app/features/ai/state/ai-chat.facade.spec.ts --include=src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL with missing submit logic and open-details action behavior.

- [ ] **Step 3: Implement submit orchestration and summary CTA behavior**

Implement create/update submit flows, strict error surfacing, patch semantics, and action handling for order-details navigation.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/features/ai/state/ai-chat.facade.spec.ts --include=src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/state/ai-chat.facade.ts src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.ts src/app/features/ai/state/ai-chat.facade.spec.ts src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts
git commit -m "feat: submit AI order workflow and add order-detail summary action"
```

### Task 5: Regression Validation and Documentation Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-ai-in-chat-order-workflow-design.md` (if any implementation-level clarifications were introduced)

**Interfaces:**
- Consumes:
  - All tasks above.
- Produces:
  - Verified green targeted test suite for touched AI workflow surfaces.
  - Optional minor spec update if implementation forced explicit clarifications.

- [ ] **Step 1: Run targeted frontend AI tests**

Run: `npm run test -- --watch=false --include=src/app/features/ai/**/*.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS for all AI feature specs.

- [ ] **Step 2: Run focused order-form compatibility tests**

Run: `npm run test -- --watch=false --include=src/app/features/orders/create-order/create-order.component.spec.ts --include=src/app/features/orders/edit-order/edit-order.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS with no regressions from reused defaults/constants.

- [ ] **Step 3: Run lint/type-check for changed frontend workspace**

Run: `npm run lint && npm run typecheck`  
Expected: PASS with no new lint/type errors.

- [ ] **Step 4: Commit final integration validation artifacts (if any file changes remain)**

```bash
git add <changed-files>
git commit -m "chore: validate AI in-chat order workflow integration"
```
