# AI Chatbot UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current AI prompt page with a conversation-first operations chatbot UI that includes role-aware responses, static knowledge replies, visible thinking state, and hard delete blocking.

**Architecture:** Rebuild `AiComponent` around a transcript model (`user`, `assistant`, `thinking`, optional action cards) and a single composer input. Keep interactions front-end simulated through deterministic intent parsing that checks authorization capabilities and always rejects delete execution. Preserve existing route/dashboard entry and adapt styles to a distinct but token-compatible chat shell.

**Tech Stack:** Angular 21 standalone components, TypeScript signals/computed, existing shared button/input components, Jasmine/Karma tests, Tailwind utility classes + component SCSS.

**Spec:** `docs/superpowers/specs/2026-10-31-ai-chatbot-ui-redesign-design.md`

## Global Constraints

- Front-end only scope: no backend calls and no real order mutations from chatbot.
- Remove search input and remove results preview section from AI page.
- Chatbot must show visible thinking/working state in transcript.
- Static FAQ responses must cover company basics, services, pricing, and submission standards.
- Chatbot must respect user authorization context for allowed intents.
- Delete operations must be blocked from chatbot execution path for every role, with escalation guidance text.
- Keep standalone Angular patterns and preserve dark/light usability with existing token system.

## Review Focus

- Long conversation history should remain readable and scrollable without clipping message bubbles on small screens.
- Repeated rapid submits should not produce duplicated thinking placeholders or interleaved state corruption.
- Ambiguous prompts that mention “remove/archive/delete” should consistently trigger delete-safe guidance, not execution-like responses.
- Capability fallback paths (user without explicit capabilities array) should still produce coherent permission-aware responses.
- Theme switching during active chat should preserve contrast and role hierarchy (user bubble vs assistant bubble vs thinking state).

---

### Task 1: Defining Chat Transcript Contracts

**Files:**
- Modify: `src/app/core/interfaces/ai.interface.ts`
- Modify: `src/app/core/interfaces/ai.interface.spec.ts`
- Modify: `src/app/core/interfaces/index.ts`

**Interfaces:**
- Consumes: Existing `AiShortcutAction`, `AiPromptDraft` conventions.
- Produces:
  - `AiChatRole = "user" | "assistant" | "thinking"`
  - `AiChatMessage` with `{ id: string; role: AiChatRole; text: string; createdAt: string; actions?: AiShortcutAction[] }`
  - `AiFaqTopic = "company" | "services" | "pricing" | "standards"`

- [ ] **Step 1: Write the failing test**

```ts
it("should type AI chat message with role and optional actions", () => {
  const message: AiChatMessage = {
    id: "m1",
    role: "assistant",
    text: "I can help with orders and reports.",
    createdAt: "2026-10-31T12:00:00Z",
  };
  expect(message.role).toBe("assistant");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL with missing type(s) in `ai.interface.ts`.

- [ ] **Step 3: Implement chat contracts in `ai.interface.ts`**

Add `AiChatRole`, `AiChatMessage`, and `AiFaqTopic` exports while preserving existing reusable card contracts.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/interfaces/ai.interface.ts src/app/core/interfaces/ai.interface.spec.ts src/app/core/interfaces/index.ts
git commit -m "feat: add AI chat transcript interfaces"
```

### Task 2: Rebuilding AI Page as Chatbot UI

**Files:**
- Modify: `src/app/features/ai/ai.component.ts`
- Modify: `src/app/features/ai/ai.component.html`
- Modify: `src/app/features/ai/ai.component.scss`
- Modify: `src/app/features/ai/ai.component.spec.ts`

**Interfaces:**
- Consumes:
  - `AuthorizationService.has(capability: DentalCapability): boolean`
  - `AiChatMessage`, `AiFaqTopic`, `AiShortcutAction`
  - `AppButtonComponent`
- Produces:
  - `submitPrompt(): void`
  - `appendUserMessage(prompt: string): void`
  - `appendThinkingMessage(): string` (returns placeholder id)
  - `resolveAssistantReply(prompt: string): AiChatMessage`
  - `isDeleteIntent(prompt: string): boolean`

- [ ] **Step 1: Write failing feature tests**

```ts
it("should not render search input and results preview section", () => {
  expect(fixture.nativeElement.querySelector("app-search-input")).toBeNull();
  expect(fixture.nativeElement.textContent).not.toContain("Results Preview");
});

it("should append thinking then assistant response on submit", () => {
  component.promptDraft.set({ prompt: "show services", search: "" });
  component.submitPrompt();
  expect(component.messages().some((m) => m.role === "assistant")).toBeTrue();
});

it("should block delete intent and show escalation guidance", () => {
  component.promptDraft.set({ prompt: "delete order ORD-44", search: "" });
  component.submitPrompt();
  const last = component.messages().at(-1);
  expect(last?.text.toLowerCase()).toContain("can't delete");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL because current UI/logic still uses search/results pattern.

- [ ] **Step 3: Implement chatbot page and response simulation**

Implement transcript-first UI and logic:
- message list with user/assistant/thinking roles
- composer textarea + send action
- static FAQ chips for company/services/pricing/standards
- intent-based replies with capability-aware responses
- delete-intent hard deny message with director escalation steps
- optional reusable action cards embedded only when response needs structure

- [ ] **Step 4: Run feature tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/ai.component.ts src/app/features/ai/ai.component.html src/app/features/ai/ai.component.scss src/app/features/ai/ai.component.spec.ts
git commit -m "feat: redesign AI page as operations chatbot"
```

### Task 3: Finalizing Integration and Verification

**Files:**
- Modify: `src/app/core/services/navigation.service.spec.ts`
- Modify: `src/app/features/dashboard/dashboard.component.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-31-ai-chatbot-ui-redesign-design.md` (if implementation-driven wording adjustments are needed)

**Interfaces:**
- Consumes: Existing route `/ai` wiring and dashboard AI entry.
- Produces: Verified route behavior + preserved dashboard entry behavior after chatbot redesign.

- [ ] **Step 1: Write/adjust failing integration tests for AI route and entry behavior**

```ts
it("resolves /ai url to ai currentPage", () => {
  // emit NavigationEnd('/ai') and assert currentPage()
});

it("dashboard AI entry still navigates to ai", () => {
  // click dashboard CTA and assert navigate('ai')
});
```

- [ ] **Step 2: Run tests to verify expected failures (if any)**

Run: `npm run test -- --watch=false --include=src/app/core/services/navigation.service.spec.ts --include=src/app/features/dashboard/dashboard.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: Any failure should correspond to mismatched selectors/behavior introduced by redesign.

- [ ] **Step 3: Align code/tests and rerun targeted verification**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --include=src/app/features/ai/ai.component.spec.ts --include=src/app/core/services/navigation.service.spec.ts --include=src/app/features/dashboard/dashboard.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 4: Run lint/type verification**

Run: `npm run lint`  
Expected: PASS (no TS errors).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/services/navigation.service.spec.ts src/app/features/dashboard/dashboard.component.spec.ts docs/superpowers/specs/2026-10-31-ai-chatbot-ui-redesign-design.md
git commit -m "test: verify AI chatbot route and dashboard entry"
```
