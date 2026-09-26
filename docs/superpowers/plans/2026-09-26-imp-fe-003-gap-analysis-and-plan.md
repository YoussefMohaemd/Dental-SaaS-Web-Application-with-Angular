# IMP-FE-003 Gap Analysis and Implementation Plan v2 (Angular)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the remaining gaps between the current Angular POC and IMP-FE-003 v1.1 Definition of Done â€” dead code, disabled-token consumption, missing tests, documentation defects, and stale/non-reproducible evidence â€” without changing the approved Angular stack, and record every remaining human-gated item honestly.

**Architecture:** Part 1 is a refreshed audit of the tree as of `dd631ae` + verified gate runs (lint 0, tests 357/357). Part 2 is a 9-task execution plan: code correctness first (dead code, tokens, tests), then documentation corrections, then a single evidence refresh driven by a repeatable capture script, then a final DoD walk. No library changes, no UI redesign, no React/Vue scaffolding, no fabricated evidence.

**Tech Stack:** Angular 21, TypeScript 5.9, Signals + RxJS, PrimeNG 21, Taiga UI 4, Angular CDK 21, Tailwind CSS 4, Storybook 10 (angular-vite), Karma/Jasmine (`npm test`), Playwright + axe-core (evidence capture), tsc (`npm run lint`).

**Spec:** IMP-FE-003 v1.1 task brief (provided in the assignment). Requirements are mirrored line-by-line in Part 1 of this plan so the plan travels with the spec. Supersedes `docs/superpowers/plans/2026-09-26-imp-fe-003-gap-analysis-and-plan.md` (v1), whose Part 1 audit is now stale: Tasks 1â€“9 and most of 11â€“15 of that plan were executed in commit `dd631ae` (2026-09-26 16:47), but its checkboxes were never updated.

---

## Global Constraints

