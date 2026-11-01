# AI Chatbot Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the AI Assistant page into a modern LLM-style chatbot UI with frontend-only mock conversations, chat history, new chat flow, role-aware quick actions, fixed composer, and responsive behavior.

**Architecture:** Keep `AiComponent` as the feature container and move chat UI responsibilities into focused standalone child components (history drawer, message list, quick actions, composer). Centralize frontend chat state and mock behavior in a dedicated feature-level state service/facade using Angular Signals. Keep API/backend untouched and use deterministic mock responses + existing authorization checks for role-aware visibility.

**Tech Stack:** Angular 21 standalone components, TypeScript strict mode, Angular Signals/computed/effect, existing AuthorizationService + NavigationService, SCSS + existing design tokens, shared AppButton component, Jasmine/Karma tests.

**Spec:** `docs/superpowers/specs/2026-10-31-ai-chatbot-ui-redesign-design.md` + user requirements snapshot `C:/Users/Youssef/AppData/Roaming/Code/agentSessionData/05ae1604-230c-4592-84f2-6214e762212b/attachments/42451ba2-9774-4c3d-9015-9c1dc1968850/Pasted text #1.txt`

## Global Constraints

- Frontend UI/UX only: no backend integration, no LLM integration, no real API requests.
- Use Angular 21 + standalone components + TypeScript + Signals (RxJS only when needed).
- Keep existing authorization system; do not change authentication/authorization logic.
- Keep existing project design tokens/system and avoid changing unrelated dashboard pages.
- Split chatbot concerns into reusable components; avoid monolithic single-component implementation.
- Avoid `any`, avoid duplicate code, avoid adding new dependencies unless strictly necessary.
- Preserve existing features and avoid regressions outside chatbot scope.

## Review Focus

- History switching with long message lists: selecting any old conversation should render its latest state and keep composer stable.
- Composer keyboard behavior: Enter sends, Shift+Enter new line, blank input rejected, focus restored after send.
- Permission filtering drift: quick actions must hide disallowed actions and remain consistent when opening new/old chats.
- Scroll anchoring: newest message must remain visible without being hidden behind fixed input on desktop/mobile.
- Drawer behavior under narrow screens: history opens/closes accessibly, no horizontal overflow, and current chat remains visually clear.

---

### Task 1: Defining Chat Contracts and Mock Data Sources

**Files:**
- Modify: `src/app/core/interfaces/ai.interface.ts`
- Modify: `src/app/core/interfaces/ai.interface.spec.ts`
- Modify: `src/app/core/interfaces/index.ts`
- Create: `src/app/features/ai/data/ai-chat.mock.ts`

**Interfaces:**
- Consumes:
  - `DentalCapability` string values used by `AuthorizationService.has(...)`.
  - Existing `AiShortcutAction`/`AiResultCard` contracts.
- Produces:
  - `AiConversationSummary` with `{ id: string; title: string; updatedAt: string }`
  - `AiConversation` with `{ id: string; title: string; updatedAt: string; messages: AiChatMessage[]; showWelcomeActions: boolean }`
  - `AiQuickAction` extending action metadata with mock prompt and optional capability gate.
  - Expanded `AiActionIntent` to include search/report/order/patient intents required by quick actions.
  - Mock factories in `ai-chat.mock.ts`:
    - `createInitialConversations(): AiConversation[]`
    - `AI_QUICK_ACTIONS: readonly AiQuickAction[]`
    - `AI_FAQ_PROMPTS: Record<AiFaqTopic, string>`

- [ ] **Step 1: Write the failing interface/mock tests**

```ts
it("should type conversation summaries and quick actions", () => {
  const conversation: AiConversation = {
    id: "chat-1",
    title: "New conversation",
    updatedAt: "2026-11-01T10:00:00Z",
    showWelcomeActions: true,
    messages: [],
  };
  expect(conversation.showWelcomeActions).toBeTrue();
});

it("should expose seeded mock conversations", () => {
  const seeded = createInitialConversations();
  expect(seeded.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL with missing chat conversation/quick-action types or missing mock exports.

- [ ] **Step 3: Implement chat contracts and mock source file**

Implement the new exported interfaces/types in `ai.interface.ts` and create `ai-chat.mock.ts` as the only source of static mock conversations/actions/messages so presentation components stay data-source agnostic.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/interfaces/ai.interface.ts src/app/core/interfaces/ai.interface.spec.ts src/app/core/interfaces/index.ts src/app/features/ai/data/ai-chat.mock.ts
git commit -m "feat: add AI chatbot conversation contracts and mock sources"
```

