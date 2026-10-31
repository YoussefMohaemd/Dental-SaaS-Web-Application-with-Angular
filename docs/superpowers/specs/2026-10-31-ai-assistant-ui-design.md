# AI Assistant UI Design

**Date:** 2026-10-31  
**Status:** Approved  
**Scope:** Front-end only

## Intent and Why

Add a dedicated AI workspace UI that lets users submit prompts and view reusable shortcut/report-style result cards, without adding backend logic yet. The feature should fit the existing Angular app structure and visual language.

## Goals

1. Add a dedicated AI page at `/ai`.
2. Provide an input experience for AI requests:
   - search-style entry
   - multi-line prompt text input
   - submit button
3. Build reusable cards that the AI page can use for:
   - shortcuts/actions (for flows like create order, update order, reports)
   - report-style result summaries
4. Add entry to AI page from Dashboard (not Sidebar).
5. Keep dark/light theme support aligned with existing design tokens.

## Non-goals

1. No backend/API integration.
2. No AI execution logic.
3. No sidebar navigation changes.

## Constraints

1. Keep implementation in Angular standalone component patterns already used in the codebase.
2. Reuse existing shared UI components where sensible (`app-input`, `app-button`, `app-search-input`).
3. Use English UI copy.

## Approaches Considered

1. **Dashboard entry + dedicated AI page (selected):**
   - Best discoverability without increasing sidebar noise.
   - Scales cleanly for future AI workflows.
2. Dashboard-only embedded section:
   - Faster to add but less scalable and less focused.
3. Header entry + dedicated page:
   - Valid, but less contextual for operational workflows than dashboard entry.

## Builder-owned Decisions

1. Define AI UI interfaces and reusable card inputs/outputs in a focused interface file.
2. Create standalone reusable cards under shared components and consume them from AI page.
3. Add route and navigation wiring for `/ai` while preserving current behavior.
4. Extend dashboard with a clear AI launch card/CTA.
5. Add/adjust tests around routing and dashboard AI entry behavior.