- Approved stack only: Angular 21, TypeScript, Signals + RxJS, PrimeNG, Taiga UI, Tailwind, Angular CDK. **No React/Vue code, no migration suggestions, no new runtime libraries.**
- **Never fabricate**: AI outputs, scores, screenshots, test results, a11y results, approvals, contributors. Pending stays marked pending. The AI-comparison slots in `evidence/ai-comparison/` must remain empty until a human executes them.
- No credentials, tokens, or real patient/customer/order data in code, screenshots, prompts, or logs. Sanitized data only (`public/data/*.json`).
- **Test baseline: 357 passing** (verified this session: `TOTAL: 357 SUCCESS`, exit 0). Tasks may only grow this number **except** Task 1, which may delete only the tests whose sole subject is a removed dead symbol â€” each deletion named in that commit body.
- Gates for every code task: `npm run lint` + `npm test -- --watch=false --browsers=ChromeHeadless`. Full gate set (build, build-storybook, axe, screenshots) at Task 8.
- **`rg` is not installed on this machine.** Use `findstr /s /n /c:"â€¦" src\app\â€¦` from PowerShell, or the Grep tool. Verification commands below use `findstr`.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`), one per task; never commit `node_modules/`, `dist/`, `storybook-static/`, `coverage/`.
- No unrelated UI changes. The only expected visual diffs in this plan are named in Task 2 (disabled opacity standardization) and are re-captured in Task 8.
- POC classification: nothing in this plan approves a production framework, license, migration, or security model.

## Review Focus

Five failure modes most likely to bite, each pinned to the task that owns it:

1. **Dead-code removal deletes a still-referenced symbol** (models barrel, `utilities.scss` classes used only via `@extend`, `compareValues`) â€” pinned by Task 1 Step 2's per-symbol grep evidence and its four-gate verification (lint + test + build + build-storybook).
2. **Dead-test deletion masks a real regression** â€” pinned by Task 1 Step 3: only tests whose *sole assertion subject* is a removed symbol may be deleted, and the commit body must list each deleted test name and the surviving equivalent coverage.
3. **Disabled-token swap changes visuals app-wide** (opacity 0.7/0.4 â†’ 0.5 on three buttons) â€” pinned by Task 2 Step 5 naming exactly the three templates changed, and Task 8 recapturing screenshots afterwards.
4. **Evidence script captures the wrong state or an unauthenticated page** â€” pinned by Task 8 Step 6: every output file must exist, axe must report 0 violations across the route list, and the four orders state PNGs must differ byte-wise (proving four distinct states were captured).
5. **Documentation "corrections" introduce new false claims** â€” pinned by Task 5 Step 7 (re-derive matrix arithmetic from the score cells) and Task 6 Step 5 (resolve every cited path and re-grep every claimed consumer).

---

# PART 1 â€” GAP ANALYSIS

Audit date 2026-09-26 against `dd631ae`, working tree clean. Gates re-run this session: `npm run lint` â†’ exit 0; `npm test -- --watch=false --browsers=ChromeHeadless` â†’ **TOTAL: 357 SUCCESS**, exit 0.

**Stack-alignment statement (per owner instruction â€” not issues):** Angular instead of React; PrimeNG instead of KendoReact/Material UI; Taiga UI for lightweight controls; Angular CDK for behavior/a11y/overlays; Tailwind for layout/theming. The spec's "final library uses React + TypeScript with KendoReact or MUI" and "three runnable spikes" are satisfied by **recorded deviations DEV-1/DEV-2** (`docs/scope-exceptions.md`), not by rewriting.

**Core-scope status summary (16 line items below):** DONE 3 Â· PARTIAL 9 Â· WRONG 2 Â· MISSING 2. OPTIONAL items are listed in Â§1.9 and are not counted against the core.

## 1.1 Core scope requirements

| # | Requirement (spec Â§4) | Status | Evidence | Gap | Required action |
|---|---|---|---|---|---|
| 1 | UI inventory â‰¥20 components, purpose/variants/reuse priority/observed inconsistencies, sanitized provenance | PARTIAL | `docs/ui-component-inventory.md` â€” 40 rows, provenance Â§`7-15`, all 44 cited paths resolve, 3 previously-false claims now true (orders uses `app-data-table-toolbar`, table-feedback has `error` mode, order-workflow has no drag-drop) | "Observed Inconsistency" column still holds usage notes for most rows (e.g. `:21` "already reusable", `:25` "Orders/patients/doctors tables"); row `:25` under-reports consumers | Task 6 |
| 2 | Weighted comparison matrix: 100%, AI-15% **inside** the table, justification per score, tech-vs-library separation | **WRONG** | `docs/weighted-comparison-matrix.md:11-21` â€” 8 criteria = 100% with AI 15% in-table âœ“; 3 candidates âœ“; all 21 scored cells carry justification + citation âœ“ | `:42-44` provisional subtotals are arithmetically wrong: doc says 58.0/69.0/62.0, re-derived from `:29-35` = **59.0/68.0/62.5** (verified) | Task 5 Step 1 |
| 3 | Telerik/KendoReact licensing, free/premium limits, trial, long-term dependency risk, official current sources | DONE | `docs/licensing-review.md` â€” free-vs-premium, trial, license-key workflow, npm governance, DEV-1 implication; 8 official URLs verified HTTP 200 this session | â€” | â€” |
| 4 | Three runnable spikes (React+KendoReact, React+MUI, Vue3+Vuetify) | MISSING â†’ **decided deviation DEV-2** | `docs/scope-exceptions.md:11` records the decision + rationale + approver placeholder | Mentor sign-off still pending; no spike code (by decision) | Task 5 Step 4 (sign-off stays human) |
| 5 | Per-candidate spike content (button, search input, status indicator, data table, confirmation dialog, responsive layout) | MISSING â†’ **DEV-2 + frozen AI requirement** | The six elements are frozen as the AI comparison requirement in `docs/ai-comparison-protocol.md:14-20` (5 of 6 explicit â€” **"button" is never named**, see #12) | Same deviation as #4; protocol must name all six elements | Task 5 Step 5 |
| 6 | Central design tokens: color, typography, spacing, radius, shadows, focus, **disabled state**, breakpoints | PARTIAL | `src/styles/tokens.scss` â€” disabled tokens at `:26-29`, `:53-56`, `:268-271`, `:309-312`; global focus fixed: `theme.scss:267-270` `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }` (invalid `ring:`/`ring-offset:` gone); dual namespace documented `tokens.scss:214` | The 3 basic components bypass the disabled token: `button.component.ts:63` `disabled:opacity-50`, `input.component.ts:78,82` `opacity-50`, `select.component.ts:67,69` `opacity-50`; `enterprise-paginator.component.scss:166` `opacity: 0.45`; 3 feature templates use `disabled:opacity-50/70/40` | Task 2 |
| 7 | Component architecture doc: folder structure, naming, wrapper rules, interfaces, documentation approach | PARTIAL | `docs/component-architecture.md` â€” all 5 sections present (`:3, :28, :58, :78, :90`), naming table covers all 8 required components and matches the code | Â§3 never states that Tailwind/inline styles own the visuals of the Taiga directives it imports (`tuiButton`/`tuiStatus` are overridden) â€” the double-styling-system decision is undocumented | Task 5 Step 6 |
| 8 | Final reusable component POC + responsive Order Management demo | DONE | 8 required components exist with spec class names; `/orders` responsive (Tailwind `sm:`/`lg:`, `overflow-x`, reduced-motion guard); 3-viewport evidence | Evidence freshness tracked in #15 | â€” |
| 9 | Storybook examples: â‰¥2 basic, â‰¥1 composite, â‰¥1 business | DONE | 8 story files / 38 stories / 8 docs pages, all 8 tracked in git; Basic(4)+Composite(2)+Business(2); `preview.ts` a11y `test: 'error'`; no `latest` deps | Build log and screenshots stale â€” tracked in #15 | Task 8 |
| 10 | Automated tests: each basic component, button interaction, input validation, filter interaction, loading/empty | PARTIAL | 56 specs / **357 tests, all green** (verified this session); no fit/xit/skip/commented tests; button interaction 12, filter interaction 13, loading/empty covered (orders state tests `orders.component.spec.ts:187-254`) | Input validation: display + `aria-invalid` + `required` asserted (`input.component.spec.ts:59,129`) but **no `aria-describedby` linkage test** and **no form/validator round-trip**; `order-summary-card` spec has 1 test and sets 2 dead inputs; interceptor asserts `has()` not the `Bearer` value; orders spec has **0 adoption assertions** (no query for `app-data-table-toolbar`/`app-status-badge`/`app-empty-state`) | Tasks 3, 4 |
| 11 | Accessibility checks: keyboard, focus, labels, semantics, forms, dialogs, tables, states, errors, disabled, breakpoints | PARTIAL | Code fixes landed: `status-badge.component.html:6-7` `role="status"`+`aria-label`; `search-filter-toolbar.component.html:16` accessible name via `searchAriaLabel`; `workflow-timeline.component.html:16` `aria-current="step"`; sortable headers keyboard-operable (`c269831`); dialog focus trap `entity-dialog.component.html:27` | **Evidence UNVERIFIED**: `evidence/accessibility/axe-report.json` generated 09:29Z, *before* the 16:47 commit that introduced these fixes; `keyboard-walkthrough-checklist.md:38` claims "336/336"; `keyboard-walkthrough.json:110-113` records an input with `label: ""`; 8 checklist rows honestly marked "requires human validation" | Task 8 (re-run) + Task 4 (label fix if found) |
| 12 | Controlled AI-output comparison: AI = 15% of the matrix; same tool/model/requirement/context/time/iterations for every candidate; initial + corrected outputs, prompts, screenshots, build/test, a11y, hallucinations, corrections, elapsed effort, iteration count | PARTIAL | `docs/ai-comparison-protocol.md` â€” base prompt locked `:29-31`, conditions `:33-42` (3 iterations, 60 min, fixed run order), rubric 20/20/20/15/15/10 = 100% `:50-60`, anti-fabrication `:44-48`; `evidence/ai-comparison/` = 3 partitions Ã— 9 empty templates + `screenshots/`, all marked `AWAITING HUMAN EXECUTION`, 0 PNGs, scoresheets unfilled â€” **no fabrication detected** | Frozen requirement never says **"button"** (5 of 6 elements explicit); Â§3 per-candidate runs are one table, not per-candidate sections with tool/model/date/iteration fields; 8 stray pre-partition duplicates sit in the evidence root; 3 `prompts.md` files contain an invalid UTF-8 byte (`0x97`) | Task 5 Step 5 (protocol), Task 7 (pack hygiene) |
| 13 | AI score used as one factor alongside licensing, maintainability, a11y, technical suitability, team fit, dependency risk; never decisive alone | PARTIAL | Formula `protocol_score / 100 Ã— 15%` in matrix `:36` and protocol `:64`; recommendation states the score is PENDING with no invented number (`docs/final-recommendation.md:26-34`) | Score cannot exist until the human runs execute â€” DoD item stays open by design | Human execution (recorded, never fabricated) |
| 14 | Final recommendation + 10â€“15 minute demo/presentation | PARTIAL | `docs/final-recommendation.md` (recommendation, evidence basis, risk register, "not approved" section) + `docs/demo-script.md` (~12â€“16 min, routes `/login`, `/orders`, Storybook; all claims verified against code) | Recommendation has **no "Next validation steps" section** (open items live only in demo-script `:62-65`); live presentation not yet delivered | Task 5 Step 7; delivery is human |
| 15 | Evidence artifacts fresh, attributable, and reproducible | **WRONG** | Everything under `evidence/` was committed at 12:33â€“12:43, but `dd631ae` changed **67 src files at 16:47**; `evidence/tests/test.log` says **336** while the tree has **357** (README `:68` and `test-matrix:7` say 357 â€” two "truths" in one repo); `build-storybook.log` evidences only **5 of 8** story chunks and a removed mdx glob; `lint.log` is 15 bytes (`EXIT CODE: 0`) with no command or date; state PNGs captured from the **old hardcoded toggle**, not the service-driven `previewState()`; **no capture script exists** (`Test-Path scripts` = false; no `evidence` npm script) | Task 8 |
| 16 | README, AI usage log, contribution summary | PARTIAL | README has all 7 required sections + doc map; `AI_USAGE_LOG.md` has per-session table, PENDING AI-runs section, "what AI was not used for", no invented people; `CONTRIBUTION_SUMMARY.md` single-author honest, all 8 cited commit hashes real | README omits links to inventory/technology-comparison/deliverable-scoring/AI log/contribution and omits `evidence/ai-comparison/` from its evidence list; status numbers stale (#15); AI log prompts are summaries not verbatim (base prompt IS verbatim in the protocol â€” must say where); contribution summary missing `baf6019`/`dd631ae` | Tasks 5, 8, 9 |

## 1.2 Required components

| Component | Status | Implemented correctly | Used | Tested | Storybook | Accessibility | Problems | Required action |
|---|---|---|---|---|---|---|---|---|
| **AppButton** (`shared/components/button`) | DONE | `AppButtonComponent` (`button.component.ts:45`), selector `app-button` unchanged, signal API, loading/disabled | 25 files / 71 uses | 12 (click emits; disabled/loading don't) | `Basic/AppButton`, 7 stories, tracked | aria-label/busy/disabled/pressed on native button | `tuiButton` imported but visually overridden by Tailwind `!important` classes | Task 5 Step 6 documents ownership |
| **AppTextField** (`shared/components/input`) | DONE | `AppTextFieldComponent` (`input.component.ts:28`), CVA, auto ids | 14 files / 52 uses | 15 incl. `aria-invalid` `:59` + `required`/`aria-required` `:129` | `Basic/AppTextField`, 7, tracked | label[for], aria-describedby, aria-invalid | No `aria-describedby` linkage test; no validator round-trip; both `label` and `ariaLabel` optional â‡’ unnamed input possible if a consumer passes neither | Task 4 |
| **AppSelect** (`shared/components/select`) | DONE | `AppSelectComponent` (`select.component.ts:34`); **`SelectOption` exported** `:13` | 10 files / 48 uses | 5 (options, CVA change, disabled, object options) | `Basic/AppSelect`, 4, tracked | label[for] + aria-label fallback, native keyboard | disabled styling `opacity-50` not token-backed | Task 2 |
| **StatusBadge** | DONE | `StatusBadgeComponent`, statusâ†’style map from `shared/utils/status-styles.ts` (single source) | 9 files / 21 uses **incl. `/orders`** `orders.component.html:710,1007` | 7 incl. semantics test `:63` | `Basic/StatusBadge`, 6, tracked | `role="status"` + `aria-label` (`status-badge.component.html:6-7`) | `tuiStatus` neutralised by inline styles | Task 5 Step 6 |
| **SearchFilterToolbar** | DONE | `SearchFilterToolbarComponent`; `searchAriaLabel` `:25` â†’ `html:16` `ariaLabel \|\| 'Search'` | 4 files (doctors, patients, billing, change-requests) | 12 incl. accessible-name + host wiring | `Composite/SearchFilterToolbar`, 4, tracked | none remaining | **Not used by `/orders`** (hand-rolls search + 3 selects, `orders.component.html:62-217`) | Record DEV-6 deliberate deviation (Task 5 Step 4) â€” do not force adoption |
| **DataTableToolbar** | DONE | `DataTableToolbarComponent`, `<h1>` + `[header-actions]` slot | 5 files incl. **orders** `orders.component.html:3` | 6 | `Composite/DataTableToolbar`, 3, tracked | heading + projection | Orders spec asserts none of the adoption | Task 3 |
| **OrderSummaryCard** | **WRONG** | Class name correct, but **7 dead inputs** `order-summary-card.component.ts:14-17,20-22` (`patient, doctor, clinic, subOrders, overallProgress, currentStage, stages`) are declared and never rendered; template only reads `order`, `completedServices`, `totalServices` | 1 file (`view-order`) | 1 â€” and the spec sets 2 dead inputs (`:19-20`) | `Business/OrderSummaryCard`, 3, tracked | `<dl>/<dt>/<dd>` semantics | API lies; test asserts nothing beyond one string | Task 1 (remove dead inputs) + Task 4 (expand spec) |
| **WorkflowTimeline** | DONE | `WorkflowTimelineComponent`; `track $index` (`html:6`) fixes the old duplicate-status crash; `aria-current="step"` (`html:16`) | 1 file (`order-workflow`) | 4 incl. aria-current + empty branch | `Business/WorkflowTimeline`, 4, tracked | aria-current + `<ol aria-label>` | No stage `id` (acceptable while stages aren't reordered) | â€” |

No required component is missing; all 8 have correct spec class names, tests, tracked stories, and consumers.

## 1.3 Order Management POC (`/orders`)

| Aspect | Status | Evidence | Gap | Action |
|---|---|---|---|---|
| Normal state | DONE | Real HTTP load â†’ `public/data/orders.json`; signal filter/sort/pagination | â€” | â€” |
| Loading state | DONE | `viewState = computed(...)` derived from `orderService.loading()/error()/orders()` (`orders.component.ts:153-158`); skeleton rendered by that branch | â€” | â€” |
| Empty state | DONE | Two authentic branches: dataset-empty and filter-empty with working clear-filters (`orders.component.html:235-244, 262-272`) | â€” | â€” |
| Error state | DONE | Service `error` bound; `retryLoad()` â†’ `orderService.reload()` (`orders.component.ts:450-452`) â€” reload is real, tested (`orders.component.spec.ts:202`) | â€” | â€” |
| State reachability | DONE | 4-button POC control `orders.component.html:37-57`, `aria-label="Preview data states (POC control)"`, drives **service** `previewState()` (`order-data.service.ts:104-131`, marked `// POC evidence control`) â€” markup and service state cannot disagree | â€” | â€” |
| Responsive | DONE | Tailwind `sm:`/`lg:`, `overflow-x` scroll region, reduced-motion guard; 3-viewport screenshots exist (stale â€” #15) | Evidence predates final tree | Task 8 |
| Component reuse | DONE (mostly) | `app-data-table-toolbar`, `app-status-badge` Ã—3, `app-table-feedback`, `app-empty-state`, `app-button` Ã—10, `app-search-input`, `app-select`, `app-enterprise-paginator`; `ORDER_STATUS_BLOCK_STYLES` gone (0 matches) | Search/filter row hand-rolled (deliberate â€” DEV-6); **zero adoption assertions in the spec** | Task 3 (tests), Task 5 (DEV-6) |
| State screenshots | UNVERIFIED | 4 PNGs exist in `evidence/states/` but were captured at 12:38 from the **old hardcoded toggle** | Evidence shows old markup, not service-driven transitions | Task 8 recapture |

## 1.4 Storybook audit

| Item | Status | Evidence | Gap | Action |
|---|---|---|---|---|
| Config | DONE | `.storybook/main.ts:4-14` â€” angular-vite, docs/a11y/vitest/onboarding; **stale mdx glob removed** | â€” | â€” |
| a11y enforcement | DONE (source) | `preview.ts:19` `test: 'error'` | Outcome of strict run never recorded | Task 8 Step 7 |
| Coverage | DONE (exceeds) | 8 files / 38 stories / 8 docs; Basic 4 + Composite 2 + Business 2 (min 2+1+1) | â€” | â€” |
| Git hygiene | DONE | all 8 story files tracked | â€” | â€” |
| Build evidence | **WRONG** | `evidence/storybook/build-storybook.log` (12:36) evidences **5 chunks** and logs `No story files found â€¦ src\**\*.mdx` (glob no longer exists); `storybook-static/` (16:38) has all 8 chunks but no log captured | Log does not evidence current tree | Task 8 Step 4 |
| Screenshots | PARTIAL | 9 PNGs cover 5 components (all dated 2026-09-25, pre-rename) | Missing `Basic/AppSelect`, `Composite/DataTableToolbar`, `Business/OrderSummaryCard`; existing ones predate a11y/naming changes | Task 8 Step 5 |
| Dependencies | DONE | no `"latest"`; playwright 1.63.0, vite 8.3.1, chromatic 5.3.1 pinned exactly | Storybook packages caret-range `^10.6.0` (lock 10.6.0) â€” acceptable | â€” |

## 1.5 Testing audit

| Requirement | Status | Evidence | Gap | Action |
|---|---|---|---|---|
| Inventory & freshness | DONE (source) | **56 specs / 357 `it(` â€” `TOTAL: 357 SUCCESS` re-run this session, exit 0** | `evidence/tests/test.log` still says 336 | Task 8 |
| Runner clarity | PARTIAL | `npm test` = Karma/Jasmine (`angular.json`, `karma.conf.js`); `vitest.config.ts` + `@storybook/addon-vitest` + `@vitest/coverage-v8` installed but **no script runs standalone vitest**; two coverage packages installed | Undocumented dual stack | Task 5 Step 3 (document ownership; do not uninstall) |
| Tests for 4 basic components | DONE | button 12, input 15, select 5, status-badge 7 | â€” | â€” |
| Button interaction | DONE | `button.component.spec.ts:75-99` | â€” | â€” |
| Input validation | PARTIAL | display `:52`, `aria-invalid` `:59`, `required`/`aria-required` `:129`; form-level validators in `edit-order.component.spec.ts:30,44` | No `aria-describedby`â†”error-element linkage test; no validatorâ†’component round-trip | Task 4 |
| Filter interaction | DONE | `search-filter-toolbar.component.spec.ts:138` host wiring | â€” | â€” |
| Loading/empty | DONE | `loading-state` 6, `empty-state` 6, orders state tests 5 (`:187,194,202,218,225`) | â€” | â€” |
| Permission/security | DONE | `auth.guard.spec.ts:31,38`; `auth.interceptor.spec.ts:16,33` (new, `dd631ae`) | Interceptor asserts `headers.has()` only â€” not `Bearer <token>` value | Task 4 |
| Dependency-failure / retry / recovery | DONE | `order-data.service.spec.ts:25` error, `:87` recover-after-reload; orders retry test `:202` | â€” | â€” |
| Boundary | DONE | `orders.component.spec.ts:180` page clamp; `order-data.service.spec.ts:39` payload boundary | â€” | â€” |
| Focused/skipped/fake tests | DONE (clean) | 0 `fit/fdescribe/xit/.only/.skip`, 0 commented tests | `order-summary-card` 1 weak test; orders `:169-185` tests dead pagination API | Tasks 1, 4 |
| Test matrix | PARTIAL | `docs/test-matrix.md` â€” 8 categories Ã— 5 surfaces, header claims 357 âœ“ | One citation names a non-existent test (`order-data.service.spec.ts::(constructor load + empty flushâ€¦)` â€” that spec has 3 tests); 2 inexact citations; uncovered cells shown as `-` not `GAP` | Task 5 Step 3 |
| Coverage | DONE (baseline) | `evidence/tests/coverage-summary.txt` â€” 357, Statements 61.33%, Lines 63.99% (baseline only, not a gate) | Transcribed rather than raw; regenerable in Task 8 | Task 8 |

## 1.6 Accessibility + responsiveness (Implemented / Verified / Documented)

| Area | Implemented | Verified | Documented | Gap |
|---|---|---|---|---|
| Keyboard (table sort) | Yes â€” sortable headers are buttons w/ `aria-label`, `aria-sort` | Yes â€” checklist 9 rows VERIFIED + 2 screenshots | `keyboard-walkthrough-checklist.md` | Gate line stale (336) |
| Focus visibility | Yes â€” `theme.scss:267-270` valid `:focus-visible` outline (fixed) | Partial â€” screenshots predate the fix | Documented as complete | Re-verify (Task 8) |
| Labels / names | Yes â€” input/select/button/dialog; toolbar `searchAriaLabel` | axe 0/24 routes (stale scan) | `axe-summary.md` | `keyboard-walkthrough.json:110` captured an input with `label: ""`; re-scan (Task 8) |
| Semantic status | Yes â€” `role="status"` + `aria-label` + test | Test-level only | Storybook docs | Re-scan (Task 8) |
| Timeline | Yes â€” `aria-current="step"` + test | Test-level only | â€” | â€” |
| Dialogs | Yes â€” PrimeNG + `cdkTrapFocus`, 12 spec tests | Covered by axe dialog route | â€” | â€” |
| Forms/errors | Yes â€” `aria-invalid`, `aria-describedby`, `aria-required` | Screenshot + spec | Storybook docs | Linkage test (Task 4) |
| Disabled states | Visual only â€” token exists, 6 call sites hardcode opacity | Not separately verified | Not documented | Task 2 |
| Breakpoints | Yes â€” `sm/md/lg/xl` app-wide | Yes â€” 23 screenshots at 375/768/1440 + overflow/sidebar JSON | `responsive-checklist.md` | All stale vs `dd631ae` (Task 8) |
| Overflow/clipping | Yes â€” `overflow-x` regions | Yes â€” `overflow-results.json` | Yes | Regenerate (Task 8) |
| State authenticity | Yes â€” service-driven `previewState()`/`reload()` | **No** â€” PNGs came from the old fake toggle | `responsive-checklist.md:34` admits "state toggle" without saying service vs markup | Task 8 |
| Storybook a11y | `test: 'error'` | Not recorded | No | Task 8 Step 7 |
| Console/build | â€” | build EXIT 0 log exists but predates final tree; lint log is 15 bytes | `evidence/build/*` | Task 8 |

## 1.7 Library responsibility and duplication

Division of responsibilities (`README.md`, `docs/technology-comparison.md`) is **respected at macro level**:

| Library | Verified usage | Verdict |
|---|---|---|
| PrimeNG | `<p-table>` Ã—18 in 12 files, `<p-treetable>` Ã—1, `<p-dialog>` Ã—1, `<p-paginator>` Ã—1 (wrapped), Aura theme in `app.config.ts:23-31`; `p-dropdown/p-calendar/p-button/p-badge/p-card` = **0** | Correct, meaningful |
| Taiga UI | `TuiRoot` + 3 directives (`TuiButton`, `TuiStatus`, `TuiLabel`) + i18n | Token-lean but **~0 visual contribution** (overridden by Tailwind/inline styles) â€” decision must be documented (Task 5 Step 6) |
| Angular CDK | drag-drop (workflow-board), `cdkTrapFocus` (entity-dialog), `cdk/menu` (view-order) | Narrow, correct. Shell dropdowns still hand-rolled (documented, acceptable) |
| Tailwind | 2,208 `class=` attributes; generated CSS committed | Dominant, correct |
| Signals/RxJS | Pervasive signals; RxJS in services + interceptor | Correct |

**Duplication status after `dd631ae`:**

| ID | Finding | Status |
|---|---|---|
| D1 | Status palette 3Ã— | **FIXED** â€” single `shared/utils/status-styles.ts`, consumers delegate |
| D2 | Priority palette 2Ã— | **FIXED** â€” `shared/utils/priority-styles.ts` (workflow-board's `getPriorityColor` still parallel â€” minor) |
| D3 | Status-label logic 2Ã— | **FIXED** for order status (`status-label.ts`); sub-order labels still 3 copies â€” minor |
| D4 | Sort-a11y helper 2Ã— | **FIXED** â€” orders uses `shared/utils/sort-a11y.ts` |
| D5 | Comparator 2Ã— | **OPEN** â€” `order-data.service.ts:13-22 compareValues` (used only by dead `applyFilters`) vs `orders.component.ts:99-112` |
| D6 | SearchFilterToolbar hand-copied | **FIXED** â€” billing + change-requests now use the component |
| D7 | Page-header markup hand-copied | **PARTIAL** â€” 5 pages use `app-data-table-toolbar`, others still hand-roll |
| D8 | Three loading/empty components | **DOCUMENTED** â€” ownership rule in `docs/component-architecture.md:84-88` |
| D9 | Raw `<button>` Ã—125/29 files | Acceptable (sort headers, tabs, menus) |
| D10 | `utilities.scss` second styling layer | **OPEN** â€” 1,091 lines, ~60 of 121 class tokens referenced nowhere; contradicts "Tailwind owns utilities" |
| D11 | Dead `.p-button*` CSS | **OPEN** â€” `styles.scss:48,54`; 0 `<p-button>` usages |
| D12 | Hand-rolled shell overlays | Documented; out of scope |
| D13 | Unused model exports | **OPEN** â€” `OrderFilters`, `OrderTableState`, `SubOrderViewState` |
| D14 | Docs contradict code | **OPEN** â€” `technology-comparison.md:35` claims PrimeNG provides "cards, badges" (0 usages) |

Also dead: `OrderSummaryCard` 7 inputs; `order-data.service.ts` `applyFilters`/`statusCounts`/`priorityCounts`; orders pagination API (`firstPage/lastPage/prevPage/nextPage/rangeStart/rangeEnd/visiblePageNumbers`) + 6 more zero-use handlers; `LUCIDE_INNERS` export (internal uses only).

## 1.8 Mandatory deliverables and Definition of Done

| # | Deliverable | Status | Action |
|---|---|---|---|
| 1 | UI component inventory | PARTIAL | Task 6 |
| 2 | Weighted matrix + references + AI Output Comparison Pack | WRONG (arithmetic) / PARTIAL (pack ready, empty) | Tasks 5, 7; execution human |
| 3â€“5 | Three runnable spikes | MISSING â†’ DEV-2 | Task 5 (record) |
| 6 | Design tokens + component architecture | PARTIAL | Tasks 2, 5 |
| 7 | Required components | DONE | â€” |
| 8 | Responsive demo page | DONE | Task 8 (evidence) |
| 9 | Documentation + required Storybook | PARTIAL | Tasks 5, 8 |
| 10 | Automated tests + a11y/responsive review | PARTIAL | Tasks 3, 4, 8 |
| 11 | Final recommendation + presentation | PARTIAL | Task 5; delivery human |
| 12 | README, AI usage log, contribution summary | PARTIAL | Tasks 5, 8, 9 |

**Definition of Done (spec Â§7):**

- [x] All three candidates run as spikes â†’ *decided deviation DEV-2, recorded in `docs/scope-exceptions.md`*
- [x] Matrix weights = 100%, every score justified, Telerik licensing documented, AI 15% in-table â†’ structure âœ“; **subtotals wrong (Task 5)**
- [x] All three candidates evaluated under identical AI conditions with full evidence â†’ **protocol ready; runs PENDING HUMAN â€” never fabricated**
- [x] Final library uses approved stack with justified choice â†’ recommendation exists; sign-off pending
- [x] Central tokens applied to all required components â†’ **disabled tokens not consumed (Task 2)**
- [x] 4 basic + 2 composite + 2 business working and responsive â†’ âœ“
- [x] Loading/empty/error visible **and authentic**; tests and Storybook pass â†’ code âœ“; **evidence stale (Task 8)**
- [x] README, AI log, Git history, contribution summary, recommendation, demo, presentation complete â†’ **README numbers/evidence wrong (Tasks 5, 8); live presentation human**

**OPTIONAL (do not start before core DoD is green):** dark mode (exists via `ThemeService`), RTL readiness, full Storybook coverage for all 19 shared components, visual-regression/a11y automation, i18n, package publishing, advanced grid features, performance profiling, CI pipeline, coverage-% gate, PrimeNG/Taiga adoption expansion beyond the 5 toolbar pages.

## 1.9 Decided deviations and human-gated items

| ID | Deviation / open item | State | Recorded in |
|---|---|---|---|
| DEV-1 | Angular stack instead of React+KendoReact/MUI | Decided; mentor sign-off pending | `docs/scope-exceptions.md:10` |
| DEV-2 | Research + protocol instead of three runnable spikes | Decided; sign-off pending | `docs/scope-exceptions.md:11` |
| DEV-3 | Single author vs 2â€“3 interns | Decided; sign-off pending | `docs/scope-exceptions.md:12` |
| DEV-4 | AI 15% held pending human execution | Decided; execution pending | `docs/scope-exceptions.md:13` |
| DEV-5 | Docs deleted in `baf6019` recreated fresh, not restored | **Not yet recorded in scope-exceptions** | Task 5 Step 4 |
| DEV-6 | `/orders` search/filter row not using `SearchFilterToolbar` (chips + multi-select advanced filters exceed its API) | **Not yet recorded** | Task 5 Step 4 |
| HUMAN-1 | Three controlled AI comparison runs (60 min, 3 iterations, same tool/model) | **PENDING â€” AI must never execute or fill these** | `evidence/ai-comparison/*` |
| HUMAN-2 | Mentor sign-off at checkpoints 1/2/3 + final review | PENDING | `docs/scope-exceptions.md` |
| HUMAN-3 | Live 10â€“15 minute demonstration | PENDING | `docs/demo-script.md` |

---

# PART 2 â€” IMPLEMENTATION PLAN

**Execution order:** 1 â†’ 2 â†’ 3 â†’ 4 â†’ 5 â†’ 6 â†’ 7 â†’ 8 â†’ 9. Tasks 1â€“4 are code and must precede Task 8 (evidence must match the final tree). Tasks 5â€“7 are docs/hygiene and can interleave after Task 4. Task 8 must run after all code changes. Task 9 closes.

---

### Task 1: Remove verified dead code

**Files:**
- Modify: `src/app/shared/components/order-summary-card/order-summary-card.component.ts`, `.spec.ts`
- Modify: `src/app/core/services/order-data.service.ts`, `.spec.ts`
- Modify: `src/app/features/orders/orders.component.ts`, `.spec.ts`
- Modify: `src/app/core/models/order.model.ts`, `src/app/core/models/sub-order.model.ts`, `src/app/core/models/index.ts` (barrel)
- Modify: `src/styles.scss`, `src/styles/utilities.scss`
- Modify: `src/app/shared/icons/lucide-icons.ts`

**Interfaces:**
- Consumes: current green baseline (357 tests).
- Produces: `OrderSummaryCardComponent` public inputs reduced to `order`, `completedServices`, `totalServices`; `OrderDataService` without `applyFilters`/`statusCounts`/`priorityCounts`; `OrderFilters`/`OrderTableState`/`SubOrderViewState` deleted; smaller `utilities.scss`. Task 4 writes new tests against the reduced API; Task 8 captures evidence of this tree.

- [x] **Step 1: Record baseline**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: `TOTAL: 357 SUCCESS`

- [x] **Step 2: Grep-verify every removal target before deleting** (save the output; it goes in the commit body)

```powershell
# a) OrderSummaryCard dead inputs -> must be 0 in the template
findstr /n /c:"patient" /c:"doctor" /c:"clinic" /c:"subOrders" /c:"overallProgress" /c:"currentStage" /c:"stages" src\app\shared\components\order-summary-card\order-summary-card.component.html
# b) service methods -> 0 usages outside their own definition
findstr /s /n /c:"applyFilters" /c:"statusCounts" /c:"priorityCounts" src\app\*.ts
# c) orders dead API -> 0 matches in orders.component.html
findstr /n /c:"firstPage" /c:"lastPage" /c:"prevPage" /c:"nextPage" /c:"rangeStart" /c:"rangeEnd" /c:"visiblePageNumbers" /c:"onSearchChange" /c:"onPriorityChange" /c:"onPageSizeChange" /c:"hasChildren" /c:"onNodeExpand" /c:"onNodeCollapse" src\app\features\orders\orders.component.html
# d) model exports -> 0 usages outside their own file (check barrel + all consumers)
findstr /s /n /c:"OrderFilters" /c:"OrderTableState" src\app\*.ts
findstr /s /n /c:"SubOrderViewState" src\app\*.ts
# e) dead PrimeNG button CSS -> 0 template usages
findstr /s /n /c:"<p-button" /c:"pButton" src\app\*.html src\app\*.ts
# f) LUCIDE_INNERS -> 0 imports outside lucide-icons.ts
findstr /s /n /c:"LUCIDE_INNERS" src\app\*.ts
```

Expected: each returns definition-only hits (0 external consumers). **If any target has an external consumer, do not delete it â€” record it in the commit body as retained and why.** For (e), also check `styles.scss` for a `Primeng` button module import before removing CSS.

- [x] **Step 3: Prune `src/styles/utilities.scss` orphan selectors**

For each of the ~60 class tokens with 0 references outside the file, verify individually before removal:

```powershell
findstr /s /n /c:"<class-token>" src\app\*.html src\app\*.ts src\styles.scss src\styles\theme.scss src\styles\utilities.scss
```

Keep: `input-base`, `label-base`, `select-base`, `enterprise-*`, `showcase-*`, `truncate-1`, `p-datatable-thead` (referenced from `theme.scss`), and anything matched by a `@extend` inside `utilities.scss` itself. Remove only tokens with 0 matches everywhere. Include the removed-token list in the commit body.

- [x] **Step 4: Delete the verified dead code**

- `order-summary-card.component.ts`: delete the 7 dead inputs (lines 14â€“17, 20â€“22) and any type imports (`Patient`, `Doctor`, `Clinic`, `SubOrder`) that become unused.
- `order-summary-card.component.spec.ts`: delete the `setInput("currentStage"â€¦)` and `setInput("stages"â€¦)` lines (19â€“20).
- `order-data.service.ts`: delete `statusCounts` (`:39`), `priorityCounts` (`:53`), `applyFilters` (`:149`), and `compareValues` (`:13-22`) **only if** Step 2 confirms no remaining consumer; then delete `OrderFilters` from `order.model.ts` and its barrel entry.
- `orders.component.ts`: delete the 13 zero-use members from Step 2c.
- `orders.component.spec.ts`: delete **only** the test cases whose sole subject is removed API â€” the pagination block at `:169-185` and the `visiblePageNumbers` assertion at `:92`. Every other test must remain byte-identical.
- `order.model.ts` / `sub-order.model.ts` / barrel: delete `OrderTableState`, `SubOrderViewState` (+ `OrderFilters`).
- `styles.scss`: delete `.p-button` (`:48`) and `.p-button-sm` (`:54`) blocks.
- `lucide-icons.ts`: drop the `export` keyword from `LUCIDE_INNERS` (keep the map â€” it has internal uses at `:189,193`).
- `utilities.scss`: delete the Step 3 verified orphans.

- [x] **Step 5: Verify (Review Focus #1 and #2)**

```powershell
# every removed symbol must return 0 hits
findstr /s /n /c:"applyFilters" /c:"statusCounts" /c:"priorityCounts" /c:"OrderFilters" /c:"OrderTableState" /c:"SubOrderViewState" src\app
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
npm run build-storybook
```

Expected: all greps 0; lint exit 0; tests green with total = **357 minus exactly the deleted test cases** (name them); both builds exit 0.

- [x] **Step 6: Commit**

```bash
git add src
git commit -m "chore: remove verified dead code, unused model exports, and orphan style rules" -m "grep evidence: <paste Step 2/3 output>; deleted tests: <names>; test total: <N>"
```

---

### Task 2: Consume disabled-state tokens in all form controls

**Files:**
- Modify: `src/app/shared/components/button/button.component.ts`, `src/app/shared/components/input/input.component.ts`, `src/app/shared/components/select/select.component.ts`
- Modify: `src/app/shared/components/enterprise-paginator/enterprise-paginator.component.scss`
- Modify: `src/app/features/forms/forms.component.html`, `src/app/features/orders/create-order/create-order.component.html`, `src/app/features/orders/sub-order/sub-order.component.html`
- Regenerate: `src/styles/tailwind-generated.css` (via `npm run tailwind:build`)

**Interfaces:**
- Consumes: `--disabled-opacity` token (`tokens.scss:29`, dark override `:311`).
- Produces: every disabled control rendered from the token; Task 8 recaptures screenshots of the three changed templates.

- [x] **Step 1: Locate every hardcoded disabled opacity**

```powershell
findstr /s /n /c:"opacity-50" src\app\shared\components\button\button.component.ts src\app\shared\components\input\input.component.ts src\app\shared\components\select\select.component.ts
findstr /s /n /c:"disabled:opacity" src\app\features\*.html
findstr /n /c:"opacity: 0.45" src\app\shared\components\enterprise-paginator\enterprise-paginator.component.scss
```

Expected: `button.component.ts:63`, `input.component.ts:78,82`, `select.component.ts:67,69`, `forms.component.html:931`, `create-order.component.html:33`, `sub-order.component.html:804`, `enterprise-paginator.component.scss:166`.

- [x] **Step 2: Replace with the token (arbitrary-value utilities)**

- `button.component.ts:63`: `disabled:opacity-50` â†’ `disabled:opacity-[var(--disabled-opacity)]`
- `input.component.ts:78` and `:82`: `opacity-50` â†’ `opacity-[var(--disabled-opacity)]`
- `select.component.ts:67` and `:69`: `opacity-50` â†’ `opacity-[var(--disabled-opacity)]`
- `enterprise-paginator.component.scss:166`: `opacity: 0.45;` â†’ `opacity: var(--disabled-opacity);`
- `forms.component.html:931`: `disabled:opacity-50` â†’ `disabled:opacity-[var(--disabled-opacity)]`
- `create-order.component.html:33`: `disabled:opacity-70` â†’ `disabled:opacity-[var(--disabled-opacity)]`
- `sub-order.component.html:804`: `disabled:opacity-40` â†’ `disabled:opacity-[var(--disabled-opacity)]`

Expected visual diff (named, allowed): disabled sub-order/create-order buttons and paginator controls shift to 50% opacity. No other visuals change.

- [x] **Step 3: Regenerate Tailwind and confirm the class survived the build**

Run: `npm run tailwind:build`
Then: `findstr /c:"disabled-opacity" src\styles\tailwind-generated.css`
Expected: at least one match (the arbitrary utility was detected and emitted).

- [x] **Step 4: Audit accessible-name coverage of `<app-input>` consumers**

```powershell
findstr /s /n /c:"<app-input" src\app\features\*.html src\app\shared\components\*.html
```

For each hit, confirm the element also passes `label=` or `ariaLabel=`. Fix any consumer that passes neither by adding `ariaLabel` (a descriptive name, not a placeholder copy). If none are missing, record "0 unnamed inputs" in the commit body.

- [x] **Step 5: Verify (Review Focus #3)**

Run: `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build`
Expected: lint 0; tests green, total â‰¥ Task 1's total; build 0.

- [x] **Step 6: Commit**

```bash
git add src
git commit -m "feat(tokens): consume disabled-state tokens in form controls and paginator"
```

---

### Task 3: Orders adoption tests

**Files:**
- Test: `src/app/features/orders/orders.component.spec.ts`

**Interfaces:**
- Consumes: existing orders implementation (`app-data-table-toolbar` `orders.component.html:3`, `app-status-badge` `:710,1007`, `app-empty-state` `:262-272`).
- Produces: three assertions that pin the reuse requirement so a future refactor cannot silently un-adopt the shared components. Task 8 evidence depends on these states remaining shared.

- [x] **Step 1: Add three tests** (the behavior already exists â€” these are characterization tests; expected to PASS, and a failure means the behavior is broken, not that the test is wrong)

1. `"should render the shared data-table toolbar as the page header"` â€” query `app-data-table-toolbar` on the normal fixture; assert exactly 1 and that its title text contains `Orders`.
2. `"should render a status badge with assistive semantics for every order row"` â€” normal fixture; assert `app-status-badge` count equals the rendered row count (or > 0 if rows paginate), and that each badge root has `role="status"`.
3. `"should render the shared empty state when filters match nothing"` â€” set the search signal/filter to a term present in no order (e.g. `zzz-no-match`); assert `app-empty-state` appears and the filter-empty branch (`orders.component.html:262-272`) is what rendered.

- [x] **Step 2: Run**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: previous total + 3, all green. If any new test fails, fix the *implementation* (or the assertion if it encodes a wrong expectation) â€” never delete the test to get green.

- [x] **Step 3: Verify**

Run: `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless`
Expected: lint 0, all green.

- [x] **Step 4: Commit**

```bash
git add src/app/features/orders
git commit -m "test(orders): assert shared toolbar, status badge, and empty-state adoption"
```

---

### Task 4: Close the remaining test gaps

**Files:**
- Test: `src/app/shared/components/order-summary-card/order-summary-card.component.spec.ts`
- Test: `src/app/core/interceptors/auth.interceptor.spec.ts`
- Test: `src/app/shared/components/input/input.component.spec.ts`

**Interfaces:**
- Consumes: Task 1's reduced `OrderSummaryCardComponent` API (`order`, `completedServices`, `totalServices`).
- Produces: form-level validation coverage for `AppTextField`; exact-token assertion for the interceptor; a non-trivial business-component spec. Raises the total again.

- [x] **Step 1: Rewrite the `order-summary-card` spec**

Read `order-summary-card.component.html` first, then replace the single test with:
- `"should render the order number"` â€” assert the rendered text contains `DL-024001`.
- `"should render the service progress summary"` â€” `completedServices: 3`, `totalServices: 5` â†’ assert `3 of 5`.
- `"should render the no-progress fallback when no services are completed"` â€” `completedServices: 0` â†’ assert the fallback branch the template renders (read the template for its exact text; do not invent copy).
- Do **not** set any input the template does not read.

- [x] **Step 2: Strengthen the interceptor assertion**

In `auth.interceptor.spec.ts` `:16`, replace `expect(forwarded.headers.has("Authorization")).toBeTrue()` with:

```typescript
expect(forwarded.headers.get("Authorization")).toBe("Bearer token-value");
```

- [x] **Step 3: Add the two input tests**

In `input.component.spec.ts`:
- `"should link the input to its error message via aria-describedby"` â€” set `error`; assert `input.getAttribute("aria-describedby")` equals the id of the rendered `.field-error` element, and that the hint element is absent.
- `"should surface a required-validator error through a reactive form host"` â€” declare a tiny inline host component in the spec whose template is `<app-input [formControl]="fc" label="Email" />` with `fc = new FormControl("", Validators.required)`; `fc.markAsTouched(); fc.updateValueAndValidity();` â†’ assert `aria-invalid="true"` and the error text renders; then `fc.setValue("a@b.c")` â†’ assert `aria-invalid` is `"false"`/absent. (The host binds the control state to the `error` input â€” document that binding in the test.)

- [x] **Step 4: Run**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all green; total = Task 3's total âˆ’ 1 (old order-summary test) + 4 + 1 + 2.

- [x] **Step 5: Verify**

Run: `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless`
Expected: lint 0, all green, no `fit`/`xit` introduced.

- [x] **Step 6: Commit**

```bash
git add src/app/shared/components src/app/core/interceptors
git commit -m "test: expand order-summary-card, assert Bearer token, cover input error linkage and validator round-trip"
```

---

### Task 5: Documentation corrections

**Files:**
- Modify: `docs/weighted-comparison-matrix.md`, `docs/technology-comparison.md`, `docs/test-matrix.md`, `docs/scope-exceptions.md`, `docs/ai-comparison-protocol.md`, `docs/component-architecture.md`, `docs/final-recommendation.md`, `README.md`

**Interfaces:**
- Consumes: verified facts from Part 1 (arithmetic, DEV-5/DEV-6, runner ownership).
- Produces: factually correct comparison/licensing/protocol docs (DoD gates) and recorded deviations. Does **not** touch any evidence slot's pending status.

- [x] **Step 1: Fix the matrix subtotals** â€” `docs/weighted-comparison-matrix.md:42-44`: replace 58.0 / 69.0 / 62.0 with **59.0 / 68.0 / 62.5**. Add the derivation line under the table: `Î£(score Ã— weight) Ã· 10 over the first 7 criteria (AI row excluded)`.

- [x] **Step 2: Fix the false PrimeNG claim** â€” `docs/technology-comparison.md:35`: the repo uses 0 `p-card` and 0 `p-badge`. Change to name what is actually used (`TreeTable`, dialogs, tables, paginator) or append "(cards and badges are provided by PrimeNG but not used in this POC)". Verify with `findstr /s /c:"p-card" src\app\*.html` â†’ 0.

- [x] **Step 3: Repair `docs/test-matrix.md`** â€” (a) replace the pseudo-citation `order-data.service.spec.ts::(constructor load + empty flush in create-order test)` with the real test names (`::should set error state when loading fails`, `::should preserve the create-order payload boundary`); (b) fix `auth.interceptor.spec.ts::forwards original requestâ€¦` â†’ `::forwards the original request when no token exists`; (c) add a legend line `- = GAP (no coverage)` and mark genuinely uncovered cells `GAP`; (d) add a **Runner ownership** subsection: `npm test` = Karma/Jasmine (authoritative for the 357 baseline); Vitest is installed only for the Storybook `addon-vitest` and has no standalone script; two coverage packages exist but only `karma-coverage` produces `evidence/tests` numbers. Re-verify each remaining citation with `findstr /n /c:"<test name>" <spec path>` before saving.

- [x] **Step 4: Record DEV-5 and DEV-6** â€” append two rows to `docs/scope-exceptions.md` matching the existing column format: DEV-5 (docs deleted in `baf6019` were recreated fresh in current docs, not restored), DEV-6 (`/orders` search/filter row intentionally not using `SearchFilterToolbar`: chips + multi-select advanced filters exceed its API; component proven reusable on 4 other pages). Approver column: `Pending: mentor checkpoint`.

- [x] **Step 5: Complete the frozen AI requirement** â€” `docs/ai-comparison-protocol.md`: in Â§1.1 add an explicit numbered element `1. Reusable primary/secondary button component (with disabled and loading states)` so all six spec elements (button, search input, status indicator, data table, confirmation dialog, responsive layout) are named; in Â§3 add three `### react-kendo` / `### react-mui` / `### vue-vuetify` run sections each with empty fields: `Run date:`, `Tool + model:`, `Iterations used:`, `Elapsed:`, `Notes:` â€” all left blank (PENDING). Do not fill anything.

- [x] **Step 6: Document the Taiga visual-ownership decision** â€” `docs/component-architecture.md` Â§3: append one sentence: *"Tailwind utilities and inline styles own the visual output of `tuiButton`/`tuiStatus`; the Taiga directives supply behavior/semantics only â€” this is a deliberate decision to avoid a second styling system, recorded here so the override is not mistaken for a bug."*

- [x] **Step 7: Add next steps + README links** â€” `docs/final-recommendation.md`: add `## Next validation steps` listing (1) three controlled AI runs per the protocol, (2) mentor sign-off on DEV-1â€¦DEV-6, (3) live demonstration, (4) any production-path review outside this POC. `README.md`: add links for `ui-component-inventory.md`, `technology-comparison.md`, `deliverable-scoring.md`, `AI_USAGE_LOG.md`, `CONTRIBUTION_SUMMARY.md` to the doc map, and `evidence/ai-comparison/` to the Evidence list. **Leave the status-table numbers alone â€” Task 8 owns them.**

- [x] **Step 8: Verify (Review Focus #5)** â€” re-add the weights column in the matrix (must be 100), re-derive all three subtotals from the score cells, grep `technology-comparison.md` for `cards` (claim now qualified), `findstr /n /c:"DEV-5" /c:"DEV-6" docs\scope-exceptions.md` â†’ 2 hits, `findstr /i /n /c:"button" docs\ai-comparison-protocol.md` â†’ â‰¥1 hit in Â§1.1, and confirm no evidence slot was modified (`git status` shows only `docs/` + `README.md`).

- [x] **Step 9: Commit**

```bash
git add docs README.md
git commit -m "docs: fix matrix subtotals and false claims, record DEV-5/DEV-6, complete AI protocol elements"
```

---

### Task 6: UI inventory inconsistency-column rewrite

**Files:**
- Modify: `docs/ui-component-inventory.md`

**Interfaces:**
- Consumes: code truth after Tasks 1â€“4 (orders toolbar/status adoption, reduced OrderSummaryCard API).
- Produces: deliverable 1 in final form.

- [x] **Step 1: Rewrite the "Observed Inconsistency" column** â€” every row must state a *genuine* inconsistency (duplication, divergent styling, missing state, unclear ownership) or the literal text `none observed`. Usage/reuse notes ("already reusable", "used by table pages") are not inconsistencies â€” move them to Reuse Priority or delete them.

- [x] **Step 2: Fix consumer claims** â€” row for `DataTableToolbar` must list all 5 consumers (orders, patients, doctors, billing, change-requests); `SearchFilterToolbar` must list 4 (doctors, patients, billing, change-requests); `OrderSummaryCard` row must reflect its post-Task-1 API (3 inputs).

- [x] **Step 3: Verify every path and claim**

```powershell
# extract each `src/...` citation and Test-Path it
findstr /n /c:"`src/" docs\ui-component-inventory.md
# spot-check consumer claims
findstr /s /c:"app-data-table-toolbar" src\app\features\*.html
findstr /s /c:"app-search-filter-toolbar" src\app\features\*.html
```

Expected: 0 missing paths; consumer lists match grep output exactly.

- [x] **Step 4: Commit**

```bash
git add docs/ui-component-inventory.md
git commit -m "docs: rewrite inventory inconsistency column with genuine findings and verified consumers"
```

---

### Task 7: AI comparison pack hygiene (no content filling)

**Files:**
- Delete: `evidence/ai-comparison/{a11y-findings,build-test-results,corrected-output,effort-log,hallucinated-apis,initial-output,manual-corrections,scoresheet}.md` and `evidence/ai-comparison/screenshots/` (root-level strays)
- Rewrite (UTF-8): `evidence/ai-comparison/{react-kendo,react-mui,vue-vuetify}/prompts.md`
- Modify: `evidence/ai-comparison/README.md`, `docs/ai-comparison-protocol.md` (only if it references root-level slot paths)

**Interfaces:**
- Consumes: Task 5's protocol (Â§4 evidence-slot list already points at the three partitions).
- Produces: one unambiguous place per slot; all files valid UTF-8; every slot still empty.

- [x] **Step 1: Confirm nothing references the root strays**

```powershell
findstr /s /n /c:"evidence/ai-comparison/initial-output" docs *.md
findstr /s /n /c:"evidence/ai-comparison/scoresheet" docs *.md
```

Expected: only the root `README.md` / protocol references. If the protocol references a root path, repoint it to `evidence/ai-comparison/<candidate>/â€¦` first.

- [x] **Step 2: Delete the 8 root-level template duplicates + root `screenshots/`** â€” the three partitions already carry all 9 slots each. Keep the root `README.md`.

- [x] **Step 3: Re-save the three `prompts.md` as UTF-8** â€” each currently contains byte `0x97` (Windows-1252 em dash) at line 1, invalid UTF-8. Rewrite line 1 as plain ASCII: `# SLOT - AWAITING HUMAN EXECUTION`.

- [x] **Step 4: Update the root README** â€” its slot list must describe only the three partitions; state `Root-level duplicate templates removed 2026-09-26 (hygiene only â€” no slot was filled).`

- [x] **Step 5: Verify integrity (anti-fabrication gate)**

```powershell
# every slot must still be marked pending
findstr /s /n /c:"AWAITING HUMAN EXECUTION" evidence\ai-comparison\*.md evidence\ai-comparison\*\*.md
# no screenshots anywhere in the pack
Get-ChildItem -Recurse evidence\ai-comparison -Filter *.png
# no scores present
findstr /s /n /r /c:"| [0-9] |" evidence\ai-comparison\*\scoresheet.md
```

Expected: pending markers in all 27 slot files + 3 screenshots READMEs; **0 PNGs**; no filled score cells.

- [x] **Step 6: Commit**

```bash
git add -A evidence/ai-comparison docs/ai-comparison-protocol.md
git commit -m "chore(evidence): remove stray root AI slots and fix UTF-8; no slot content changed"
```

---

### Task 8: Repeatable evidence capture and full evidence refresh

**Files:**
- Create: `scripts/capture-evidence.mjs`, `package.json` script `"evidence"`
- Overwrite: `evidence/build/lint.log`, `evidence/build/build.log`, `evidence/tests/test.log`, `evidence/tests/coverage-summary.txt`, `evidence/storybook/build-storybook.log`, `evidence/accessibility/axe-report.json` + `axe-summary.md`, `evidence/responsive/**`, `evidence/states/*` (+ new `evidence/states/README.md`), `evidence/accessibility/keyboard-walkthrough-checklist.md` gate line
- Add: `evidence/storybook/{basic-appselect--default, basic-appselect--disabled, composite-datatable-toolbar--default, business-ordersummarycard--default}.png`
- Modify: `README.md` status table

**Interfaces:**
- Consumes: final code tree (Tasks 1â€“4), Playwright + axe-core (already in devDependencies), the documented method in `evidence/accessibility/axe-summary.md` and `evidence/responsive/responsive-checklist.md`.
- Produces: evidence that is fresh, attributable (command + date + exit code in every log), and reproducible by `npm run evidence`.

- [x] **Step 1: Write `scripts/capture-evidence.mjs`** â€” Node ESM script using `playwright` (chromium) that:
  1. spawns `ng serve --port 4200`, polls `http://localhost:4200` until HTTP 200 (timeout 120 s),
  2. sets `localStorage['dentalab-auth']` before app boot (same marker `auth.guard` reads),
  3. runs axe-core (`axe.min.js` injected from `node_modules/axe-core`) over the same route list recorded in `evidence/accessibility/axe-summary.md` (17 routes + `/forms` anchors + `/orders/create` = 24 route-states), writing `evidence/accessibility/axe-report.json` with a fresh `generatedAt`,
  4. captures the 3 viewports (1440/768/375) for the same page set as `evidence/responsive/<viewport>/*.png`,
  5. on `/orders`, clicks each of the 4 POC state-control buttons (service-driven `previewState()`) and writes `evidence/states/orders-{normal,loading,empty,error}.png`,
  6. re-runs the overflow and sidebar-toggle checks into the existing JSON shapes,
  7. kills the server and prints a file manifest with per-file byte sizes.
  Add `"evidence": "node scripts/capture-evidence.mjs"` to `package.json` scripts.

- [x] **Step 2: Refresh the four gate logs (each must embed command, date, exit code)**

**Do not use `>` â€” PowerShell 5.1 writes UTF-16 and corrupts the logs.** Use `| Out-File -Encoding utf8`, and prefix every log with the command and timestamp:

```powershell
"CMD: npm run lint | $(Get-Date -Format s)" | Out-File -Encoding utf8 evidence\build\lint.log
npm run lint 2>&1 | Out-File -Append -Encoding utf8 evidence\build\lint.log
# repeat the same two-line pattern for:
#   npm test -- --watch=false --browsers=ChromeHeadless   -> evidence\tests\test.log
#   npm run build                                         -> evidence\build\build.log
#   npm run build-storybook                               -> evidence\storybook\build-storybook.log
# each file ends with "EXIT CODE: $LASTEXITCODE"
```

Expected: lint exit 0; test `TOTAL: <Task 4 total> SUCCESS`; build exit 0; storybook exit 0 **and the log must contain chunks for all 8 story files** (`button`, `input`, `select`, `status-badge`, `search-filter-toolbar`, `data-table-toolbar`, `order-summary-card`, `workflow-timeline`) with no `*.mdx` warning.

- [x] **Step 3: Refresh coverage baseline** â€” `npm test -- --watch=false --browsers=ChromeHeadless --code-coverage > â€¦` then copy the raw `text-summary` into `evidence/tests/coverage-summary.txt` with date and command (raw output, not hand-typed numbers).

- [x] **Step 4: Run `npm run evidence`** â†’ fresh axe report, responsive screenshots, states, overflow/sidebar JSON.

- [x] **Step 5: Capture the 4 missing Storybook screenshots** â€” start `npm run storybook` (port 6006) and capture `Basic/AppSelect` (default + disabled), `Composite/DataTableToolbar` (default), `Business/OrderSummaryCard` (default) using the existing `<title>--<story>.png` naming; optionally refresh the 9 pre-rename PNGs from the same session.

- [x] **Step 6: Verify (Review Focus #4)** â€” every manifest file exists and is non-zero; `axe-report.json` `generatedAt` is today and `violationCount` is 0 across all 24 route-states; the four `orders-*.png` differ pairwise (`Get-FileHash` â†’ 4 distinct hashes); `build-storybook.log` shows 8 chunks; the checklist gate line now reads the fresh test total instead of 336.

- [x] **Step 7: Record the Storybook strict-a11y outcome** â€” from the `test: 'error'` run, append one line to `docs/component-architecture.md` Â§5: date, command, result (pass, or violations fixed / reverted with reason). No silent bypass.

- [x] **Step 8: Update the README status table** â€” test count, dates, and commands exactly as captured; keep the "AI comparison pending" and POC-only limitation rows.

- [x] **Step 9: Commit**

```bash
git add scripts package.json evidence README.md docs/component-architecture.md
git commit -m "chore(evidence): repeatable capture script and refreshed gate, a11y, responsive, and state evidence"
```

---

### Task 9: Final DoD walk and log polish

**Files:**
- Modify: `AI_USAGE_LOG.md`, `CONTRIBUTION_SUMMARY.md`, `docs/scope-exceptions.md` (only if sign-off state changed), `docs/superpowers/plans/` (mark this plan's checkboxes)

**Interfaces:**
- Consumes: everything from Tasks 1â€“8 plus honest human-gated status.
- Produces: spec Â§8 compliance for deliverable 12 and the final open-items list.

- [x] **Step 1: `AI_USAGE_LOG.md`** â€” add an `Owner` column to the per-session table (real author only); add a line under each prompt row stating where the verbatim text lives (base prompt verbatim in `docs/ai-comparison-protocol.md` Â§1.2; historical session prompts archived as summaries â€” say so explicitly rather than implying verbatim); keep the `PENDING HUMAN EXECUTION` section unchanged.

- [x] **Step 2: `CONTRIBUTION_SUMMARY.md`** â€” add the commits produced by Tasks 1â€“8 with their real hashes from `git log`, update the "In progress" row to completed-with-open-human-items. No invented reviewers.

- [x] **Step 3: Honesty check** â€” grep both files for any person name; only the real repository author may appear. Confirm every claim traces to a commit or file.

- [x] **Step 4: Final DoD walk (spec Â§7)** â€” tick what is done; list the rest **verbatim** as remaining open. Expected remaining: (a) three controlled AI comparison runs â€” HUMAN-1; (b) mentor sign-off on DEV-1â€¦DEV-6 â€” HUMAN-2; (c) live demonstration delivery â€” HUMAN-3. Never mark a pending item done.

- [x] **Step 5: Mark this plan's checkboxes** for Tasks 1â€“9 as completed.

- [x] **Step 6: Commit**

```bash
git add AI_USAGE_LOG.md CONTRIBUTION_SUMMARY.md docs/scope-exceptions.md docs/superpowers/plans
git commit -m "docs: finalize AI log, contribution summary, and DoD walk with open human items"
```

---

## Execution Notes

- **Human-only, never delegated to AI:** executing the three controlled AI comparison runs, mentor checkpoint approvals, the live presentation, and filling any slot under `evidence/ai-comparison/`.
- **Stop condition:** if a task's verification fails and the fix would require changing UI or architecture beyond that task's named changes, stop and record the blocker instead of expanding scope (spec Â§11).
- **Evidence rule:** a log or screenshot generated before the last code commit is UNVERIFIED, not DONE. Task 8 must run last.
- **Optional stretch work** (dark mode, RTL, full Storybook coverage, visual regression, i18n) starts only after Task 9 and only with mentor approval.

