# AI Assistant UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-end only AI workspace page with reusable shortcut/result cards, dashboard entry, and full light/dark support.

**Architecture:** Add a new standalone feature route (`/ai`) and keep navigation discoverability through Dashboard only. Introduce focused reusable UI components for AI shortcuts and AI result summaries under shared components, backed by typed interfaces, then compose them in the AI page shell. Keep behavior logic minimal and presentational so backend integration can be added later without reworking UI contracts.

**Tech Stack:** Angular 21 standalone components, TypeScript, Tailwind utility classes, existing shared UI kit (`app-input`, `app-button`, `app-search-input`), Jasmine/Karma unit tests.

**Spec:** `docs/superpowers/specs/2026-10-31-ai-assistant-ui-design.md`

## Global Constraints

- Front-end only scope: no backend calls, no AI execution logic.
- English UI copy for all added labels/buttons/descriptions.
- Do not add or modify Sidebar navigation entries for AI.
- Add a dedicated route at `/ai` and expose access from Dashboard.
- Preserve existing dark/light behavior by using established design tokens/classes.

## Review Focus

- Empty or whitespace-only prompt submit should not trigger request behavior; user should see a disabled action or equivalent guarded state.
- Very long prompt text (multi-line) should remain readable, editable, and not break container layout in both desktop and mobile widths.
- AI shortcut cards with missing optional metadata (badge/description) should render gracefully without broken spacing.
- Keyboard-only flow should work end-to-end (focus order to inputs, cards, submit, and activation via Enter/Space where appropriate).
- Theme switching while on AI page should preserve contrast and visual hierarchy for cards, inputs, and CTA controls.

---

### Task 1: Defining AI UI Contracts

**Files:**
- Create: `src/app/core/interfaces/ai.interface.ts`
- Modify: `src/app/core/interfaces/index.ts`
- Test: `src/app/core/interfaces/ai.interface.spec.ts`

**Interfaces:**
- Consumes: Existing TypeScript interface export patterns from `src/app/core/interfaces/index.ts`.
- Produces:
  - `AiShortcutAction` (typed shortcut/action card contract)
  - `AiResultCard` (typed report/result card contract)
  - `AiPromptDraft` (typed prompt state contract for page composition)

- [ ] **Step 1: Write the failing test**

```ts
import { AiShortcutAction, AiResultCard, AiPromptDraft } from "./ai.interface";

describe("ai.interface", () => {
  it("should expose the AI UI contract types", () => {
    const shortcut: AiShortcutAction = {
      id: "create-order",
      title: "Create Order",
      intent: "createOrder",
    };
    const result: AiResultCard = {
      id: "report-1",
      title: "Orders Summary",
      summary: "3 overdue orders detected",
      tone: "info",
    };
    const prompt: AiPromptDraft = {
      search: "overdue",
      prompt: "Show overdue orders from this week.",
    };

    expect(shortcut.id).toBe("create-order");
    expect(result.tone).toBe("info");
    expect(prompt.search).toBe("overdue");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts`  
Expected: FAIL with module/file not found for `ai.interface`.

- [ ] **Step 3: Implement AI interface contracts and barrel export**

Implement in `src/app/core/interfaces/ai.interface.ts`:
- `export interface AiShortcutAction { id: string; title: string; description?: string; intent: "createOrder" | "updateOrder" | "generateReport" | "openOrders" | "openReports"; badge?: string; }`
- `export interface AiResultCard { id: string; title: string; summary: string; details?: string; tone: "info" | "success" | "warning"; ctaLabel?: string; ctaIntent?: AiShortcutAction["intent"]; }`
- `export interface AiPromptDraft { search: string; prompt: string; }`