### Task 2: Building Reusable Chat UI Components

**Files:**
- Create: `src/app/features/ai/components/ai-chat-history/ai-chat-history.component.ts`
- Create: `src/app/features/ai/components/ai-chat-history/ai-chat-history.component.html`
- Create: `src/app/features/ai/components/ai-chat-history/ai-chat-history.component.scss`
- Create: `src/app/features/ai/components/ai-chat-history/ai-chat-history.component.spec.ts`
- Create: `src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.ts`
- Create: `src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.html`
- Create: `src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.scss`
- Create: `src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts`
- Create: `src/app/features/ai/components/ai-chat-composer/ai-chat-composer.component.ts`
- Create: `src/app/features/ai/components/ai-chat-composer/ai-chat-composer.component.html`
- Create: `src/app/features/ai/components/ai-chat-composer/ai-chat-composer.component.scss`
- Create: `src/app/features/ai/components/ai-chat-composer/ai-chat-composer.component.spec.ts`
- Create: `src/app/features/ai/components/ai-quick-actions/ai-quick-actions.component.ts`
- Create: `src/app/features/ai/components/ai-quick-actions/ai-quick-actions.component.html`
- Create: `src/app/features/ai/components/ai-quick-actions/ai-quick-actions.component.scss`
- Create: `src/app/features/ai/components/ai-quick-actions/ai-quick-actions.component.spec.ts`

**Interfaces:**
- Consumes:
  - `AiConversationSummary`, `AiChatMessage`, `AiQuickAction`.
  - Existing shared `AppButtonComponent`, `AiShortcutCardComponent`, `AiResultCardComponent`.
- Produces:
  - `AiChatHistoryComponent` outputs: `selectConversation(id: string)`, `closeHistory()`, `newChat()`.
  - `AiChatMessagesComponent` inputs: message list + loading flags; outputs: `copyMessage(messageId: string)`, `actionSelected(action)`, `scrollToLatest()`.
  - `AiChatComposerComponent` outputs: `submitPrompt(prompt: string)` with Enter/Shift+Enter behavior.
  - `AiQuickActionsComponent` outputs: `actionInvoked(action: AiQuickAction)`.

- [ ] **Step 1: Write failing component tests**

```ts
it("history should highlight active conversation and emit selection", () => { /* ... */ });
it("composer should send on Enter and keep newline on Shift+Enter", () => { /* ... */ });
it("messages should emit copy action for assistant message", () => { /* ... */ });
it("quick actions should render provided actions and emit selected action", () => { /* ... */ });
```

- [ ] **Step 2: Run tests to verify they fail**

Run:  
`npm run test -- --watch=false --include=src/app/features/ai/components/ai-chat-history/ai-chat-history.component.spec.ts --include=src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts --include=src/app/features/ai/components/ai-chat-composer/ai-chat-composer.component.spec.ts --include=src/app/features/ai/components/ai-quick-actions/ai-quick-actions.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL because components/files do not exist yet.

- [ ] **Step 3: Implement reusable components**

Implement focused standalone components with SCSS that follows existing tokens and responsive patterns, including markdown-ish rendering support (headings/lists/tables/code blocks) in message display and fixed-footer-friendly structure.

- [ ] **Step 4: Run tests to verify they pass**

Run the same command from Step 2.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/components
git commit -m "feat: add reusable AI chat history, messages, composer, and quick actions components"
```

### Task 3: Implementing Frontend Chat State Facade

**Files:**
- Create: `src/app/features/ai/state/ai-chat.facade.ts`
- Create: `src/app/features/ai/state/ai-chat.facade.spec.ts`

**Interfaces:**
- Consumes:
  - `AuthorizationService.has(capability: DentalCapability): boolean`
  - `NavigationService.navigate(page: PageId, params?: NavParams): void`
  - Mock sources from `ai-chat.mock.ts`
- Produces:
  - Signals/computed:
    - `conversations`, `activeConversationId`, `activeConversation`, `messages`
    - `isResponding`, `historyOpen`, `canSend`, `visibleQuickActions`
  - Methods:
    - `toggleHistory()`, `closeHistory()`, `openConversation(id: string)`, `startNewChat()`
    - `updateDraft(value: string)`, `submitPrompt(prompt?: string)`, `runQuickAction(action: AiQuickAction)`
    - `copyAssistantMessage(messageId: string)`, `scrollToLatest()`, `clearCurrentConversation()`

- [ ] **Step 1: Write failing facade tests**

