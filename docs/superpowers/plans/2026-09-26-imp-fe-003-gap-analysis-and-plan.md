# IMP-FE-003 Gap Analysis and Implementation Plan (Angular)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every gap between the current Angular POC and IMP-FE-003 v1.1 (without changing the approved Angular stack), and record the deviations that are decided, so the repository satisfies the Definition of Done with honest evidence.

**Architecture:** Part 1 is the audit (status per requirement with evidence, gap, action). Part 2 is the execution plan: docs and evidence first, then targeted code fixes (naming, a11y, authentic states, dedupe, dead code), then test/Storybook/evidence refresh, then recommendation and final gates. No library changes, no UI redesign, no React/Vue scaffolding.

**Tech Stack:** Angular 21, TypeScript 5.9, Signals + RxJS, PrimeNG 21, Taiga UI 4, Angular CDK 21, Tailwind CSS 4, Storybook 10 (angular-vite), Karma/Jasmine (`npm test`), Playwright + axe-core (evidence capture), tsc (`npm run lint`).

**Spec:** IMP-FE-003 v1.1 (task specification in the assignment brief). Governing decisions supplied by the project owner on 2026-09-26 are recorded in §1.10 "Decided Deviations" and are binding on this plan.

---

## PART 1 — GAP ANALYSIS

### 1.1 Method and stack-alignment statement

Audit performed by reading source, tests, Storybook config, docs, evidence, and git history (2026-09-26). Every finding below carries file-level evidence. Per the owner's instruction, these are **not** issues in themselves:

- Angular instead of React; PrimeNG instead of KendoReact/Material UI; Taiga UI for lightweight controls; Angular CDK for behavior/a11y/drag-drop/overlays; Tailwind for layout/theming; PrimeNG for enterprise data-heavy UI.
- The requirement "final library uses React + TypeScript with KendoReact or MUI" is satisfied by an **approved stack substitution** (Angular + PrimeNG/Taiga), which must be recorded as a deviation, not fixed by rewriting.

What IS assessed: whether each IMP-FE-003 requirement is present, actually implemented, in use, correct, reusable, and evidence-backed; and whether library responsibilities in the Angular stack are clean or duplicated.

**Status summary (42 tracked line items):** DONE 14 · PARTIAL 15 · WRONG 3 · MISSING 7 · UNVERIFIED 2 · OPTIONAL 6 (OPTIONAL items are listed separately in §1.9 and are not counted against the core).

---

### 1.2 Core scope requirements — Status / Evidence / Gap / Required Action