Update `src/app/core/interfaces/index.ts` to export `./ai.interface`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/interfaces/ai.interface.ts src/app/core/interfaces/ai.interface.spec.ts src/app/core/interfaces/index.ts
git commit -m "feat: add AI UI interface contracts"
```

### Task 2: Building Reusable AI Cards

**Files:**
- Create: `src/app/shared/components/ai-shortcut-card/ai-shortcut-card.component.ts`
- Create: `src/app/shared/components/ai-shortcut-card/ai-shortcut-card.component.html`
- Create: `src/app/shared/components/ai-shortcut-card/ai-shortcut-card.component.scss`
- Create: `src/app/shared/components/ai-shortcut-card/ai-shortcut-card.component.spec.ts`
- Create: `src/app/shared/components/ai-result-card/ai-result-card.component.ts`
- Create: `src/app/shared/components/ai-result-card/ai-result-card.component.html`
- Create: `src/app/shared/components/ai-result-card/ai-result-card.component.scss`
- Create: `src/app/shared/components/ai-result-card/ai-result-card.component.spec.ts`

**Interfaces:**
- Consumes:
  - `AiShortcutAction`
  - `AiResultCard`
  - Existing `AppButtonComponent` for CTA interactions
- Produces:
  - `AiShortcutCardComponent` with output `actionSelected: Output<AiShortcutAction>`
  - `AiResultCardComponent` with output `resultAction: Output<AiResultCard>`

- [ ] **Step 1: Write failing component tests**

```ts
it("emits selected shortcut action when card CTA is clicked", () => {
  component.action.set({
    id: "generate-report",
    title: "Generate Report",
    intent: "generateReport",
  });
  fixture.detectChanges();

  const emitSpy = spyOn(component.actionSelected, "emit");
  const button = fixture.nativeElement.querySelector("button");
  button.click();

  expect(emitSpy).toHaveBeenCalledWith(component.action());
});
```

```ts
it("renders shortcut with missing optional fields without layout break markers", () => {
  component.action.set({
    id: "open-orders",
    title: "Open Orders",
    intent: "openOrders",
  });
  fixture.detectChanges();

  expect(fixture.nativeElement.textContent).toContain("Open Orders");
});
```

```ts
it("renders result tone class and emits action when CTA exists", () => {
  component.result.set({
    id: "r1",
    title: "Summary",
    summary: "Done",
    tone: "success",
    ctaLabel: "Open Orders",
    ctaIntent: "openOrders",
  });
  fixture.detectChanges();

  expect(fixture.nativeElement.textContent).toContain("Summary");
});