```ts
it("startNewChat should keep history and reset active conversation to welcome state", () => { /* ... */ });
it("submitPrompt should append user + thinking + assistant and clear welcome actions", fakeAsync(() => { /* ... */ }));
it("delete intent should always return safe guidance text", fakeAsync(() => { /* ... */ }));
it("visibleQuickActions should filter by authorization capabilities", () => { /* ... */ });
it("openConversation should switch message timeline and close history on mobile flow", () => { /* ... */ });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --watch=false --include=src/app/features/ai/state/ai-chat.facade.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL with missing facade implementation.

- [ ] **Step 3: Implement `AiChatFacade`**

Implement deterministic frontend chat state and mock-response resolver with explicit delete-blocking precedence, role-aware action filtering, and chat history switching without backend calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --watch=false --include=src/app/features/ai/state/ai-chat.facade.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/state/ai-chat.facade.ts src/app/features/ai/state/ai-chat.facade.spec.ts
git commit -m "feat: add AI chatbot frontend state facade"
```

### Task 4: Integrating Container Layout and Feature Wiring

**Files:**
- Modify: `src/app/features/ai/ai.component.ts`
- Modify: `src/app/features/ai/ai.component.html`
- Modify: `src/app/features/ai/ai.component.scss`
- Modify: `src/app/features/ai/ai.component.spec.ts`

**Interfaces:**
- Consumes:
  - `AiChatFacade` public signals/methods.
  - New child components from Task 2.
- Produces:
  - Container-level layout with:
    - Header actions (new chat, open/close history, clear conversation, scroll to latest)
    - Independent scroll message region
    - Fixed bottom composer
    - Responsive history drawer/sidebar
    - Welcome + quick actions visible once for fresh chat

- [ ] **Step 1: Write failing integration tests**

```ts
it("should toggle chat history drawer from header action", () => { /* ... */ });
it("should start new chat and show welcome actions once", () => { /* ... */ });
it("should keep fixed composer and page-flow message container classes", () => { /* ... */ });
it("should send prompt via Enter and keep Shift+Enter as newline behavior through composer", () => { /* ... */ });
it("should switch to selected historical conversation messages", () => { /* ... */ });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: FAIL against old container behavior.

- [ ] **Step 3: Implement container wiring and stylesheet refactor**

Wire the facade into `AiComponent`, integrate child components, and apply responsive LLM-style layout with fixed composer and overflow-safe message area using `flex`, `min-height: 0`, and dedicated `overflow-y`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --watch=false --include=src/app/features/ai/ai.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/ai/ai.component.ts src/app/features/ai/ai.component.html src/app/features/ai/ai.component.scss src/app/features/ai/ai.component.spec.ts
git commit -m "feat: integrate full AI chatbot UI redesign container"
```

### Task 5: Verification, Regression Guardrails, and Spec Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-10-31-ai-chatbot-ui-redesign-design.md`

**Interfaces:**
- Consumes: All feature code from Tasks 1-4.
- Produces: Verified deliverable and synchronized documentation of final UI scope.

- [ ] **Step 1: Write/adjust tests for edge regressions from Review Focus**

Add/extend specs to cover:
- history switching with long timeline
- permission-filtered quick actions
- keyboard send/newline behavior
- delete-intent hard block precedence
- mobile/drawer class toggling behavior

- [ ] **Step 2: Run targeted chatbot suite**

Run:  
`npm run test -- --watch=false --include=src/app/core/interfaces/ai.interface.spec.ts --include=src/app/features/ai/state/ai-chat.facade.spec.ts --include=src/app/features/ai/components/ai-chat-history/ai-chat-history.component.spec.ts --include=src/app/features/ai/components/ai-chat-messages/ai-chat-messages.component.spec.ts --include=src/app/features/ai/components/ai-chat-composer/ai-chat-composer.component.spec.ts --include=src/app/features/ai/components/ai-quick-actions/ai-quick-actions.component.spec.ts --include=src/app/features/ai/ai.component.spec.ts --browsers=ChromeHeadless --progress=false`  
Expected: PASS with zero failures.

- [ ] **Step 3: Run TypeScript build**

Run: `npm run build`  
Expected: PASS (exit code 0).

- [ ] **Step 4: Update spec addendum with final component map and behavior notes**

Document implemented child components, frontend-only mock state strategy, and the LLM-ready extension points.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-10-31-ai-chatbot-ui-redesign-design.md
git commit -m "docs: sync AI chatbot redesign spec with implemented frontend architecture"
```
