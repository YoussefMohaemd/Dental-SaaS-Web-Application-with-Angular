# AI Chatbot UI Redesign (Front-end)

**Date:** 2026-10-31  
**Status:** Draft for approval  
**Scope:** Front-end only (no backend integration)

## 2026-11-01 visual refactor addendum

- Direction updated to an LLM-style conversation workspace:
  - cleaner shell
  - timeline-like transcript rows with role avatars
  - focused composer dock
- Reusable AI surfaces aligned to the same language:
  - `ai-shortcut-card` updated as compact action tiles
  - `ai-result-card` updated with matching tone treatments
- Copy style simplified to direct operational language.
- Added frontend-only architecture for next integration phase:
  - `ai-chat.facade.ts` as mock state/data interaction layer
  - dedicated UI components for history, messages, composer, and quick actions
  - mock conversations + quick-action data split into `ai-chat.mock.ts`
- Added product behaviors requested for phase 1:
  - chat history drawer with conversation switching
  - new chat creation without deleting previous history
  - welcome + role-based quick actions shown only for fresh conversations
  - fixed composer with Enter send / Shift+Enter newline behavior

## Intent and why

Replace the current AI page prompt panel with an operations-focused chatbot experience that feels like a real assistant conversation for dental lab staff. The page should support guided actions, static knowledge replies, and visible “thinking” behavior while preserving product trust boundaries (especially no delete execution from chat).

## Goals

1. Remove search input and remove results preview section from AI page.
2. Build a conversation-first chatbot UI (message timeline + composer + send).
3. Show assistant progress states (thinking/working) in-chat.
4. Support static, front-end knowledge responses:
   - company basics
   - services
   - service pricing
   - required standards for service submission
5. Respect user authorization context for allowed action intents.
6. Hard block delete intents in chatbot execution path, with guidance text on how to escalate.

## Non-goals

1. No API calls to LLM/backend.
2. No real order mutations from this page.
3. No sidebar navigation changes.

## Subject grounding

- **Subject:** Dental lab operations copilot inside a SaaS back-office.
- **Audience:** Staff, doctors, technicians, managers running order workflows.
- **Primary job:** Turn natural-language requests into safe, understandable, actionable next steps.

## Approaches considered

1. **A — Minimal chat shell:** simplest build and lowest visual weight, but weaker operational context.
2. **B — Operations assistant chat (selected):** role-aware responses, explicit safety boundary, reusable in-chat action cards.
3. **C — Split view chat + context panel:** strong discoverability but busier layout and less mobile focus.

**Selected direction:** B with A-level visual simplicity.

## Frontend design pass 1 (tokens + layout)

### Color palette (named)
- Ink Canvas: `#0F172A`
- Sterile Surface: `#F8FBFF`
- Surgical Blue: `#1D4ED8`
- Lab Teal: `#0F766E`
- Safety Amber: `#B45309`
- Quiet Graphite: `#334155`

### Type
- Keep project family stack, but apply distinct roles:
  - Display: stronger weight for chat title and assistant role labels.
  - Body: regular-weight for transcript readability.
  - Utility: restrained medium weight for metadata/chips.

### Layout concept
- Left-aligned transcript for scanning and operational clarity.
- One bold element only: assistant “thinking rail” treatment (animated dots + vertical accent spine).
- Composer pinned at bottom of card shell for chat-like muscle memory.

ASCII wireframe:

```
+------------------------------------------------------+
| AI Assistant (operations-aware)                      |
| "I can help with orders, reports, standards..."      |
|------------------------------------------------------|
| [User bubble]                                        |
| [Assistant bubble + thinking rail]                   |
| [Assistant info card(s) when relevant]               |
|                                                      |
| FAQ chips: [Services] [Pricing] [Standards] [...]    |
|------------------------------------------------------|
| [textarea prompt..............................] [Send]|
+------------------------------------------------------+
```

### Principles
- Conversation first, dashboard chrome second.
- Safety is visible in copy (“Delete is restricted from assistant actions.”).
- Reusable cards appear only when response needs structured output.
- Keep line lengths short and high readability under light/dark themes.

## Frontend design pass 2 (anti-generic revision)

Revisions made to avoid generic AI SaaS defaults:

1. **Removed card-grid hero language** and switched to transcript-led first impression.
2. **Avoided accent-word headline tricks**; used plain, operational language.
3. **Avoided repeated animated entrances**; only one purposeful motion: assistant thinking state.
4. **No decorative gradients**; structural contrast uses border rhythm and role-based bubble tone.

## Constraints

1. Must use existing Angular standalone patterns and existing design tokens.
2. Must remain fully usable in dark and light themes.
3. Must not execute delete operations from chat for any user role.
4. For delete requests, assistant must provide a clear escalation/how-to path.

## Builder-owned decisions

1. Introduce lightweight in-component mock intent parsing for front-end simulation.
2. Add message model/types for chat entries and states.
3. Reuse existing reusable components where they meaningfully fit; avoid UI clutter.
4. Update tests for chat behavior, delete blocking, and static FAQ responses.