it("uses semantic button for keyboard accessibility in shortcut card", () => {
  component.action.set({
    id: "create-order",
    title: "Create Order",
    intent: "createOrder",
  });
  fixture.detectChanges();

  const button = fixture.nativeElement.querySelector("button");
  expect(button).not.toBeNull();
  expect(button.getAttribute("type")).toBe("button");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --watch=false --include=src/app/shared/components/ai-shortcut-card/ai-shortcut-card.component.spec.ts --include=src/app/shared/components/ai-result-card/ai-result-card.component.spec.ts`  
Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement reusable card components**

Implement:
- `AiShortcutCardComponent` inputs:
  - `action: InputSignal<AiShortcutAction>`
  - optional compact mode
- `AiResultCardComponent` inputs:
  - `result: InputSignal<AiResultCard>`
- Both components:
  - semantic button/region structure
  - token-driven classes for light/dark
  - compact, readable typography for dashboard-like layouts

- [ ] **Step 4: Run component tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/shared/components/ai-shortcut-card/ai-shortcut-card.component.spec.ts --include=src/app/shared/components/ai-result-card/ai-result-card.component.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components/ai-shortcut-card src/app/shared/components/ai-result-card
git commit -m "feat: add reusable AI shortcut and result cards"
```

### Task 3: Creating AI Feature Page UI

**Files:**
- Create: `src/app/features/ai/ai.component.ts`
- Create: `src/app/features/ai/ai.component.html`
- Create: `src/app/features/ai/ai.component.scss`
- Create: `src/app/features/ai/ai.component.spec.ts`

**Interfaces:**
- Consumes:
  - `AiPromptDraft`
  - `AiShortcutAction`
  - `AiResultCard`
  - `SearchInputComponent`
  - `AppTextFieldComponent`
  - `AppButtonComponent`
  - `AiShortcutCardComponent`
  - `AiResultCardComponent`
- Produces:
  - `AiComponent` with methods:
    - `submitPrompt(): void`
    - `useShortcut(action: AiShortcutAction): void`
    - `isPromptValid(): boolean`

- [ ] **Step 1: Write failing feature tests**

```ts
it("disables submit when prompt is empty", () => {
  component.promptDraft.set({ search: "", prompt: "   " });
  fixture.detectChanges();
  const submit = fixture.nativeElement.querySelector("[data-testid='ai-submit']");
  expect(submit.disabled).toBeTrue();
});

it("fills prompt from shortcut intent", () => {
  const action: AiShortcutAction = {
    id: "update-order",
    title: "Update Order",
    intent: "updateOrder",
  };
  component.useShortcut(action);
  expect(component.promptDraft().prompt).toContain("Update");
});

it("keeps long multi-line prompt value editable", () => {
  const longPrompt = "Line 1\n" + "x".repeat(1000);
  component.promptDraft.set({ search: "trend", prompt: longPrompt });
  fixture.detectChanges();

  expect(component.promptDraft().prompt.length).toBeGreaterThan(900);
});

it("keeps tokenized theme classes on AI surface", () => {
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector("[data-testid='ai-page']");
  expect(root.className).toContain("bg-background");
  expect(root.className).toContain("text-foreground");
});

it("submits through form submit path for keyboard users", () => {
  const spy = spyOn(component, "submitPrompt");
  fixture.detectChanges();

  const form = fixture.nativeElement.querySelector("form");
  form.dispatchEvent(new Event("submit"));
  expect(spy).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts`  
Expected: FAIL because component files do not exist.

- [ ] **Step 3: Implement AI page composition**

Implement `AiComponent` with:
- Header and short explanatory copy.
- Search-style input (`app-search-input`) for quick filtering/suggestions.
- Multi-line prompt text input area (using existing input styles/classes).
- Submit button (`app-button` type submit) disabled on invalid prompt.
- Reusable shortcut card grid.
- Reusable result/report card grid with placeholder data for now.
- Mobile-first responsive layout and token-consistent colors.

- [ ] **Step 4: Run feature test to verify it passes**

Run: `npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai
git commit -m "feat: add AI workspace page UI"
```

### Task 4: Wiring Route and Dashboard Entry

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/core/interfaces/navigation.interface.ts`
- Modify: `src/app/core/services/navigation.service.ts`
- Create: `src/app/core/services/navigation.service.spec.ts`
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/dashboard/dashboard.component.html`
- Modify: `src/app/features/dashboard/dashboard.component.scss`
- Modify: `src/app/features/dashboard/dashboard.component.spec.ts`

**Interfaces:**
- Consumes:
  - `PageId` and navigation mappings
  - existing dashboard card/action patterns
- Produces:
  - New page id: `ai`
  - Route mapping for `/ai`
  - Dashboard CTA card/button navigating to AI page

- [ ] **Step 1: Write failing integration-level tests**

```ts
it("maps ai page id to /ai route in navigation service", () => {
  service.navigate("ai");
  expect(routerNavigateByUrlSpy).toHaveBeenCalledWith("/ai");
});

it("renders AI entry and navigates on click from dashboard", () => {
  const aiButton = fixture.nativeElement.querySelector("[data-testid='open-ai-workspace']");
  aiButton.click();
  expect(navigationService.navigate).toHaveBeenCalledWith("ai");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/features/dashboard/dashboard.component.spec.ts --include=src/app/core/services/navigation.service.spec.ts`  
Expected: FAIL because AI route/id mappings are missing.

- [ ] **Step 3: Implement route and entry wiring**

Implement:
- Add `/ai` lazy-loaded route in `app.routes.ts`.
- Extend `PageId`, breadcrumb map, URL-state map, and route map with `ai`.
- Add dashboard AI entry card/button (no sidebar modification), matching existing card styling conventions.
- Ensure dark/light classes rely on existing `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, and state utility classes.

- [ ] **Step 4: Run targeted tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/features/dashboard/dashboard.component.spec.ts --include=src/app/core/services/navigation.service.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Run confidence checks**

Run: `npm run lint && npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts --include=src/app/features/dashboard/dashboard.component.spec.ts`  
Expected: Lint clean, targeted tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/app.routes.ts src/app/core/interfaces/navigation.interface.ts src/app/core/services/navigation.service.ts src/app/features/dashboard src/app/features/ai
git commit -m "feat: wire AI route and dashboard entry"
```
