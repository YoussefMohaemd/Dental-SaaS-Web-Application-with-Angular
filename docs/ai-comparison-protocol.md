# Controlled AI Comparison Protocol

Status: **AWAITING HUMAN EXECUTION** — this document and its evidence slots are prepared in advance. No scores, outputs, or results exist yet, and none may be entered until the controlled run is performed by the human owner.

Prepared: 2026-09-26. Everything in section 1 is **frozen**; it must not be edited after execution begins. Any change requires a new protocol version (v2) and a fresh run.

---

## 1. Locked controlled conditions (do not edit after start)

### 1.1 Frozen sanitized requirement text

> Build a **Promo Banners** management slice for this Angular dental SaaS:
>
> 1. A shared, reusable component `PromoBannerCard` that renders a campaign banner with title, discount label, validity range, status badge, and an enable/disable toggle.
> 2. A routed page `/promo-banners` registered in the app router and reachable from the sidebar navigation, containing:
>    - a page header with title, record count, and a "New Banner" primary action;
>    - a toolbar with a search field and a status filter (All / Active / Scheduled / Expired);
>    - a responsive grid of `PromoBannerCard` items (3 columns desktop, 2 tablet, 1 mobile);
>    - an empty state when filters match nothing;
>    - a loading state (skeleton or spinner) shown while data is "fetching".
> 3. In-memory data service with at least 8 fixture banners, consistent with the existing in-memory JSON service patterns.
> 4. Must satisfy: WCAG 2.1 A/AA (axe-core clean on the page), keyboard operable controls, no horizontal overflow at 1440/768/375, unit tests for the service and card component, and a green `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`.
>
> Reuse the existing design tokens, shared components, and conventions; do not redesign unrelated screens.

### 1.2 Exact prompt (verbatim)

```text
You are working in this Angular 21 repository (PrimeNG 21, Angular CDK 21, Tailwind CSS 4, signals-based components).

Implement the following requirement exactly. Stay inside the stated scope; do not touch unrelated screens.

REQUIREMENT (frozen):
[insert section 1.1 verbatim]

CONTEXT BUNDLE (fixed, see section 1.3): [attach or list exactly the files in 1.3]

Rules:
- Deliver working code in the repository's conventions (standalone components, signal inputs/outputs, Tailwind utility classes, design tokens from src/styles/tokens.scss).
- Report: (a) files you created/changed, (b) any API you were unsure about, (c) how to run build/tests.
- Time allowance: 60 minutes wall clock. Iteration limit: 3. Stop when the limit is reached.
```

### 1.3 Fixed context bundle (attach exactly these)

1. `README.md`
2. `src/styles/tokens.scss`
3. `src/styles/utilities.scss`
4. `src/app/app.routes.ts`
5. `src/app/core/layout/sidebar/sidebar.component.ts`
6. `src/app/features/clinics/clinics.component.ts` + `clinics.component.html` (exemplar routed feature page)
7. `src/app/shared/components/button/button.component.ts`
8. `src/app/shared/components/status-badge/status-badge.component.ts`
9. `src/app/shared/components/search-filter-toolbar/search-filter-toolbar.component.ts`
10. `src/app/core/services/` — one existing in-memory data service as pattern reference (file name recorded in the effort log at execution time)

Nothing else may be added to the bundle. If the AI asks for more context, that request is recorded as a finding, not granted.

### 1.4 Locked run parameters

| Parameter | Locked value |
| --- | --- |
| AI tool and model | **To be recorded by the human executor at run time** (same tool+model for initial and corrected passes) |
| Time allowance | 60 minutes wall clock per run |
| Iteration limit | 3 iterations |
| Base branch/state | `main` at commit recorded in the effort log |
| Machine/OS | Executor records OS + versions in the effort log |
| Scoring | Section 2 rubric only; no discretionary re-weighting |

---

## 2. Scoring rubric (weights exact, total = 100%)

Each criterion is scored 0–10, then multiplied by its weight. Sum of weighted scores = final protocol score out of 100.

| # | Criterion | Weight |
| --- | --- | ---: |
| 1 | Requirement understanding | 20% |
| 2 | UI/UX (visual fit with existing system) | 20% |
| 3 | Framework usage (Angular/PrimeNG/CDK/Tailwind conventions) | 20% |
| 4 | Responsiveness and accessibility | 15% |
| 5 | Code quality | 15% |
| 6 | Manual correction / hallucination resistance | 10% |
| | **Total** | **100%** |

Weight check: 20 + 20 + 20 + 15 + 15 + 10 = **100%**.

Guidance (locked):

- **Requirement understanding**: coverage of all numbered requirement items; nothing invented beyond scope.
- **UI/UX**: matches existing look (tokens, spacing, density); no visual redesign of unrelated screens.
- **Framework usage**: standalone components, signals, existing shared components, repo naming and file layout.
- **Responsiveness and accessibility**: axe-core clean at 1440/768/375, keyboard operable, no horizontal overflow.
- **Code quality**: typing, test coverage for stated items, build/test green, no dead code.
- **Manual correction / hallucination resistance**: number and severity of non-existent or misused APIs (e.g., calling methods/inputs that do not exist in the installed library versions); each hallucination is logged and reduces this score.

---

## 3. Capture templates (fill during execution; do not pre-fill)

All templates live as empty slots in `evidence/ai-comparison/`:

| Artifact | Slot file |
| --- | --- |
| Initial AI output (verbatim or exported transcript) | `evidence/ai-comparison/initial-output.md` |
| Corrected working output after manual iterations | `evidence/ai-comparison/corrected-output.md` |
| Screenshots (before/after, all three viewports) | `evidence/ai-comparison/screenshots/` |
| Build and test results (raw logs) | `evidence/ai-comparison/build-test-results.md` |
| Accessibility findings (axe output) | `evidence/ai-comparison/a11y-findings.md` |
| Hallucinated / invalid APIs encountered | `evidence/ai-comparison/hallucinated-apis.md` |
| Manual corrections applied (diff-level summary) | `evidence/ai-comparison/manual-corrections.md` |
| Elapsed effort, iteration count, run metadata | `evidence/ai-comparison/effort-log.md` |
| Completed rubric scoresheet (section 2) | `evidence/ai-comparison/scoresheet.md` |

Minimum required captures (from the task conditions): initial generated output, corrected working output, screenshots, build results, test results, accessibility findings, hallucinated/invalid APIs, manual corrections, elapsed effort, iteration count.

---

## 4. Mapping into the weighted matrix

- The protocol score (0–100) feeds the **15% AI-assisted line** of `docs/weighted-comparison-matrix.md` ("AI-Assisted Development Effectiveness").
- Contribution = `protocol_score / 100 × 15%` of the overall selection score.
- The matrix line stays **AWAITING HUMAN EXECUTION** until `evidence/ai-comparison/scoresheet.md` is completed by the human executor.
- No score may be written into the matrix without a completed scoresheet + effort log in `evidence/ai-comparison/`.

## 5. Anti-fabrication statement

Every field in section 3 must be produced by the actual controlled run. Empty slots stay empty; skipped captures are marked "NOT CAPTURED — reason" rather than filled with plausible-looking content. AI-assisted preparation of this protocol does not constitute execution of the comparison.
