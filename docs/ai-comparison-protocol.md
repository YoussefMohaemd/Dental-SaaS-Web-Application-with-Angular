# Controlled AI Comparison Protocol

Status: **AWAITING HUMAN EXECUTION**  
Prepared on: 2026-09-26

This protocol is frozen before execution. No outputs or scores are pre-filled.

## 1) Locked controlled conditions

### 1.1 Frozen sanitized requirement text (same for all candidates)

Build a **Promo Banners** management slice with these required elements:

1. Reusable primary/secondary button component (with disabled and loading states).
2. Reusable component `PromoBannerCard` (title, discount, validity, status badge, enable/disable toggle).
3. Routed page `/promo-banners` reachable from navigation.
4. Header with title, record count, and primary action.
5. Toolbar with search input and status filter.
6. **Data table** view for banner records (sortable by at least status and validity).
7. **Confirmation dialog** for destructive or disabling actions.
8. Responsive layout (desktop/tablet/mobile).
9. Loading state and empty state.
10. In-memory fixture data service (minimum 8 records).
11. Build/test/a11y constraints:
   - green `npm run build`
   - green `npm test -- --watch=false --browsers=ChromeHeadless`
   - axe-core clean for the page
   - no horizontal overflow at 1440/768/375.

### 1.2 Exact base prompt

Use the exact prompt body from this file and inject section 1.1 verbatim for each candidate run. No extra requirement text may be added mid-run.

### 1.3 Locked execution parameters

| Parameter | Locked value |
| --- | --- |
| Tool + model | Same exact AI tool + model for all three runs (recorded before run #1) |
| Iteration limit | 3 |
| Time allowance | 60 minutes wall-clock per run |
| Run order | `react-kendo` → `react-mui` → `vue-vuetify` |
| Context bundle | Same files and same requirement package for all runs |
| Scoring rubric | 20/20/20/15/15/10 only (section 2) |

### 1.4 Anti-fabrication lock

- Empty slots remain empty until human execution.
- Missing captures must be marked `NOT CAPTURED — reason`.
- No synthetic screenshots, logs, or scores.

## 2) Scoring rubric (total = 100%)

| # | Criterion | Weight |
| --- | --- | ---: |
| 1 | Requirement understanding | 20% |
| 2 | UI/UX fit | 20% |
| 3 | Framework/library usage | 20% |
| 4 | Responsiveness and accessibility | 15% |
| 5 | Code quality | 15% |
| 6 | Manual corrections + hallucination resistance | 10% |
| | **Total** | **100%** |

The weighted-comparison matrix consumes this via:

`protocol_score / 100 × 15%`

## 3) Per-candidate runs

All code outputs are produced in candidate-specific sandbox projects (out of this repository). Only sanitized evidence artifacts are copied here.

### react-kendo

- Run date:
- Tool + model:
- Iterations used:
- Elapsed:
- Notes:

### react-mui

- Run date:
- Tool + model:
- Iterations used:
- Elapsed:
- Notes:

### vue-vuetify

- Run date:
- Tool + model:
- Iterations used:
- Elapsed:
- Notes:

## 4) Evidence slots

Evidence root: [`evidence/ai-comparison/`](../evidence/ai-comparison/)

Each candidate folder (`react-kendo`, `react-mui`, `vue-vuetify`) contains:

- `prompts.md`
- `initial-output.md`
- `corrected-output.md`
- `build-test-results.md`
- `a11y-findings.md`
- `hallucinated-apis.md`
- `manual-corrections.md`
- `effort-log.md`
- `scoresheet.md`
- `screenshots/README.md`

All are template slots only until executed by the human owner.