| # | Requirement (spec §4) | Status | Evidence | Gap | Required action |
|---|---|---|---|---|---|
| 1 | UI inventory ≥20 components from sanitized CRM/Customer Portal sources, with purpose, variants, reuse priority, observed inconsistencies | PARTIAL | `docs/ui-component-inventory.md` — 40 rows, all 43 cited paths exist | No CRM/Portal provenance; 3 factually wrong rows (`:15` orders uses DataTableToolbar — false; `:16` search toolbar "Table pages" — orders not a consumer; `:20` TableFeedback has "error" mode — it does not; `:38` order-workflow uses CDK drag/drop — false); inconsistency column often holds usage notes | Task 11: provenance section, fix wrong rows, rewrite inconsistency column, commit |
| 2 | Weighted comparison matrix, criteria total 100% incl. **AI-Assisted Effectiveness at exactly 15%** inside the table, justification for every score, three candidates, framework-vs-library separation | WRONG | `docs/weighted-comparison-matrix.md` — weights 10+20+15+25+15+10+5 = 100% but they score *project deliverables*, not candidates; AI 15% sits in a separate section (`:36-46`), so including it yields 115%; `KendoReact|Telerik|Vuetify|Material UI` = 0 hits in working tree **and** in all 35 commits (`git log -S`) | No candidate matrix exists anywhere; AI-15% not in a 100% table; no tech-vs-library separation for candidates | Task 3: rewrite as candidate-selection matrix (AI 15% in-table, 8 criteria = 100%), move project rubric to `docs/deliverable-scoring.md` |
| 3 | Telerik/KendoReact licensing, free/premium limits, trial, long-term dependency risk from current official docs | MISSING | Grep across all `*.md`: 0 matches for `licens|Telerik|Kendo`; never existed in git history | Entire deliverable absent | Task 3: author `docs/licensing-review.md` with official URLs + retrieval date |
| 4 | Three runnable spikes (React+KendoReact, React+MUI, Vue3+Vuetify) | MISSING | No spike code in repo (checked) | Literal spike requirement unmet | Task 3: `docs/scope-exceptions.md` — **decided**: replaced by evidence-based research (Angular is the approved stack). Do not scaffold React/Vue |
| 5 | Sanitized comparison spike content: button, search input, status indicator, data table, confirmation dialog, responsive layout per candidate | MISSING | n/a | Same as #4; also affects the frozen AI requirement (§1.6) | Covered by #4 deviation + Task 4 (requirement amended to include all six elements) |
| 6 | Central design tokens: color, typography, spacing, radius, shadows, focus, **disabled state**, breakpoints | PARTIAL | `src/styles/tokens.scss` (316 lines) + `theme.scss` — color/type/spacing/radius/shadow/breakpoint present and widely consumed; **no `disabled` token anywhere**; `theme.scss:267-270` uses invalid `ring:`/`ring-offset:` properties with `outline: none` (verified) — global focus ring is broken; dual namespace `--color-*` vs unprefixed `--*` undocumented | Disabled token missing; focus rule invalid; namespace undocumented | Task 5: add disabled tokens, fix `:focus-visible`, replace hardcoded `opacity: 0.5`, document namespace |
| 7 | Component architecture doc: folder structure, naming, wrapper rules, interfaces, documentation approach | MISSING | `docs/` holds only 4 files; none is architecture; content existed pre-`baf6019` (`docs/decisions/library-usage-rules.md`) but was deleted | All five required topics undocumented | Task 1: author `docs/component-architecture.md` (recreate content fresh, do not restore stale files) |
| 8 | Final reusable component POC with required components + responsive demo | DONE | All 8 required components exist, standalone, signal-based; responsive evidence in `evidence/responsive/` (3 viewports) | Naming gap tracked separately in §1.3 | Renames in Task 2; otherwise satisfied |
| 9 | Storybook examples: ≥2 basic, ≥1 composite, ≥1 business | DONE | 8 stories / 38 story entries: `Basic/AppButton, AppTextField, AppSelect, StatusBadge` + `Composite/SearchFilterToolbar, DataTableToolbar` + `Business/OrderSummaryCard, WorkflowTimeline` | 3 story files untracked in git; build log covers only 5 of 8 | Task 13: commit, rebuild, refresh log + screenshots |
| 10 | Automated tests: each basic component, button interaction, input validation, filter interaction, loading/empty | PARTIAL | 336/336 green (`evidence/tests/test.log`, 2026-09-26, verified against static count of 336 `it(` across 53 specs); no focused/skipped/commented tests | Input validation only display/form-level: `input.component.ts` has no validation logic and `aria-invalid`/`required` never asserted; business components have 1 test each; no guard/interceptor (permission) tests; coverage never run | Tasks 12 (+ per-task tests): matrix, gap tests, coverage run |
| 11 | Accessibility checks (keyboard, focus, labels, semantics, forms, dialogs, tables, states, errors, disabled, responsive breakpoints) | PARTIAL | axe: 0 violations across 24 route-states (`evidence/accessibility/axe-report.json`); keyboard walkthrough checklist + 2 screenshots; dialog trap-focus (`entity-dialog.component.html:27`); keyboard-operable sort headers (commit `c269831`) | `SearchFilterToolbar` search field has **no accessible name** (no `searchAriaLabel` input, `search-filter-toolbar.component.html:11-18`); `StatusBadge` plain `<span>` with no `role`/`aria-label`; `WorkflowTimeline` active step lacks `aria-current="step"`; global focus rule broken (§1.2 #6); Storybook a11y set to report-only (`preview.ts:18` `test: 'todo'`); axe evidence not re-run against current dirty tree → **UNVERIFIED** | Task 6 (a11y fixes, TDD), Task 13 (storybook a11y), Task 16 (axe re-run) |
| 12 | Controlled AI-output comparison: 15% of the matrix, same tool/model/requirement/context/time/iterations for **every candidate**, initial + corrected outputs, prompts, screenshots, build/test, a11y, hallucinations, corrections, elapsed effort, iteration count | PARTIAL | `docs/ai-comparison-protocol.md` (rubric 20/20/20/15/15/10 = 100% verified, 60 min, 3 iterations); `evidence/ai-comparison/` = 9 templates, **all empty** ("AWAITING HUMAN EXECUTION"); `screenshots/` has 0 PNGs | Tool+model not pre-locked ("recorded at run time"); frozen requirement lacks **data table** and **confirmation dialog**; only one protocol — no per-candidate partitions; no executed evidence | Task 4: freeze protocol (six elements, locked conditions, 3 candidate partitions), complete templates. **Human executes the runs — nothing fabricated** |
| 13 | AI score used as one factor alongside licensing, maintainability, a11y, technical suitability, team fit, dependency risk; not decisive alone | PARTIAL | Formula documented (`weighted-comparison-matrix.md:44`), anti-fabrication stance documented (`ai-comparison-protocol.md §5`) | No score yet (pending #12 execution); final recommendation doc missing | Task 4 (structure) + Task 15 (recommendation states the score slot is pending) |
| 14 | Final recommendation + 10–15 minute demo/presentation | MISSING | No recommendation/presentation file; no `*.pptx|*.pdf` in repo; prior compliance report deleted by `baf6019` | Deliverable 11 absent entirely | Tasks 15 |

---

### 1.3 Required components — status table

| Component | Status | Implemented Correctly | Used | Tested | Storybook | Accessibility | Problems | Required Action |
|---|---|---|---|---|---|---|---|---|
| **AppButton** | PARTIAL | Yes — `shared/components/button/`, selector `app-button`, signal API, loading/disabled | Yes — 23 files, 132 refs | Yes — 12 real interaction tests | Yes — `Basic/AppButton`, 7 stories | Good — aria-label/busy/disabled/pressed, native button | Class is `ButtonComponent`, not `AppButton*`; Taiga `tuiButton` neutralized by Tailwind `!important` (double styling system) | Task 2 rename → `AppButtonComponent`; Task 1 documents Taiga/Tailwind ownership decision |
| **AppTextField** | PARTIAL | Yes — CVA, typed `type`, hint/error, auto ids | Yes — 15 files, 104 refs | Partial — 13 tests but `aria-invalid`/`required` never asserted; component has no validation logic of its own | Yes — `Basic/AppTextField`, 7 stories | Good — label[for], aria-describedby, aria-invalid | Class is `InputComponent` (ambiguous name); validation test gap | Task 2 rename → `AppTextFieldComponent`; Task 12 adds aria-invalid/required tests |
| **AppSelect** | PARTIAL | Yes — native `<select>` + CVA + Taiga `TuiLabel` | Yes — 11 files, 95 refs | Weak — only 3 tests | Yes — `Basic/AppSelect`, 4 stories (untracked) | Good — label[for], aria-label fallback, native keyboard | Class is `SelectComponent`; `SelectOption` type not exported (`select.component.ts:13`); thin tests | Task 2 rename → `AppSelectComponent` + export `SelectOption`; Task 12 adds tests; Task 13 commits story |
| **StatusBadge** | PARTIAL | Yes — status→style map, sizes | Yes — 8 files, 18 refs — **but not on `/orders`**, where the palette is duplicated inline | Yes — 6 tests | Yes — `Basic/StatusBadge`, 6 stories | Gap — plain `<span>`, no `role="status"`/`aria-label` | Style map duplicated 3× (`status-badge.component.ts:7-27`, `format-utils.service.ts:55-74`, `orders.component.ts:72-94`) | Task 6 a11y (role/label + test); Task 8 adoption on orders; Task 9 single source of style map |
| **SearchFilterToolbar** | PARTIAL | Yes — composes input+select+button | Barely — 2 files (doctors, patients); billing + change-requests hand-roll identical markup (`billing.component.html:53-81`, `change-requests.component.html:41-69`) | Yes — 11 tests incl. host wiring | Yes — `Composite/SearchFilterToolbar`, 4 stories | Gap — search field has **no accessible name** | Adoption low + 2 inline duplicates + a11y gap | Task 6 `searchAriaLabel`; Task 9 replace both inline copies |
| **DataTableToolbar** | PARTIAL | Thin but sound (title/subtitle + header-actions slot) | Partially — 4 files; **orders rebuilds its header inline** (`orders.component.html:1-61`) as do 5 other pages | Yes — 6 tests | Yes — `Composite/DataTableToolbar`, 3 stories (untracked) | OK — `<h1>` heading + projection | Header markup duplicated across ~19 pages, only 4 use the component; inventory falsely claims orders uses it | Task 8 adopt on orders; Task 11 fix inventory row; Task 13 commits story |
| **OrderSummaryCard** | PARTIAL | Yes but **6 of 13 inputs are dead** (`patient, doctor, clinic, subOrders, overallProgress, currentStage, stages` never rendered; `order-summary-card.component.ts:14-22`) | 1 file (`view-order`) | Weak — 1 test; spec sets inputs the template ignores | Yes — `Business/OrderSummaryCard`, 3 stories (untracked) | OK — `<dl>/<dt>/<dd>` semantics | Dead inputs = API lies; test asserts nothing meaningful | Task 10 remove dead inputs + fix spec; Task 12 strengthen tests; Task 13 commits story |
| **WorkflowTimeline** | PARTIAL | Mostly — but `@for (… track stage.status)` (`workflow-timeline.component.html:6`) throws on duplicate status | 1 file (`order-workflow`) | Weak — 1 test | Yes — `Business/WorkflowTimeline`, 4 stories | Gap — no `aria-current="step"` on active item | Fragile track key; aria gap; thin test | Task 6 aria-current + track fix; Task 12 strengthen tests |

No required component is MISSING, and none is dead. Composite/business adoption is the weak area: 7 hand-rolled duplicates of shared patterns exist (§1.8).

---

### 1.4 Order Management POC (`/orders`)

| Aspect | Status | Evidence | Gap | Action |
|---|---|---|---|---|
| Normal state | DONE | Real HTTP load: `order-data.service.ts:67-89` → `public/data/orders.json`; signal-driven filter/sort/pagination (`orders.component.ts:178-212`) | — | — |
| Loading state | PARTIAL | Skeleton markup real (`orders.component.html:222-228`) but reached only via a **hardcoded toggle** (`orders.component.html:40-60`) or `simulateRefresh()`'s `setTimeout` (`orders.component.ts:449-452`); service's real `loading` signal (`order-data.service.ts:24,28`) is never read by the page; first paint shows *empty*, not loading | State not reachable through authentic data flow | Task 7: derive state from service signals |
| Empty state | PARTIAL | Two empties: authentic filter-driven empty with working `clearAllFilters()` (`orders.component.html:271-296`) ✅; named "No orders yet" empty only reachable via fake toggle (`:229-250`) ❌ | Fake branch cannot occur organically | Task 7: data-driven |
| Error state | **WRONG** | Markup real (`:251-269`) but service `error` signal (`order-data.service.ts:25,29`) never bound; `retryLoad()` only flips a local signal (`orders.component.ts:454-456`) — **no reload happens**; contrast: `documents.component.html:113-122` binds its service error correctly | Unreachable except by toggle; retry is a no-op | Task 7: bind error, retry → `loadOrders()` |
| Responsive | DONE | Tailwind `sm:`/`lg:` prefixes, flex-wrap, `overflow-x` scroll region, `@media (max-width: 640px)` (`orders.component.scss:13-17`), reduced-motion guard (`orders.component.ts:241`); 3-viewport screenshots exist | Table is fixed 164rem with horizontal scroll (documented, acceptable) | Keep; evidence refreshed in Task 16 |
| Component reuse | PARTIAL | Uses `app-button` ×10, `app-search-input`, `app-select`, `app-arch-badge`, `app-enterprise-paginator`; does **not** use `app-data-table-toolbar`, `app-search-filter-toolbar`, `app-status-badge`, `app-table-feedback`/`empty-state`/`loading-state` | 4 of the required patterns hand-rebuilt on the flagship page | Tasks 8–9 |
| Data flow | PARTIAL | Service has real loading/error simulation but the page never consumes it | See loading/error rows | Task 7 |
| State screenshots | DONE (evidence) / UNVERIFIED as authentic | 4/4 PNGs in `evidence/states/`; `responsive-checklist.md:34` admits they came from the fake toggle | Evidence shows markup, not transition | Task 7 makes states authentic; Task 16 re-captures |

---

### 1.5 Storybook audit

| Item | Status | Evidence | Gap | Action |
|---|---|---|---|---|
| Config | DONE | `.storybook/main.ts` (angular-vite, addon-docs/a11y/vitest/onboarding), `preview.ts` imports global styles | Stale `src/**/*.mdx` glob → warning every build (`main.ts:5`) | Task 13 |
| Story coverage | DONE (exceeds) | 8 files / 38 stories / 8 docs pages; requirement is 2 basic + 1 composite + 1 business | — | — |
| Required components | DONE | 4 basic + 2 composite + 2 business all covered, with state/variant stories (loading, disabled, validation error, all-statuses, filter-active…) | — | — |
| Git hygiene | PARTIAL | `select`, `data-table-toolbar`, `order-summary-card` stories **untracked** | Committed snapshot has only 5 of 8 | Task 13 |
| Build evidence | PARTIAL / UNVERIFIED | `evidence/storybook/build-storybook.log` = success but emitted only **5** story chunks (12:36); current `storybook-static/` (14:58) has all 8 with no matching log | Log does not evidence current tree | Task 13 rebuild + refresh log |
| Screenshots | PARTIAL | 9 PNGs cover 5 components; 3 newer stories have none | Missing screenshots for select/data-table-toolbar/order-summary-card | Task 13 |
| A11y addon | PARTIAL | `preview.ts:18` `test: 'todo'` → report-only, never fails | No enforced a11y in Storybook | Task 13: attempt `test: 'error'`; document outcome |
| Dependency compatibility | DONE | Peers verified: storybook 10.6 + angular 21.0.9 + vite 8.3.1 + vitest 4.1.11 all satisfy ranges; Playwright chromium installed | Unpinned `latest` for `@chromatic-com/storybook`, `playwright`, `vite` (`package.json:55,74,78`) | Pin in Task 13 (record exact installed versions) |

---

### 1.6 Testing audit

| Requirement | Status | Evidence | Gap | Action |
|---|---|---|---|---|
| Test inventory | DONE | 53 spec files, 336 `it(` occurrences = `evidence/tests/test.log` `TOTAL: 336 SUCCESS`, EXIT 0, 2026-09-26 | — | — |
| Runner clarity | PARTIAL | `npm test` = Karma (`angular.json:87-90`, `karma.conf.js`); a second full stack (`vitest.config.ts`, `@storybook/addon-vitest`, `@vitest/coverage-v8`) is installed and type-checked but **no script runs it**; two coverage packages installed | Ambiguous/duplicated test tooling | Task 12: document which runner owns what; Task 13 pins versions |
| Tests for 4 basic components | DONE | button 12, input 13, select 3, status-badge 6 — all assert DOM behavior | select thin | Task 12 |
| Button interaction | DONE | `button.component.spec.ts:75-99` — click emits, disabled/loading do not emit, aria states | — | — |
| Input validation | PARTIAL | Error display tested (`input.component.spec.ts:52-72`); `aria-invalid`, `required`, end-to-end invalid path never asserted; real validators only at form level (`edit-order.component.spec.ts:30-48`) | Spec's "input validation" only partially covered | Task 12 |
| Filter interaction | DONE | `search-filter-toolbar.component.spec.ts:60-147` host-wiring test | — | — |
| Loading/empty state | DONE | `loading-state` 6 tests, `empty-state` 6 tests incl. action emission | Orders states untested authentically | Task 7 adds state tests |
| Focused/skipped/fake tests | DONE (clean) | Grep: 0 `fit/fdescribe/xit/xdescribe/.only/.skip`, 0 commented tests | 5 single-test specs assert only a rendered string (order-summary-card, workflow-timeline, order-data, doctor-details, patient-details) | Task 12 strengthens 3 of them |
| Evidence freshness | UNVERIFIED | Log is genuine and matches README, but 8 dirty files post-date it and no spec changes are pending | Re-run needed after code tasks | Task 16 |
| Coverage | MISSING | `karma.conf.js:20-24` configured, never enabled; no `coverage/`, no evidence | No coverage baseline | Task 12: run once, save `evidence/tests/coverage-summary.txt` (baseline, not a DoD gate) |
| Test matrix (8 categories) | MISSING | No matrix file; grep for `boundary|permission|retry|recovery` in `*.md` → 0 relevant hits; 6 of 8 categories unmapped | Deliverable gap | Task 12: `docs/test-matrix.md` + gap tests for permission/dependency-failure/boundary |

---

### 1.7 Accessibility and responsiveness — Implemented / Verified / Documented

| Area | Implemented | Verified | Documented | Notes / Gap |
|---|---|---|---|---|
| Keyboard navigation (tables) | Yes — sortable headers are buttons with `aria-label` (`orders.component.html:352-602`), commit `c269831` | Yes — walkthrough checklist + 2 focus screenshots | Yes — `keyboard-walkthrough-checklist.md`, `keyboard-walkthrough.json` | — |
| Focus visibility | Partial — per-component `focus-visible` Tailwind classes work; **global fallback broken** (`theme.scss:267-270` invalid `ring:` + `outline: none`, verified) | Partial — screenshots show focus on sort header | Documented as if complete | Task 5 fixes rule; Task 16 re-verifies |
| Labels / accessible names | Yes for input/select/button/dialog | Yes (axe 0 violations, 24 routes) | `axe-summary.md` | **`SearchFilterToolbar` search field has no accessible name** — axe cannot catch it if not scanned in that state; Task 6 |
| Semantic status | No — `StatusBadge` is a bare `<span>` | No dedicated check | No | Task 6: `role="status"` + `aria-label` |
| Dialogs | Yes — PrimeNG Dialog + CDK `cdkTrapFocus` (`entity-dialog.component.html:27`), 12 spec tests | Covered by axe dialog route-state | Yes | — |
| Forms / errors | Yes — `aria-invalid`, `aria-describedby`, error ids | Partly (screenshots `basic-apptextfield--with-validation-error.png`) | Storybook docs | `aria-invalid` untested (Task 12) |
| Disabled states | Visual only (`opacity: 0.5` hardcoded in 3 places, no token) | Not separately verified | No | Task 5 tokens |
| Workflow timeline | Partial — `<ol aria-label>` + `aria-hidden` markers | No | No | Task 6: `aria-current="step"` |
| Storybook a11y | Addon installed | Report-only (`test: 'todo'`) | No per-story evidence | Task 13 |
| Breakpoints / mobile / tablet / desktop | Yes — Tailwind `sm/md/lg/xl` used across templates; orders uses `sm:`+`lg:`; no CDK `BreakpointObserver` (not required) | Yes — 9 screenshots across 375/768/1440 + `overflow-results.json` + `sidebar-toggle-results.json` | `responsive-checklist.md` | Table relies on horizontal scroll at 375 (documented, acceptable) |
| Overflow / clipped content | Yes — `overflow-x` regions, min-width columns | Yes — `overflow-results.json` | Yes | — |
| Console / build errors | n/a | README gate: build EXIT 0 | `evidence/build/*` | Re-run in Task 16 |

---

### 1.8 Library responsibility and duplication findings

Declared division (`README.md:101-107`, `docs/technology-comparison.md:127-137`) is **respected at macro level**:

| Library | Actual usage (verified) | Verdict |
|---|---|---|
| PrimeNG | 16 imports: `p-table` ×18, `p-treetable`, `p-dialog`, `p-paginator`, Aura theme in `app.config.ts:23-31` — the enterprise widget workhorse | Correct, meaningful |
| Taiga UI | `TuiRoot` at app root + exactly 3 directives: `TuiButton` (button), `TuiStatus` (status-badge), `TuiLabel` (select) + i18n | Token-lean but real; **but** `tuiButton`/`tuiStatus` are visually overridden by Tailwind/inline styles — near-zero contribution (document this decision) |
| Angular CDK | drag-drop (workflow-board), `cdkTrapFocus` (entity-dialog), `cdk/menu` (view-order) | Narrow, correct. No Overlay/VirtualScroll/BreakpointObserver |
| Tailwind | 1,943 of 2,238 `class=` attributes; generated CSS committed (`src/styles/tailwind-generated.css`) | Dominant, correct |
| Signals/RxJS | Pervasive signals; RxJS in services + interceptor | Correct |

**Duplication / clean-architecture problems found (all flagged, none to be "fixed" beyond this plan):**

| ID | Finding | Evidence |
|---|---|---|
| D1 | Status palette implemented 3× | `status-badge.component.ts:7-27`, `format-utils.service.ts:55-74`, `orders.component.ts:72-94` (identical hex pairs) |
| D2 | Priority palette implemented 2× | `priority-badge.component.ts` `DOT_CLASSES` vs `format-utils.service.ts:76-84` |
| D3 | "Completed→Shipped" label logic 2× | `shared/utils/status-label.ts` vs `orders.component.ts:586-589` |
| D4 | Sort-a11y helper 2× | `shared/utils/sort-a11y.ts` vs `orders.component.ts:325-335` |
| D5 | Comparator 2× | `order-data.service.ts:7-16` (exported, 0 external users) vs `orders.component.ts:113-126` |
| D6 | SearchFilterToolbar hand-copied | `billing.component.html:53-81`, `change-requests.component.html:41-69` |
| D7 | Page-header markup hand-copied | `orders.component.html:2-10`, `documents:5`, `notifications:5`, `settings:3`, `clinic-details:13` (component used by only 4 pages) |
| D8 | Three loading/empty components coexist | `loading-state` + `empty-state` (dashboard/grid) vs `table-feedback` (6 pages) — no documented ownership rule |
| D9 | Raw `<button>` ×123 across 27 files | Many justified (sort headers, tabs, menus) but ~30 generic action buttons could be `app-button` (settings, dashboard, login) |
| D10 | Second styling system: `src/styles/utilities.scss` (1,086 lines, 151 selectors) — **64 of 106 class names referenced nowhere**; contradicts "Tailwind owns utility styling" | `utilities.scss` vs Tailwind; live subset: `input-base`, `label-base`, `select-base`, `enterprise-*` |
| D11 | Dead PrimeNG button CSS | `styles.scss:47-56` `.p-button*` overrides; `p-button` count in templates = 0 |
| D12 | Hand-rolled overlays in shell (no CDK Overlay) | `header.component.html:79-172` absolute divs + fixed click-catcher |
| D13 | Unused state-model types | `order.model.ts:88`, `sub-order.model.ts:66` — 0 usages |
| D14 | Docs contradict code | `ui-component-inventory.md:15,20,38`; `technology-comparison.md:35` claims PrimeNG "cards, badges" (0 `p-card`/`p-badge`) |

Dead code also includes: `OrderSummaryCard` 6 unused inputs; `order-data.service.ts` `applyFilters`/`statusCounts`/`priorityCounts` (0 usages); orders pagination API `firstPage/lastPage/prevPage/nextPage/rangeStart/rangeEnd` (template-invisible); `LUCIDE_INNERS`; ~25 unused model exports; unused deps `@taiga-ui/{cdk,layout,event-plugins,polymorpheus}`, `@ng-web-apis/*` (verify peer status before any removal).

---

### 1.9 Mandatory deliverables and Definition of Done

| # | Deliverable | Status | Action |
|---|---|---|---|
| 1 | UI component inventory | PARTIAL | Task 11 |
| 2 | Weighted matrix + references + AI Output Comparison Pack | WRONG / PARTIAL | Tasks 3, 4 (pack slots completed as templates; execution human) |
| 3 | React + KendoReact spike | MISSING → **decided deviation** | Task 3 scope-exception record |
| 4 | React + MUI spike | MISSING → **decided deviation** | Task 3 |
| 5 | Vue 3 + Vuetify spike | MISSING → **decided deviation** | Task 3 |
| 6 | Design tokens + component architecture | PARTIAL / MISSING | Tasks 5, 1 |
| 7 | Required components | DONE (naming PARTIAL) | Task 2 |
| 8 | Responsive demo page | DONE | — (evidence refresh Task 16) |
| 9 | Documentation + required Storybook | PARTIAL | Tasks 1, 13 |
| 10 | Automated tests + a11y/responsive review | PARTIAL | Tasks 6, 12, 16 |
| 11 | Final recommendation + presentation | MISSING | Task 15 |
| 12 | README, AI usage log, contribution summary | DONE / PARTIAL / PARTIAL | Tasks 14, 15 |

**Definition of Done checkpoint (spec §7):**

- [ ] Three candidates run as spikes — *decided deviation → documented research + scope exception (Task 3)*
- [ ] Matrix weights = 100%, every score justified, Telerik licensing documented, AI at 15% in-table — Task 3
- [ ] All three candidates evaluated under same AI conditions with full evidence — **protocol frozen (Task 4); runs pending human execution — recorded, never fabricated**
- [ ] Final library uses approved stack with justified choice — Task 15 (recommendation)
- [ ] Central tokens applied to all required components — Task 5
- [ ] 4 basic + 2 composite + 2 business working and responsive — Tasks 2, 6, 8
- [ ] Loading/empty/error visible **and authentic**; required tests and Storybook examples pass — Tasks 7, 12, 13
- [ ] README, AI usage log, Git history, contribution summary, recommendation, demo, presentation complete — Tasks 14, 15, 16

**OPTIONAL (not required; do not start before core DoD is green):** dark mode already present via `ThemeService`; RTL readiness; Storybook coverage for all 19 shared components; visual-regression suite; i18n; package publishing; advanced grid features; performance profiling; CI pipeline; coverage-percentage gate.

---

### 1.10 Decided deviations (recorded per spec §11, require mentor sign-off at checkpoint)

| ID | Deviation | Decision | Recorded in |
|---|---|---|---|
| DEV-1 | Stack: React+TS+KendoReact\|MUI → Angular 21 + PrimeNG/Taiga/CDK/Tailwind | Approved project stack; substitution accepted for DoD item "final library uses React+TS" | `docs/scope-exceptions.md` (Task 3), recommendation (Task 15) |
| DEV-2 | Three runnable spikes → evidence-based research docs | Decided 2026-09-26; no React/Vue scaffolding unless later requested | `docs/scope-exceptions.md` (Task 3) |
| DEV-3 | Team size 1 vs spec's 2–3 interns | Single-author truth preserved; no invented contributors/reviews | `CONTRIBUTION_SUMMARY.md` + `docs/scope-exceptions.md` (Task 14) |
| DEV-4 | AI 15% controlled runs | Protocol frozen and templated; **execution pending human**; DoD item stays open until run | `docs/ai-comparison-protocol.md` (Task 4), README limitations |
| DEV-5 | Spec doc `baf6019` deletions | Not restored; required content recreated fresh in current docs | Task 1 / Task 15 |

---

## PART 2 — IMPLEMENTATION PLAN

## Global Constraints

- Approved stack only: Angular 21, TypeScript, Signals + RxJS, PrimeNG, Taiga UI, Tailwind, Angular CDK. **No React/Vue code, no migration suggestions, no new libraries.**
- Component class names must become: `AppButtonComponent`, `AppTextFieldComponent`, `AppSelectComponent`, `StatusBadgeComponent`, `SearchFilterToolbarComponent`, `DataTableToolbarComponent`, `OrderSummaryCardComponent`, `WorkflowTimelineComponent`. **Selectors (`app-button`, `app-input`, `app-select`, `app-status-badge`, …) and observable behavior stay unchanged.**
- Candidate matrix: exactly 8 criteria, **AI-Assisted Development Effectiveness = 15% inside the table**, table sums to **100%**, every score has a written justification, framework (React/React/Vue 3) and component library (KendoReact/MUI/Vuetify) scored as separate axes.
- AI rubric inside the protocol/scoresheet: requirement understanding 20%, UI/UX 20%, framework/library use 20%, responsiveness+a11y 15%, code quality 15%, manual corrections+hallucination 10% = 100%.
- **Never fabricate**: AI outputs, scores, screenshots, test results, a11y results, approvals, contributors. Pending = marked pending.
- No credentials, tokens, or real patient/customer/order data in code, screenshots, prompts, or logs. Sanitized data only (`public/data/*.json`).
- Test baseline: **336 passing**; any task may only grow this number. Gates per code task: `npm run lint` + `npm test -- --watch=false --browsers=ChromeHeadless`. Full gate set (build, storybook, axe) at Task 16.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`), one per task (or logical step group), never commit `node_modules`, `dist/`, `storybook-static/`.
- No unrelated UI changes. Visual diffs are expected only where the plan names them (orders header/states, status badges on orders, focus ring).

## Review Focus

Five failure modes most likely to bite, each pinned to the task that owns it:

1. **Class rename breaking consumers, specs, or stories** (23+ import sites) — pinned by Task 2's mandatory full lint+test+build verification before commit.
2. **Orders state rewiring breaking existing pagination/filter behavior** (19 existing orders tests; `pageData()` currently gated on `viewState`) — pinned by Task 7's tests for loading/error/empty plus the unchanged 19.
3. **Global focus fix changing keyboard focus app-wide / axe results** — pinned by Task 5 verification (build + tests) and Task 16's fresh axe scan + keyboard checklist.
4. **StatusBadge adoption on `/orders` changing status text/colors** (e.g. `Completed` → label "Shipped") — pinned by Task 8 test asserting rendered labels for every order status present in `public/data/orders.json`.
5. **Dead-code removal deleting still-referenced symbols** (model barrel re-exports, `utilities.scss` classes used only in generated CSS) — pinned by Task 10's grep-verify + full build + full test gate before commit.

---

### Task 1: Component architecture and naming rules document

**Files:**
- Create: `docs/component-architecture.md`
- Modify: none code

**Interfaces:**
- Consumes: current structure of `src/app/{core,shared,features}` and the final class names from Global Constraints (document the target naming even though Task 2 renames later).
- Produces: the naming/wrapper rules that Tasks 2, 8, 9, 10 follow; README will link to it in Task 15.

- [ ] **Step 1: Write `docs/component-architecture.md`** with these five required sections:
  1. **Folder structure** — `core/{guards,interceptors,layout,models,services}`, `shared/{components,icons,pipes,utils}`, `features/<name>` with lazy `loadComponent` routes from `app.routes.ts`; where tests and stories live.
  2. **Naming** — file pattern `x.component.{ts,html,scss}` + `x.component.spec.ts` + `x.stories.ts`; selector `app-kebab`; class `PascalCase + Component`; **spec-name mapping table**: AppButton→`AppButtonComponent`/`app-button`, AppTextField→`AppTextFieldComponent`/`app-input`, AppSelect→`AppSelectComponent`/`app-select`, StatusBadge→`StatusBadgeComponent`/`app-status-badge`, plus the 4 composite/business names; Storybook titles `Basic/`, `Composite/`, `Business/`.
  3. **Wrapper rules** — PrimeNG = enterprise data widgets (`p-table`, `p-treetable`, `p-dialog`, `p-paginator`); Taiga = root `tui-root` + i18n, `TuiButton`/`TuiStatus`/`TuiLabel` inside `app-*` wrappers only (state explicitly that Tailwind/inline styles own their visuals); CDK = drag-drop, focus trap, menu; Tailwind = utility styling (and that `styles/utilities.scss` live classes are the sanctioned non-Tailwind exception until removed); all form controls go through `app-input`/`app-select`/`app-button` — raw `<button>` only for structural controls (sort headers, tabs, menus); when to wrap (unstable 3rd-party API, a11y forwarding, shared states) vs use directly (one-off data widgets).
  4. **Component interfaces** — signal `input()`/`input.required()`/`model()`/`output()`; form controls implement `ControlValueAccessor`; every interactive control requires an accessible-name input; loading/empty/error ownership rule resolving D8: `app-table-feedback` = in-table states, `app-loading-state`/`app-empty-state` = page-level, service signals are the single source of truth.
  5. **Documentation approach** — Storybook docs pages as component documentation, inventory = `docs/ui-component-inventory.md`, decisions = `docs/*`, evidence = `evidence/*`.
- [ ] **Step 2: Self-verify against spec §4/§5 (Phase 4)** — confirm all five topics exist and the mapping table lists all 8 required components. Expected: 5/5 sections present.
- [ ] **Step 3: Commit**

```bash
git add docs/component-architecture.md
git commit -m "docs: add component architecture and naming rules"
```

---

### Task 2: Rename basic component classes to spec names

**Files:**
- Modify: `src/app/shared/components/button/button.component.ts` (+ `.spec.ts`, `.stories.ts`)
- Modify: `src/app/shared/components/input/input.component.ts` (+ `.spec.ts`, `.stories.ts`)
- Modify: `src/app/shared/components/select/select.component.ts` (+ `.spec.ts`, `.stories.ts`)
- Modify: every consumer importing these classes (~23 files for button, ~15 for input, ~11 for select — find with `rg -l "ButtonComponent|InputComponent|SelectComponent" src`)

**Interfaces:**
- Consumes: Global Constraints naming table.
- Produces: classes `AppButtonComponent`, `AppTextFieldComponent`, `AppSelectComponent`; exported `SelectOption` type from `select.component.ts`; selectors and templates unchanged. Tasks 6–13 import these names.

- [ ] **Step 1: Record baseline**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: `TOTAL: 336 SUCCESS`

- [ ] **Step 2: Rename symbols (exact pairs)**

`ButtonComponent` → `AppButtonComponent`; `InputComponent` → `AppTextFieldComponent`; `SelectComponent` → `AppSelectComponent`. Rename class declarations, imports, `TestBed` declarations, story `component:` references, and `describe()` strings. Do **not** change selectors, file paths, or `StatusBadgeComponent` (already compliant).

- [ ] **Step 3: Export the option type**

In `select.component.ts` add: `export interface SelectOption { label: string; value: unknown }` and use it for the `options` input type (currently inline at `select.component.ts:13`).

- [ ] **Step 4: Verify**

Run: `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build`
Expected: lint clean; `TOTAL: 336 SUCCESS`; build EXIT 0.

- [ ] **Step 5: Commit**

```bash
git add -A src/app
git commit -m "refactor(shared): rename basic components to AppButton/AppTextField/AppSelect spec names"
```

---

### Task 3: Candidate comparison matrix, Telerik licensing review, scope exceptions

**Files:**
- Rewrite: `docs/weighted-comparison-matrix.md`
- Create: `docs/deliverable-scoring.md` (move the current project-deliverable rubric there unchanged)
- Create: `docs/licensing-review.md`
- Create: `docs/scope-exceptions.md`

**Interfaces:**
- Consumes: DEV-1/DEV-2 decisions (§1.10).
- Produces: candidate matrix with AI-15% in-table (DoD gate); licensing evidence; `docs/scope-exceptions.md` which Task 14 extends with DEV-3/DEV-4.

- [ ] **Step 1: Fetch current official licensing sources** (webfetch): KendoReact licensing FAQ / license pages (progress.com/telerik), MUI licensing (mui.com/about), Vuetify licensing (vuetifyjs.com). Record retrieval date 2026-09-26 and URL for each.
- [ ] **Step 2: Write `docs/deliverable-scoring.md`** — cut the existing 7-row project rubric from `weighted-comparison-matrix.md` verbatim (it is the spec §9 evaluation rubric and is still valid).
- [ ] **Step 3: Rewrite `docs/weighted-comparison-matrix.md`** as the candidate-selection matrix:
  - Rows = 3 candidates: `React + KendoReact`, `React + Material UI`, `Vue 3 + Vuetify`.
  - Explicit preamble separating axes: *frontend technology* (React, React, Vue 3) vs *component library* (KendoReact, MUI, Vuetify) — states they are not equivalent product categories (spec §12 first mistake).
  - Criteria columns, weights: Technical suitability 20, Licensing & cost 15, Accessibility (library-level) 10, Maintainability 10, Team fit 10, Dependency/lock-in risk 10, Ecosystem maturity 10, **AI-Assisted Development Effectiveness 15** = **100%**.
  - Every candidate×criterion cell: score + one-line justification + evidence/source citation.
  - AI-15% row links to `docs/ai-comparison-protocol.md` and is marked `PENDING HUMAN EXECUTION` with the contribution formula `protocol_score / 100 × 15%` (no invented number).
  - Research-only caveat: evidence-based comparison for the record; organizational stack decision already approved (DEV-1).
- [ ] **Step 4: Verify the arithmetic** — sum the weight column and confirm 100 and that 15 appears exactly once as AI-Assisted. Expected: `100%`.
- [ ] **Step 5: Write `docs/licensing-review.md`** — free vs paid KendoReact component coverage, trial behavior, license types, npm package licensing implications, long-term dependency risk, contrast with MIT (MUI core, Vuetify, Angular/PrimeNG community edition), each claim cited with URL + retrieval date; section "Implication for this POC" referencing DEV-1.
- [ ] **Step 6: Write `docs/scope-exceptions.md`** — DEV-1 and DEV-2 tables from §1.10, each with: spec requirement, decision, rationale (Angular approved stack), approver placeholder `Pending: mentor @ Checkpoint 2`.
- [ ] **Step 7: Commit**

```bash
git add docs/weighted-comparison-matrix.md docs/deliverable-scoring.md docs/licensing-review.md docs/scope-exceptions.md
git commit -m "docs: add candidate matrix with AI 15%, Telerik licensing review, scope exceptions"
```

---

### Task 4: Freeze the AI-comparison protocol and scaffold per-candidate evidence

**Files:**
- Modify: `docs/ai-comparison-protocol.md`
- Restructure: `evidence/ai-comparison/` → keep `README.md` at root; create `evidence/ai-comparison/{react-kendo,react-mui,vue-vuetify}/` each containing the 9 slot templates + `screenshots/`

**Interfaces:**
- Consumes: matrix AI-15% row from Task 3 (same rubric, same status).
- Produces: frozen protocol that the human executes three times; per-candidate evidence folders; nothing scored.

- [ ] **Step 1: Amend §1.1 (frozen sanitized requirement)** so it explicitly requires all six elements: button, search input, status indicator, **data table**, **confirmation dialog**, responsive layout (current Promo Banners spec has a card grid and no confirm step — add a banner data table and a confirmation dialog on disable/delete).
- [ ] **Step 2: Amend §1.4 (locked conditions)** — same approved AI tool + model for all three candidates, recorded in the protocol header **before the first run** and never changed; identical base prompt, context bundle, 60-minute allowance, 3-iteration limit; run order and timestamps logged. Keep the anti-fabrication §5 unchanged.
- [ ] **Step 3: Add §4 "Per-candidate runs"** — for each candidate: assigned stack, run date/time, tool+model string, iteration log. States that outputs must be produced in that stack's own project (out-of-repo sandbox) and only sanitized artifacts land in `evidence/`.
- [ ] **Step 4: Create the three evidence partitions** — copy the 9 templates (`initial-output`, `corrected-output`, `build-test-results`, `a11y-findings`, `hallucinated-apis`, `manual-corrections`, `effort-log`, `scoresheet`, plus `prompts.md`) into each candidate folder; `scoresheet.md` must carry the 20/20/20/15/15/10 = 100% weights with blank Score/Weighted columns; `screenshots/` subfolder with a README listing required captures (1440/768/375, initial and corrected). Update root `evidence/ai-comparison/README.md` to point at the three partitions and mark all slots `EMPTY — AWAITING HUMAN EXECUTION`.
- [ ] **Step 5: Verify** — grep the protocol for `data table` and `confirmation dialog` (present), confirm rubric sums 100, confirm no slot contains invented results. Expected: all slots still empty and explicitly marked pending.
- [ ] **Step 6: Commit**

```bash
git add docs/ai-comparison-protocol.md evidence/ai-comparison
git commit -m "docs: freeze AI comparison protocol with six-element requirement and per-candidate evidence slots"
```

---

### Task 5: Design tokens — disabled state, focus fix, namespace note

**Files:**
- Modify: `src/styles/tokens.scss`, `src/styles/theme.scss`, `src/styles/utilities.scss`
- Modify: `src/styles.scss` only if a disabled override lives there

**Interfaces:**
- Consumes: existing token categories (spec §4: color, typography, spacing, radius, shadows, focus, disabled, breakpoints).
- Produces: CSS variables `--disabled-background`, `--disabled-foreground`, `--disabled-border`, `--disabled-opacity` (light + dark); valid global `:focus-visible`; consumed by Task 6/8 components.

- [ ] **Step 1: Add disabled tokens** in `tokens.scss` (SCSS vars + `:root` + `[data-theme="dark"]` CSS custom properties) following the existing pattern of `--ring`/`--muted`.
- [ ] **Step 2: Fix the global focus rule** in `theme.scss:267-270` — replace the invalid block with:

```scss
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Consume the tokens** — replace hard-coded disabled styling with vars at `utilities.scss:141` (`.input-base:disabled`), `:209` (`.btn-base:disabled`), `:712` (`.enterprise-page-nav:disabled`), and any other `opacity: 0.5` disabled rule found by `rg "disabled" src/styles`.
- [ ] **Step 4: Document the dual namespace** — add a header comment in `tokens.scss`: `--color-*` = Tailwind `@theme` bridge, unprefixed `--*` = app/PrimeNG layer; do not consolidate in this POC (visual-regression risk), record as known inconsistency in the architecture doc note appended to `docs/component-architecture.md` §Documentation.
- [ ] **Step 5: Verify**

Run: `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build`
Expected: 336 SUCCESS, build EXIT 0; `rg "ring-offset|ring: 2px" src/styles` returns nothing.

- [ ] **Step 6: Commit**

```bash
git add src/styles docs/component-architecture.md
git commit -m "feat(tokens): add disabled-state tokens and fix global focus-visible rule"
```

---

### Task 6: Component accessibility fixes (TDD)

**Files:**
- Test: `src/app/shared/components/search-filter-toolbar/search-filter-toolbar.component.spec.ts`, `.../status-badge/status-badge.component.spec.ts`, `.../workflow-timeline/workflow-timeline.component.spec.ts`
- Modify: `src/app/shared/components/search-filter-toolbar/search-filter-toolbar.component.{ts,html}`, `.../status-badge/status-badge.component.html`, `.../workflow-timeline/workflow-timeline.component.html`

**Interfaces:**
- Consumes: `AppButtonComponent`/`AppTextFieldComponent` names (Task 2), tokens (Task 5).
- Produces: new optional input `searchAriaLabel` on `SearchFilterToolbarComponent`; `role="status"` + accessible name on `StatusBadgeComponent`; `aria-current="step"` on active timeline item. Tasks 8, 12, 13 rely on these.

- [ ] **Step 1: Write the three failing tests**
  - `search-filter-toolbar`: "should forward an accessible name to the search input" — set `searchAriaLabel`, assert `app-input` receives matching `ariaLabel` (host fixture pattern already in this spec).
  - `status-badge`: "should expose status semantics to assistive tech" — assert root element has `role="status"` and `aria-label` containing the status label.
  - `workflow-timeline`: "should mark the active stage with aria-current" — set `currentIndex`, assert `aria-current="step"` on that item only.
- [ ] **Step 2: Run and confirm failure** — `npm test -- --watch=false --browsers=ChromeHeadless` → 3 new tests FAIL, 336 old PASS.
- [ ] **Step 3: Implement**
  - `search-filter-toolbar.component.ts`: `readonly searchAriaLabel = input<string>("")`; bind `[ariaLabel]="searchAriaLabel() || 'Search'"` on the `app-input` in the template (`:11-18`).
  - `status-badge.component.html`: add `role="status"` and `[attr.aria-label]="label() || status()"` to the root span.
  - `workflow-timeline.component.html`: add `[attr.aria-current]="i === currentIndex() ? 'step' : null"` to the stage item; also change `@for (… track stage.status)` to `track stage` **only if** stages carry a unique `id` — otherwise `track $index` (fixes the duplicate-key crash noted in §1.3).
- [ ] **Step 4: Run and confirm green** — `npm test -- --watch=false --browsers=ChromeHeadless` → `TOTAL: 339 SUCCESS`.
- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components
git commit -m "fix(a11y): accessible name for toolbar search, status semantics, timeline aria-current"
```

---

### Task 7: Order Management POC — authentic loading/empty/error/retry (TDD)

**Files:**
- Test: `src/app/features/orders/orders.component.spec.ts`
- Modify: `src/app/features/orders/orders.component.ts`, `orders.component.html`
- Modify: `src/app/core/services/order-data.service.ts`, `src/app/core/models/order.model.ts`

**Interfaces:**
- Consumes: service signals `OrderDataService.loading`, `.error`, `.orders` (already exist, `order-data.service.ts:23-29`); `OrdersViewState` type from `core/models/order.model.ts:88` (currently unused — adopt it and delete the local union at `orders.component.ts:55`).
- Produces: service-level preview API + `reload()`; page state derived from service; other tasks keep the state switcher for evidence capture.

- [ ] **Step 1: Write failing tests** (append to `orders.component.spec.ts`, which already has 19):
  1. "should show the loading state while the service is loading" — set service loading true → assert loading branch (`.skeleton` / `[role="status"]` container) rendered.
  2. "should show the error state when the service reports an error" — set service error → assert error branch + retry button present.
  3. "should reload orders on retry" — click retry → `spyOn(service, 'reload')` called; error cleared after reload resolves.
  4. "should show the empty state when no orders match the dataset" — service orders set to `[]` → assert empty branch.
  5. "should show the normal table when data is loaded" — existing behavior retained (fold into #1–4 asserts as needed).
- [ ] **Step 2: Run and confirm failure** — new tests FAIL (state is still a local signal).
- [ ] **Step 3: Extend `OrderDataService`**
  - `reload(): void` → re-invokes the existing `loadOrders()` (clears error, sets loading).
  - `previewState(state: 'normal' | 'loading' | 'empty' | 'error'): void` — **POC-only evidence control living in the service** so markup and service state can never disagree: `loading` holds loading true; `error` sets `_error`; `empty` temporarily empties `_orders`; `normal` reloads. Document as POC-only with a `// POC evidence control` note.
- [ ] **Step 4: Rewire `OrdersComponent`**
  - Replace local `viewState` signal with `readonly viewState = computed<OrdersViewState>(() => …)` derived from `this.orderService.loading/error/orders()` (order: loading → error → empty → normal).
  - `setViewState(s)` → `this.orderService.previewState(s)`; `simulateRefresh()` → `this.orderService.reload()` (delete the `setTimeout`); `retryLoad()` → `this.orderService.reload()` (fixes the no-op at `orders.component.ts:454-456`).
  - Remove the `if (this.viewState() !== "normal") return [];` gate in `pageData()` (`:207`) — filtering now naturally yields `[]` when data is empty.
  - Adopt `OrdersViewState` from `core/models/order.model.ts:88`; delete the local type (`:55`).
- [ ] **Step 5: Update the toolbar switcher** (`orders.component.html:40-60`) — keep the 4-button control (evidence screenshots depend on it) but relabel its `aria-label` to "Preview data states (POC control)" and have it drive `setViewState` (now service-backed). The toggle switches **service state**, not markup.
- [ ] **Step 6: Run and confirm green** — `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless` → 336 + new tests all PASS (adjust any of the old 19 that asserted the local-signal behavior; note each adjustment in the commit body).
- [ ] **Step 7: Commit**

```bash
git add src/app/features/orders src/app/core
git commit -m "fix(orders): derive page states from service signals and make retry reload data"
```

---

### Task 8: Adopt shared components on the orders page

**Files:**
- Modify: `src/app/features/orders/orders.component.ts`, `orders.component.html`
- Test: `src/app/features/orders/orders.component.spec.ts`

**Interfaces:**
- Consumes: `DataTableToolbarComponent` (title/subtitle/`[header-actions]` slot), `StatusBadgeComponent` (+ Task 6 semantics), `AppTextFieldComponent` names, shared `sort-a11y.ts` and `status-label.ts`, `app-table-feedback` / `app-empty-state`.
- Produces: orders header rendered via `app-data-table-toolbar`; status cells via `app-status-badge`; shared util usage that Task 9 generalizes.

- [ ] **Step 1: Header → `app-data-table-toolbar`** — replace the hand-built header block (`orders.component.html:1-61`) with the component: `title="Orders"`, subtitle = count text, existing buttons + the state switcher projected into `[header-actions]`. Keep all button handlers unchanged.
- [ ] **Step 2: Status cells → `app-status-badge`** — replace inline `<span class="treetable-status-surface" [ngStyle]="orderStatusBlockStyle(...)">` (and the sub-order equivalent) with `<app-status-badge [status]="…">`; delete `ORDER_STATUS_BLOCK_STYLES`/`SUB_ORDER_STATUS_BLOCK_STYLES` (`orders.component.ts:72-94`) **after** confirming every status string present in `public/data/orders.json` exists in the badge's style map — extend the shared map first if any are missing (Task 9 owns the single map; here just consume `StatusBadgeComponent`).
- [ ] **Step 3: Shared helpers** — replace `sortAriaSort()`/`sortAriaLabel()` (`orders.component.ts:325-335`) with `shared/utils/sort-a11y.ts`; replace `orderStatusLabel()` (`:586-589`) with `shared/utils/status-label.ts`.
- [ ] **Step 4: State markup → shared components** — replace the hand-written empty branch (`orders.component.html:271-296`) with `app-empty-state` (+ clear-filters action) and the in-table loading/error rows with `app-table-feedback` (extend `table-feedback` with an `error` mode first — `table-feedback.component.ts:13` currently only supports `loading|empty`, which is also inventory row error). Keep the skeleton rows only if `app-loading-state` cannot express them; prefer the shared component.
- [ ] **Step 5: Tests** — add: "should render a status badge for each order status" (assert `app-status-badge` count > 0 and label text matches `statusDisplayLabel`), "should render the shared page header", "should render the shared empty state when filters match nothing". Keep all prior orders tests green.
- [ ] **Step 6: Verify** — `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build` → all green; **visual change expected** on `/orders` header/status columns (screenshots recaptured in Task 16).
- [ ] **Step 7: Commit**

```bash
git add src/app/features/orders src/app/shared/components
git commit -m "refactor(orders): adopt DataTableToolbar, StatusBadge, and shared state components"
```

---

### Task 9: App-wide duplication consolidation

**Files:**
- Create: `src/app/shared/utils/status-styles.ts`, `src/app/shared/utils/priority-styles.ts`
- Modify: `src/app/shared/components/status-badge/status-badge.component.ts`, `src/app/shared/components/priority-badge/priority-badge.component.ts`, `src/app/core/services/format-utils.service.ts`, `src/app/features/workflow-board/workflow-board.component.ts`, `src/app/features/billing/billing.component.{ts,html}`, `src/app/features/change-requests/change-requests.component.{ts,html}` (+ their specs)
- Test: new `src/app/shared/utils/status-styles.spec.ts`

**Interfaces:**
- Consumes: existing maps at `status-badge.component.ts:7-27`, `format-utils.service.ts:55-84`, `priority-badge.component.ts`.
- Produces: `statusStylesFor(status: string): StatusStyle`, `priorityDotClass(priority: string): string`, `statusDisplayLabel(status: string): string` (re-exported from existing `status-label.ts`) as the single sources; `format-utils` delegates; both inline toolbars replaced.

- [ ] **Step 1: Failing test** — `status-styles.spec.ts`: "should define styles for every status used by dashboard and orders" (import both consumers' status lists, assert `statusStylesFor` returns a non-empty pair for each).
- [ ] **Step 2: Create shared style modules** — move `STATUS_STYLES` → `status-styles.ts` and `DOT_CLASSES` → `priority-styles.ts`; make `StatusBadgeComponent`, `PriorityBadgeComponent`, and `FormatUtilsService.getStatusStyles/getPriorityColor` delegate to them (public method signatures unchanged so 35 dependents keep compiling).
- [ ] **Step 3: Replace inline toolbars** — `billing.component.html:53-81` and `change-requests.component.html:41-69`: delete the hand-rolled `enterprise-toolbar` markup and render `<app-search-filter-toolbar>` with equivalent bindings (search placeholder, options, action label); wire `searchValueChange`/`selectValueChange`/`actionClick` to the existing handlers; add `searchAriaLabel` (Task 6). Update both specs if they query the old inline inputs.
- [ ] **Step 4: Verify** — `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless` → green; `rg "STATUS_STYLES|DOT_CLASSES|getPriorityColor" src` shows definitions in exactly one file each.
- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "refactor(shared): single source for status/priority styles; adopt SearchFilterToolbar on billing and change-requests"
```

---

### Task 10: Dead code removal

**Files:**
- Modify: `src/app/shared/components/order-summary-card/order-summary-card.component.{ts,html,spec.ts}`
- Modify: `src/app/core/services/order-data.service.ts` (+ spec), `src/app/features/orders/orders.component.{ts,spec.ts}`
- Modify: `src/app/core/models/*.ts`, `src/styles/utilities.scss`, `src/styles.scss`
- Modify: `src/app/shared/icons/lucide-icons.ts`

**Interfaces:**
- Consumes: verified usage greps (Step 1).
- Produces: smaller public APIs; `OrderSummaryCardComponent` inputs reduced to those actually rendered; no behavior change.

- [ ] **Step 1: Verify each removal target by grep** (record output in the commit body):
  - `order-summary-card` unused inputs: `patient|doctor|clinic|subOrders|overallProgress|currentStage|stages` → 0 template matches.
  - `order-data.service.ts`: `applyFilters`, `statusCounts`, `priorityCounts` → 0 usages (keep `compareValues` only if Task 8/9 now imports it — otherwise remove).
  - `orders.component.ts`: `firstPage|lastPage|prevPage|nextPage|rangeStart|rangeEnd|visiblePageNumbers|onSearchChange|onPriorityChange|onPageSizeChange|hasChildren|onNodeExpand|onNodeCollapse` → 0 template matches; remove the spec cases that exercise them (`orders.component.spec.ts:169-182`) as testing dead code.
  - `LUCIDE_INNERS` → 0 usages.
  - Model exports listed in §1.8 (≈25 unused types incl. `OrderFilters`, `OrderTableState`, `SubOrderViewState`, tooth constants) → 0 usages; delete from files **and** from `core/models/index.ts` barrel.
  - `utilities.scss`: remove only selectors with 0 matches across `src/**/*.{html,ts}` **and** 0 matches in `src/styles.scss`/`utilities.scss` self-`@extend` chains (the 64-name list from §1.8 D10); keep `input-base`, `label-base`, `select-base`, `enterprise-*`, `showcase-*`, `truncate-1`.
  - `styles.scss:47-56` `.p-button*` overrides → `p-button` count is 0.
- [ ] **Step 2: Remove** the verified items; for `OrderSummaryCardComponent` delete the dead inputs and the spec lines that set them.
- [ ] **Step 3: Verify (Review Focus #5)** — `rg "<removed-symbol>" src` returns 0 for each; then `npm run lint && npm test -- --watch=false --browsers=ChromeHeadless && npm run build && npm run build-storybook`. Expected: tests ≥339 green, both builds EXIT 0.
- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "chore: remove verified dead code, unused model exports, and orphan style rules"
```

*(Dependency note: do **not** remove `@taiga-ui/*` or `@ng-web-apis/*` from `package.json` in this task — run `npm ls <pkg>` first and skip any package required as a peer. If all are safe, do it in a separate commit.)*

---

### Task 11: UI inventory correction

**Files:**
- Modify: `docs/ui-component-inventory.md`

**Interfaces:**
- Consumes: code truths from Tasks 2–9 (final class names, orders header/status adoption, `table-feedback` error mode if added in Task 8).
- Produces: accurate inventory (deliverable 1).

- [ ] **Step 1: Add provenance section** — state the sanitized sources explicitly (current repository snapshot = sanitized CRM and Customer Portal surfaces: orders, patients, doctors, clinics, billing, documents, etc.), map rows to those surfaces, and confirm no confidential data.
- [ ] **Step 2: Fix wrong rows** — `:15` (DataTableToolbar usage: remove "Orders" until Task 8 lands, then keep), `:16` (SearchFilterToolbar = doctors, patients, billing, change-requests), `:20` (TableFeedback modes — include `error` only if Task 8 added it), `:38` (order-workflow does **not** use CDK drag/drop; workflow-board does).
- [ ] **Step 3: Rewrite the "Observed Inconsistency" column** — every row states a genuine inconsistency or "none observed" (no usage notes).
- [ ] **Step 4: Verify** — resolve every cited path (`Test-Path`) and `rg` each claimed consumer selector. Expected: 0 broken paths, 0 false claims.
- [ ] **Step 5: Commit**

```bash
git add docs/ui-component-inventory.md
git commit -m "docs: correct inventory rows, add sanitized-source provenance"
```

---

### Task 12: Test matrix and gap tests

**Files:**
- Create: `docs/test-matrix.md`
- Test: `src/app/shared/components/input/input.component.spec.ts`, `.../select/select.component.spec.ts`, `.../order-summary-card/order-summary-card.component.spec.ts`, `.../workflow-timeline/workflow-timeline.component.spec.ts`, `src/app/core/guards/auth.guard.spec.ts` (new), `src/app/core/interceptors/auth.interceptor.spec.ts` (new), `src/app/core/services/order-data.service.spec.ts`, `src/app/features/orders/orders.component.spec.ts` (boundary)
- Create: `evidence/tests/coverage-summary.txt`

**Interfaces:**
- Consumes: 53 existing specs; Task 6/7/8/9 tests.
- Produces: matrix mapping all 8 spec categories; tests for permission/security, dependency-failure, boundary, invalid; coverage baseline.

- [ ] **Step 1: Write `docs/test-matrix.md`** — rows = 8 categories (normal, empty, invalid, boundary, permission/security, dependency-failure, retry, recovery), columns = surfaces (shared basics, toolbars, orders page, forms, auth, services), each cell cites the exact spec file::test name or evidence artifact; cells with no coverage marked `GAP` and wired to Step 2.
- [ ] **Step 2: Add failing gap tests** (write all first, confirm FAIL):
  - **Invalid** — `input.component.spec.ts`: "should set aria-invalid when an error is present" and "should mark required fields" (`required` input → `aria-required`/`required` attribute).
  - **Permission/security** — `auth.guard.spec.ts`: allows navigation with `localStorage['dentalab-auth']`, redirects to `/login` without it; `auth.interceptor.spec.ts`: attaches `Authorization: Bearer …` when a token exists, sends no header otherwise.
  - **Dependency-failure** — `order-data.service.spec.ts`: `HttpClient` error → `error()` signal set, `loading()` false, `orders()` empty (`expectOne` + `flush error`).
  - **Retry/recovery** — already added in Task 7 (cite it); add "reload after error recovers to normal".
  - **Boundary** — `orders.component.spec.ts`: page size boundary (requesting page beyond last → clamps to last page), filter yielding exactly one row, search matching case-insensitively at string edges.
  - **Thin specs** — expand `order-summary-card` (renders order id, amounts, progress; renders no-progress branch) and `workflow-timeline` (renders stage list, active stage, empty-stages branch) beyond their single string assertions; add 2+ tests to `select.component.spec.ts` (options rendering, disabled/CVA `setDisabledState`).
- [ ] **Step 3: Run and confirm green** — `npm test -- --watch=false --browsers=ChromeHeadless` → all pass; record the exact total in the matrix header. The total must be ≥ the 336 baseline plus every test added by Tasks 6–9, minus only the dead-code spec cases removed in Task 10 (each removal justified in that commit body).
- [ ] **Step 4: Coverage baseline** — `npm test -- --watch=false --browsers=ChromeHeadless --code-coverage`; copy the `text-summary` output into `evidence/tests/coverage-summary.txt` with the date. (Baseline only — coverage % is OPTIONAL per §1.9.)
- [ ] **Step 5: Commit**

```bash
git add docs/test-matrix.md src evidence/tests/coverage-summary.txt
git commit -m "test: add category test matrix, guard/interceptor/boundary tests, coverage baseline"
```

---

### Task 13: Storybook refresh and evidence

**Files:**
- Modify: `.storybook/main.ts` (remove stale mdx glob), `.storybook/preview.ts` (a11y test mode), `package.json` (pin `latest` versions to installed versions)
- Add to git: `src/app/shared/components/{select,data-table-toolbar,order-summary-card}/*.stories.ts`
- Modify: `evidence/storybook/build-storybook.log` (regenerated), new screenshots

**Interfaces:**
- Consumes: renamed classes (Task 2) — stories must compile against `AppButtonComponent` etc.
- Produces: build log evidencing 8 story chunks; screenshots for all 8 components; minimum-coverage claim re-verified.

- [ ] **Step 1: Commit the 3 untracked story files** and remove the dead `../src/**/*.mdx` glob (`main.ts:5`).
- [ ] **Step 2: Pin versions** — replace `"latest"` for `@chromatic-com/storybook`, `playwright`, `vite` with the installed versions from `package-lock.json`.
- [ ] **Step 3: Set Storybook a11y enforcement** — change `preview.ts:18` `test: 'todo'` → `test: 'error'`, run `npm run build-storybook`. If it fails, inspect violations: fix trivial ones (labels/roles); if any violation is non-trivial, revert to `'todo'` and record the reason in `docs/component-architecture.md` §Documentation. Either outcome is committed with a note — no silent bypass.
- [ ] **Step 4: Rebuild and refresh evidence** — `npm run build-storybook 2>&1 | Tee-Object evidence/storybook/build-storybook.log`; confirm log contains chunks for all 8 story files and `EXIT CODE: 0`.
- [ ] **Step 5: Capture missing screenshots** — storybook screenshots for `Basic/AppSelect` (default + disabled), `Composite/DataTableToolbar` (default), `Business/OrderSummaryCard` (default) into `evidence/storybook/`, matching the existing naming convention (`<title>--<story>.png`).
- [ ] **Step 6: Verify minimum coverage** — confirm ≥2 basic, ≥1 composite, ≥1 business stories render. Expected: 4 + 2 + 2.
- [ ] **Step 7: Commit**

```bash
git add .storybook package.json src/app/shared/components evidence/storybook
git commit -m "chore(storybook): commit all 8 stories, enforce a11y check, refresh build evidence"
```

---

### Task 14: AI usage log, contribution summary, deviations

**Files:**
- Modify: `AI_USAGE_LOG.md`, `CONTRIBUTION_SUMMARY.md`, `docs/scope-exceptions.md`

**Interfaces:**
- Consumes: DEV-3/DEV-4 (§1.10), Task 3's `scope-exceptions.md`, Task 4's pending AI runs.
- Produces: spec §8 compliance for deliverable 12 (log + contribution), all real, nothing invented.

- [ ] **Step 1: Restructure `AI_USAGE_LOG.md`** into a per-session table: date/session, exact prompt (verbatim), AI-generated output summary, verification method + result, items rejected/changed and why, final owner. Sections must cover: gap-audit assistance, docs drafted with AI, protocol drafted, plan drafted. Explicit section: "Controlled AI comparison runs — PENDING HUMAN EXECUTION (Task 4 protocol)" and "What AI was not used for" (kept from current file).
- [ ] **Step 2: Restructure `CONTRIBUTION_SUMMARY.md`** to the spec's format with real data only: table of owned areas → owner (sole author, from `git log`) → reviews performed (state honestly: none / self-review) → commits (cite representative hashes from `git log --oneline`) → unresolved items (the 4 existing human-validated items + AI runs + mentor checkpoints). Add **DEV-3** row to `docs/scope-exceptions.md`: team size 1 vs 2–3, rationale, `Pending: mentor`.
- [ ] **Step 3: Verify honesty** — every claim in both files must trace to a commit, file, or log; grep for reviewer/contributor names: only the real author may appear. Expected: no invented people.
- [ ] **Step 4: Commit**

```bash
git add AI_USAGE_LOG.md CONTRIBUTION_SUMMARY.md docs/scope-exceptions.md
git commit -m "docs: restructure AI log and contribution summary with recorded deviations"
```

---

### Task 15: Final recommendation, demo script, README

**Files:**
- Create: `docs/final-recommendation.md`, `docs/demo-script.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 3 matrix + licensing, Task 4 pending status, all code/evidence tasks.
- Produces: deliverable 11 + presentation (5–15 min) + DoD recommendation item.

- [ ] **Step 1: Write `docs/final-recommendation.md`** — sections: recommendation (Angular 21 + PrimeNG + Taiga + CDK + Tailwind as approved/continued stack, justified via the candidate matrix and licensing review), evidence base (link matrix, licensing, tests, a11y, responsive, storybook), **AI-15% score = PENDING HUMAN EXECUTION** (formula, no number), risks (licensing, dependency, single-maintainer, dead-style-layer), what is NOT approved (production migration, license purchase, security model — POC classification per spec §16), next validation steps with owners.
- [ ] **Step 2: Write `docs/demo-script.md`** — 10–15 minute walkthrough: login → shell → `/orders` (4 states via the POC control, authentic retry) → shared components in Storybook (Basic/Composite/Business) → tokens/theme → evidence tour (`evidence/`) → recommendation. Include exact routes, buttons, and expected visuals.
- [ ] **Step 3: Update `README.md`** — link `docs/component-architecture.md`, `docs/final-recommendation.md`, `docs/test-matrix.md`, `docs/demo-script.md`, `docs/scope-exceptions.md`; refresh "Supported Scenarios" for the new orders header/status; keep Limitations (AI runs pending, POC-only, single-author deviations); leave the status table numbers for Task 16.
- [ ] **Step 4: Verify against spec §8** — README has purpose, setup, configuration, run/test commands, supported scenarios, limitations, demo steps. Expected: all 7 present.
- [ ] **Step 5: Commit**

```bash
git add docs/final-recommendation.md docs/demo-script.md README.md
git commit -m "docs: add final recommendation and demo script; update README"
```

---

### Task 16: Full evidence refresh, gates, final DoD verification

**Files:**
- Create: `scripts/capture-evidence.mjs` (Playwright: auth bypass via `localStorage['dentalab-auth']`, axe-core scan over the route list, 3-viewport screenshots, orders state captures)
- Modify: `evidence/**` (regenerated logs/screenshots/reports), `README.md` (status table)

**Interfaces:**
- Consumes: all prior tasks; Playwright + axe-core already in devDependencies.
- Produces: refreshed, repeatable evidence for every DoD gate.

- [ ] **Step 1: Write `scripts/capture-evidence.mjs`** and a `package.json` script `"evidence": "node scripts/capture-evidence.mjs"` — reproduces what `evidence/accessibility/axe-summary.md` and `evidence/responsive/responsive-checklist.md` describe (documented method, now repeatable).
- [ ] **Step 2: Run all gates and refresh logs**
  - `npm run lint` → `evidence/build/lint.log`
  - `npm test -- --watch=false --browsers=ChromeHeadless` → `evidence/tests/test.log` (expected: full pass, count ≥ baseline 336)
  - `npm run build` → `evidence/build/build.log`
  - `npm run build-storybook` → `evidence/storybook/build-storybook.log`
  - `npm run evidence` → `evidence/accessibility/axe-report.json` + `axe-summary.md`, `evidence/responsive/**`, `evidence/states/orders-{normal,loading,empty,error}.png` (all four now captured from **service-driven** states)
  - Keyboard walkthrough checklist re-run against the new focus rule.
- [ ] **Step 3: Verify Review Focus #2/#3** — compare axe results with previous (expect 0 violations still); walk the 5 keyboard checks in the checklist; confirm focus ring now visible globally.
- [ ] **Step 4: Update README status table** with the fresh numbers/dates and the exact commands used.
- [ ] **Step 5: Final DoD pass** — walk every checkbox in §1.9: mark done what is done, and list what remains open **verbatim** (expected remaining: AI 15% human runs, mentor sign-offs on DEV-1…DEV-4, live presentation delivery). Never mark a pending item done.
- [ ] **Step 6: Commit**

```bash
git add scripts package.json evidence README.md
git commit -m "chore(evidence): repeatable capture script and refreshed gate evidence"
```

---

## Execution Notes

- **Order matters**: 1 → 2 → (3,4 parallel) → 5 → 6 → 7 → 8 → 9 → 10 → (11,12) → 13 → 14 → 15 → 16. Tasks 3/4 (docs) are independent of code; 11 (inventory) must follow 8/9 so its claims are true.
- **Human-only steps** (never delegated to AI): executing the three controlled AI comparison runs, mentor checkpoint approvals, live presentation, any screenshot the script cannot automate.
- **Stop condition**: if a task's verification fails and the fix would change UI or architecture beyond the task's named changes, stop and record the blocker instead of expanding scope (spec §11).
