# Dental SaaS Frontend Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every frontend finding from the audit report — across performance, scalability, availability, reliability, and security — including quarantining mock features, without redesigning the app's signals-based architecture.

**Architecture:** Angular 21 standalone + zoneless + signals. Fixes stay within the existing shape: `core/services` (data services + `*Api` base), `core/guards`/`interceptors`, `features/*` components, `shared/*`. New global providers (ErrorHandler, HTTP timeout) go in `app.config.ts`.

**Tech Stack:** Angular 21, RxJS 7, PrimeNG, Tailwind 4, Karma (unit tests), TypeScript strict.

**Spec:** `D:\programming code\VS Project\Dental SaaS Web Application\PROJECT-ISSUES-REPORT.md` (finding IDs like `FE-PERF-01` are the requirement keys). Task text embeds binding details.

**Cross-repo dependency:** Tasks 5, 6, 7, 11 consume new backend endpoints delivered by backend-plan Task 13:
1. `GET /api/v1/sub-orders?orderId=id1,...` (≤200 ids) → `{ data: SubOrderJson[] }`
2. `GET /api/v1/dashboard/metrics` → `{ data: { orders: {total, byStatus}, subOrders: {total}, patients: {total}, doctors: {total}, changeRequests: {total}, appointments: {total, last30d}, scanFiles: {total, last30d}, generatedAt } }`
3. `GET /api/v1/orders/counts?patientIds=...&doctorIds=...` (≤200 ids each) → `{ data: { patientCounts: Record<id,number>, doctorCounts: Record<id,number> } }`
4. Server assigns `orderNumber` on create (client value ignored, `DL-` format preserved)

If those endpoints are not yet available when a task starts, stop and report BLOCKED — do not mock them.

## Global Constraints

- No new runtime dependencies; no UI-kit migrations (PrimeNG stays; Taiga UI stays for now).
- Zoneless app: `provideZonelessChangeDetection()` stays; signal-based state patterns preserved.
- Typecheck gate: `npm run lint` (tsc) exits 0 after every task.
- Test gate: `npm test` (Karma) — all previously passing specs stay passing; each task adds/updates the specs listed in its steps.
- Conventional commit messages (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- Never weaken auth/capability guards; backend remains the authority — client guards are UX, not security.
- Do not modify the backend repository — it has its own plan.
- Template bindings must keep working with default or OnPush CD as each task states; no wholesale template rewrites.

## Review Focus

1. **Session-expiry path** (Task 2) — refresh failure must navigate to `/login` with `returnUrl`, never a loop with the wildcard route, never a stranded dead page.
2. **Store integrity** (Tasks 1, 4, 8) — `_orders` cache must not serve stale/other-page data after the refactor; deep link and in-list navigation must both show the right order.
3. **Bulk-endpoint usage** (Tasks 5-7) — exactly one request per page load (no leftover N+1 loops), cancellation on destroy, and graceful empty states when the endpoint returns 0 rows.
4. **OnPush correctness** (Task 19) — after switching a component to OnPush, its visible state must still update on signal mutations, async pipe completion, and event-driven CD.
5. **Security refactors** (Tasks 13, 14, 16) — removing `SafeHtmlPipe` and moving tokens must not break icon rendering, login, refresh, or capability-based UI on any page.

---

### Task 1: Order store cache + reactive route params

**Findings:** FE-REL-01 (High) — `order-data.service.ts:166-172` `getOrderById$` never writes into `_orders`, so `view-order`/`edit-order`/`order-workflow`/`order-files` show nothing on hard refresh. FE-REL-02 (High) — `route.snapshot.paramMap` read inside `computed()` in `edit-order.component.ts:113`, `order-workflow.component.ts:117`, `order-files.component.ts:115` yields the stale id when the router reuses the component.

**Files:**
- Modify: `src/app/core/services/order-data.service.ts`
- Modify: `src/app/features/orders/edit-order/edit-order.component.ts`, `src/app/features/orders/order-workflow/order-workflow.component.ts`, `src/app/features/orders/order-files/order-files.component.ts` (+ `view-order.component.ts` if it reads the same way)
- Test: `src/app/core/services/order-data.service.spec.ts`, new/extended component specs

- [ ] **Step 1: Write failing tests** — service: `getOrderById$` emits the order AND the `_orders` signal contains it afterwards (deep-link scenario: cache empty → fetch → cache populated → `getOrderById()` returns it). Component: changing `:orderId` param on the same component instance re-emits the computed with the NEW id (test with RouterTestingHarness or by feeding paramMap observable).
- [ ] **Step 2: Run** `npm test -- --include=...` for the touched specs — expect FAIL.
- [ ] **Step 3: Implement** — `tap` the fetched order into `_orders` (merge by id, preserve list ordering/pagination state); replace snapshot reads in computeds with a reactive `paramMap`-derived signal (e.g. `toSignal(route.paramMap)` or `withComponentInputBinding` + `input()`), keeping URL param names unchanged.
- [ ] **Step 4: Run** touched specs — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(orders): cache single-order fetch and use reactive route params`

### Task 2: Global ErrorHandler + session-expiry redirect + 404 route

**Findings:** FE-AVAIL-01 (High) — no `ErrorHandler` in `app.config.ts`; failures are console-only (23 `console.error` sites). FE-AVAIL-02 (High) — `auth.interceptor.ts:26-32` clears session on refresh failure but never navigates to `/login`. FE-SEC-06 (Low) — wildcard `**` → login with no 404 and no `returnUrl`.

**Files:**
- Modify: `src/app/app.config.ts`, `src/app/app.routes.ts`
- Create: `src/app/core/services/error-toast.service.ts` (signal-based), `src/app/core/error-handler.ts`
- Modify: `src/app/core/interceptors/auth.interceptor.ts`, `src/app/core/layout/shell/layout.component.ts` (or root listener)
- Test: new `error-handler.spec.ts`, extend `auth.interceptor.spec.ts`

**Interfaces:**
- Produces: `AppErrorHandler` (implements `ErrorHandler`) → logs + pushes `{ severity, message }` into `ErrorToastService`; interceptor on refresh failure emits an auth-expired event consumed once → `router.navigate(['/login'], { queryParams: { returnUrl: router.url } })`; routes: `**` → dedicated `not-found` page/component (simple shared `EmptyState`-based page) — login redirects only when unauthenticated.

- [ ] **Step 1: Write failing tests** — refresh failure → navigation attempted to `/login` with `returnUrl` (interceptor + router spy); unhandled template error → `ErrorToastService` receives a message; wildcard route resolves to not-found component (route config test).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per Interfaces; guard against navigation loops (if already on `/login`, don't re-navigate); route 1-2 existing high-visibility `console.error` sites (order delete, workflow drag-drop) through the toast service as proof of pattern — not all 23.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(app): global error handler, session-expiry redirect, 404 route`

### Task 3: HTTP timeout, bounded retry, loading-state finalize

**Finding:** FE-AVAIL-03 (Medium) — only `authInterceptor` registered; hung backend leaves `_loading` signals true forever (`billing-data.service.ts:39-61` pattern).

**Files:**
- Modify: `src/app/app.config.ts` (register new interceptor), create `src/app/core/interceptors/timeout-retry.interceptor.ts`
- Modify: data services that set `_loading` without `finalize` (grep `_loading.set(true)` — add `finalize(() => ... false)` where missing)
- Test: new `timeout-retry.interceptor.spec.ts`

- [ ] **Step 1: Write failing tests** — a GET that never emits is failed by `timeout(20000)`; a 5xx/network error on an idempotent GET is retried at most 2 times with delay then errors; a POST is never retried; data service loading flag clears on error (finalize).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — interceptor order: timeout/retry outside auth (register before `authInterceptor` in the chain order Angular applies — verify order in test); only retry idempotent methods (`GET`, `HEAD`) and only on network/5xx; keep 401 handling exclusively in the auth interceptor (no retry on 401).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(http): global timeout, bounded retry for idempotent requests, loading finalize`

### Task 4: Shared fetchAllPages helper + adapter bypass fix

**Findings:** FE-SCAL-01 (High) — identical `expand(...)/reduce(...)` loops in 10 services (`patient`, `order`, `notification`, `document`, `doctor`, `clinic`, `change-request`, `case`, `billing`, `sub-order` — line refs in report). FE-REL-09 (Low) — `change-request-data.service.ts:113-134` `updateStatus` hand-maps instead of using `ChangeRequestAdapter`.

**Files:**
- Create: `src/app/core/services/fetch-all-pages.ts` (pure RxJS helper)
- Modify: the 10 data services listed above; `change-request-data.service.ts`
- Test: new `fetch-all-pages.spec.ts`; service specs updated

**Interfaces:**
- Produces: `fetchAllPages<T>(fetchPage: (page: number) => Observable<{ data: T[]; meta: PaginationMeta }>, opts?: { maxPages?: number }): Observable<T[]>` — sequential page fetch (same behavior as today), supports cancellation via the returned observable being unsubscribed, stops when `data.length === 0` or last page reached, optional `maxPages` safety cap (default 1000). All 10 services delegate to it.

- [ ] **Step 1: Write failing test for the helper** — 3 pages then empty → emits concatenated 3-page array; unsubscribe mid-flight stops further page requests (assert request count); `maxPages` cap respected.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement helper; refactor all 10 services** to call it (preserve each service's public API and signal-updating behavior); fix `updateStatus` to use `ChangeRequestAdapter`.
- [ ] **Step 4: Run** — helper spec + all touched service specs — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `refactor(services): shared fetchAllPages helper; use adapter in change-request updateStatus`

### Task 5: Sub-orders fetched via bulk endpoint (kill N+1 storm)

**Finding:** FE-PERF-01 (High) — `sub-order-data.service.ts:315-337` paginates every order then GETs sub-orders per order; triggered from 5 components' `ngOnInit`.

**Files:**
- Modify: `src/app/core/services/sub-order-data.service.ts`, `src/app/core/enum/api.endpoint.ts` (add bulk URL), `src/app/core/base/sub-order.api.ts`
- Modify: the 5 trigger components only if their call signatures change (`orders`, `create-order`, `edit-order`, `view-order`, `sub-order`)
- Test: `sub-order-data.service.spec.ts` (exists — extend)

**Interfaces:**
- Consumes: backend `GET /api/v1/sub-orders?orderId=...` (≤200 ids) from backend-plan Task 13 — BLOCKED if absent.
- Produces: `loadSubOrdersForOrders(orderIds: string[]): Observable<SubOrderJson[]>` — one HTTP request, chunked into groups of 200 ids (`mergeMap` over chunks, concurrent ≤4); existing per-order loader kept only if a genuine single-order use remains, otherwise deleted.

- [ ] **Step 1: Write failing test** — 450 order ids → exactly 3 HTTP requests (chunking), results concatenated, mapped into the same store shape the components consume; empty id list → zero requests, `[]` emitted.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per Interfaces; components keep calling the same service entry point (rename only if necessary — update all call sites).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `perf(sub-orders): fetch via bulk endpoint instead of per-order requests`

### Task 6: Dashboard metrics from the metrics endpoint

**Finding:** FE-PERF-03 (High) — `dashboard.component.ts:83-92` triggers 5 full-dataset loads; metrics computed from `_appointments().slice(0,200)`; hardcoded `"+12% vs last month"` (:211-215) and scan stats (:275-312).

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts` (+ html for metric bindings), `src/app/core/base/dashboard.api.ts` / `dashboard-data.service.ts`, adapter `core/adapters/dashboard.adapter.ts`
- Test: `dashboard-data.service.spec.ts`, `dashboard.component.spec.ts`

**Interfaces:**
- Consumes: backend `GET /api/v1/dashboard/metrics` (backend-plan Task 13) — BLOCKED if absent.
- Produces: dashboard loads ONLY the metrics endpoint (+ any genuinely needed chart series endpoint); no `loadAll*` calls remain in the dashboard component; no hardcoded percentages or scan counts — UI shows real counts (display `last30d` deltas only where the endpoint provides them).

- [ ] **Step 1: Write failing test** — dashboard init issues exactly one metrics request; component binds totals/byStatus from the response; no hardcoded trend string remains (assert absence of the `+12%` literal).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — service/adapter for the contract shape; replace the five `loadAll*` triggers; keep chart components fed by real series or hide the chart when no series endpoint exists (prefer real data — reuse an existing reports endpoint if one fits; note the choice).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(dashboard): single metrics endpoint, remove full-dataset loads and hardcoded kpis`

### Task 7: Order counts via counts endpoint (stop loadAllOrders)

**Finding:** FE-PERF-02 (High) — `order-data.service.ts:119-164` bulk-fetches ALL orders (overwriting shared `_orders` + pagination) from `patients.component.ts:98`, `patient-details.component.ts:169`, `doctors.component.ts:86`, `doctor-details.component.ts:86`, `workflow-board.component.ts:54` just to count.

**Files:**
- Modify: `src/app/core/services/order-data.service.ts` (add counts method; **remove** the shared-state-overwriting `loadAllOrders` usage from these 5 call sites), the 5 components, `api.endpoint.ts`
- Test: `order-data.service.spec.ts`, component specs

**Interfaces:**
- Consumes: backend `GET /api/v1/orders/counts?patientIds=...&doctorIds=...` (backend-plan Task 13) — BLOCKED if absent.
- Produces: `getOrderCounts(ids: { patientIds?: string[]; doctorIds?: string[] }): Observable<{ patientCounts; doctorCounts }>` — single request per view; the 5 components display counts from it; `loadAllOrders()` deleted if no remaining callers (grep first — report any that remain and why).

- [ ] **Step 1: Write failing test** — 30 patient ids → one request; counts map returned; the patients list component renders counts without touching `_orders` (assert `_orders` unchanged after load).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per Interfaces.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(orders): order counts via aggregate endpoint, stop bulk loads`

### Task 8: Table pipeline — server pagination, single filter authority, type-aware sorting

**Findings:** FE-PERF-04 (Medium) — billing/documents/change-requests/notifications/cases/patients load all pages then slice client-side. FE-PERF-06 (Medium) — `orders.component.ts:316-326` double-filters server-filtered data; `paymentStatusFilter` client-only. FE-SCAL-02 (High) — client memory is the query layer. FE-REL-06 (Medium) — `shared/utils/table-state.ts:19-32` sorts numbers/dates as strings; `billing.component.ts:86-90` repeats it.

**Files:**
- Modify: `src/app/shared/utils/table-state.ts` (type-aware comparator), `src/app/shared/utils/table-state.spec.ts`
- Modify: `billing.component.ts`, `documents.component.ts`, `change-requests.component.ts`, `notifications.component.ts`, `cases.component.ts`, `patients.component.ts`, `orders.component.ts` (+ their data services where page params must be forwarded)
- Test: each touched spec

**Interfaces:**
- Produces: `compareValues(a, b, dir)` handling number, Date, ISO-string, boolean, string (locale-aware) — orders' existing `compareOrderValues` semantics adopted as the reference; `table-state` sorts delegate to it and per-component inline comparators are deleted. Each list component sends `page`, `pageSize`, `search`, `status` (and its filters) to the server and renders from the response — no `fetchAllPages` on the initial load for billing/documents/change-requests/notifications/cases/patients (where the server already supports the params — verify per service; report any endpoint that lacks server pagination rather than half-converting it). Orders: remove the client re-filter; move `paymentStatusFilter` into the server query (backend accepts it — if backend lacks the param, keep it client-side but fix `totalRecords` to reflect the filtered set, and note it).

- [ ] **Step 1: Write failing tests** — comparator: `[9,100,10]` numeric ascending, dates `2024-9-31` vs `2024-10-01` chronological, strings locale; billing: page 2 request carries `page=2` and the rendered slice comes from the response (mock), no all-pages loop (assert request count = 1); orders: filter change issues ONE server request and no client re-filter of `orders()`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per Interfaces; keep `fetchAllPages` helper (Task 4) for genuine full-set needs (reports) — it stays, lists stop using it.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `perf(tables): server-driven pagination, single filter authority, type-aware sorting`

### Task 9: Edit-order save rollback

**Finding:** FE-REL-03 (Medium) — `edit-order.component.ts:511-567` nested `subscribe` mutates state without restore on error (create-order does rollback at `:658-683`).

**Files:**
- Modify: `src/app/features/orders/edit-order/edit-order.component.ts`
- Test: `edit-order.component.spec.ts`

- [ ] **Step 1: Write failing test** — save fails (mock 500) → displayed form/sub-order state equals the pre-save snapshot (rollback), error surfaced via toast service (Task 2 pattern), no nested-subscribe leak (one subscription chain).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — snapshot before mutate, restore in error path, single `tap`/`catchError` chain instead of nested subscribe.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(orders): roll back edit-order state on save failure`

### Task 10: Archived-orders correctness

**Finding:** FE-REL-04 (Medium) — `archived-orders.component.ts` filters the client-side page-1 list; archived orders beyond the loaded page never appear.

**Files:**
- Modify: `src/app/features/orders/archived-orders/archived-orders.component.ts`, `order-data.service.ts` (add archived query if server supports `archiveDate`/`archived` filter — check backend contract; if the backend lacks an archived filter, add the client-side call via `loadAllSubOrders`-style paged fetch **scoped to archived** and report the backend gap in the task report)
- Test: `archived-orders.component.spec.ts` (create — currently missing)

- [ ] **Step 1: Write failing test** — archived order located on page 7 of the dataset still renders; loading state and empty state covered.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — request archived orders from the server (filter param) rather than filtering the shared page-1 store; do not mutate `_orders` list state.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(orders): load archived orders from the server`

### Task 11: Server-generated order numbers

**Finding:** FE-REL-05 (Medium) — `order-data.service.ts:179` generates `DL-${Date.now().slice(-8)}` client-side (collides, client-trusted).

**Files:**
- Modify: `src/app/core/services/order-data.service.ts`, `src/app/features/orders/create-order/create-order.component.ts` (stop constructing the number), adapter `core/adapters/order.adapter.ts` if it maps the field
- Test: `order-data.service.spec.ts`

**Interfaces:**
- Consumes: backend assigns `orderNumber` on create (backend-plan Task 13) — BLOCKED if absent.
- Produces: create payload no longer sends `orderNumber` (or sends only if backend schema requires the key — backend ignores it); UI displays the server-returned number.

- [ ] **Step 1: Write failing test** — create payload has no client-generated `DL-` value; response `orderNumber` is what renders.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(orders): use server-generated order numbers`

### Task 12: Reports KPI correctness

**Finding:** FE-REL-07 (Medium) — `reporting-data.service.ts:162-170` stops at pageSize 100; `reports.component.ts:53` loads page 1 only; `completionRate` mixes orders+cases in one denominator; `averageOrderValue` averages unpaid records.

**Files:**
- Modify: `src/app/core/services/reporting-data.service.ts`, `src/app/features/reports/reports.component.ts` (+ adapter if present)
- Test: new/extended `reports.component.spec.ts`

- [ ] **Step 1: Write failing tests** — completion rate denominator = orders only (assert formula against fixture); average order value excludes unpaid/pending-payment records per the label's claim (read the UI label — if the label says "avg value", decide: paid-only and label it "Avg paid value", record the choice); KPI inputs cover the full dataset via `fetchAllPages` or a backend aggregate — assert no silent 100-row cap (fixture of 150 rows yields metrics reflecting all 150).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — use `fetchAllPages` (Task 4) where no aggregate exists; prefer a backend reports endpoint when one already returns the aggregate (check `reports.api.ts` first).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(reports): compute kpis over full datasets with correct formulas`

### Task 13: Token/identity storage hardening

**Finding:** FE-SEC-01 (High) — `auth.service.ts:206-212` token in `sessionStorage`, user+tenant persisted in `localStorage`; mixed model desyncs (:219-244).

**Files:**
- Modify: `src/app/core/services/auth.service.ts`, `src/app/core/interceptors/auth.interceptor.ts` (read path only)
- Test: `auth.service` spec (create/extend), `auth.interceptor.spec.ts`

**Interfaces:**
- Produces: access token held **in memory only** (plus `sessionStorage` fallback is NOT used); refresh flow unchanged (HttpOnly cookie, backend-owned); identity (user object) in `sessionStorage` only — all `localStorage` auth keys removed; on app reload the token is obtained via a silent refresh call on bootstrap (add `APP_INITIALIZER` or an auth-bootstrap observable) — document the sequence in the task report.

- [ ] **Step 1: Write failing tests** — after login, no `localStorage` auth keys exist; token not readable from `sessionStorage`; bootstrap without token triggers refresh and subsequent API call succeeds (mock refresh endpoint).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per Interfaces; purge legacy keys on init (`localStorage.removeItem` for the old `AUTH_USER_KEY`/`AUTH_TENANT_KEY` names — read them from the current code).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0. Manual sanity: login → reload → still authenticated (note if unverifiable without a running backend).
- [ ] **Step 5: Commit** `fix(auth): memory-only access token, session-scoped identity`

### Task 14: Remove SafeHtmlPipe

**Finding:** FE-SEC-02 (High) — `shared/pipes/safe-html.pipe.ts` calls `bypassSecurityTrustHtml` unconditionally; used in ~15 templates.

**Files:**
- Modify: every template using `safeHtml` (grep `safeHtml`), `src/app/shared/pipes/safe-html.pipe.ts` (delete), possibly `shared/icons/lucide-icons.ts` consumers
- Test: affected component specs; delete pipe spec if present

- [ ] **Step 1: Enumerate** — `grep -r "safeHtml" src/` and list every usage in the task report.
- [ ] **Step 2: Write failing/characterization test** — for 2-3 representative components, assert the icon/HTML renders the same markup after the change (DOM assertion on the element).
- [ ] **Step 3: Implement** — replace each usage with the safest equivalent: static icon → `[innerHTML]` is NOT a fix; use existing icon registry/`lucide-icons` mapping via a structural directive or a tiny `AppIcon` component rendering with `svg` innerHTML **once from a constant map** (constants are code, not data — acceptable), or `ngSwitch` template refs for static markup. Delete the pipe. If a usage genuinely renders dynamic server data, flag it in the report instead of converting blindly.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0; `grep -r bypassSecurityTrust src/` returns only sanctioned sites (document them).
- [ ] **Step 5: Commit** `fix(security): remove safe-html pipe and blanket sanitizer bypass`

### Task 15: CSV formula-injection escaping + CSP/self-hosted fonts

**Findings:** FE-SEC-03 (Medium) — `orders.component.ts:766-808`, `billing.component.ts:247-287` don't neutralize leading `=`,`+`,`-`,`@`. FE-SEC-05 (Medium) — Google Fonts in `index.html`, Unsplash imagery in `login.component.ts:34`, no CSP.

**Files:**
- Create: `src/app/shared/utils/csv.ts` (escape helper) — used by both exporters
- Modify: `orders.component.ts`, `billing.component.ts`, `src/index.html`, `src/app/features/auth/login/login.component.ts` (+scss/html for imagery), `src/app/app.config.ts` (CSP via provideAppInitializer is not a thing for headers — add CSP `<meta>` in index.html as the practical frontend control; document server-header recommendation in report)
- Test: new `csv.spec.ts`, login spec update

- [ ] **Step 1: Write failing tests** — `escapeCsvCell('=SUM(A1)')` → `'=SUM(A1)` (leading apostrophe), same for `+ - @`; existing quote/comma escaping preserved; a cell with a formula after whitespace-only prefix also neutralized.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — shared `escapeCsvCell`; both exporters use it; self-host fonts: download the Nunito Sans woff2 files already present in storybook-static into `src/assets/fonts/` and reference via `@font-face` (remove the Google Fonts `<link>`); replace Unsplash URL with a local asset or CSS gradient; add `<meta http-equiv="Content-Security-Policy">` with `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'` (tune to what the app actually needs — dev proxy/websockets included; verify the app still boots in `npm start`-less build tests).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0; `npm run build` succeeds (CSP must not break the build).
- [ ] **Step 5: Commit** `fix(security): csv formula escaping, csp meta, self-hosted fonts`

### Task 16: Capability guards on every mutating route

**Finding:** FE-SEC-04 (Medium) — `capabilityGuard` guards only `orders/create` and `orders/:orderId/edit` (`app.routes.ts`); delete/archive/lock/workflow and non-order mutations rely on hidden buttons; capabilities read from client storage.

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/core/guards/capability.guard.ts` if it needs a matrix
- Test: `capability.guard.spec.ts` (create — currently missing), route-config test

- [ ] **Step 1: Enumerate mutating routes** — list every route whose component performs create/update/delete (grep POST/PUT/PATCH/DELETE call sites per feature) and map each to the capability the sidebar/button already uses (`core/security/capabilities.ts`).
- [ ] **Step 2: Write failing tests** — for each mapped route: user lacking the capability is redirected (to dashboard or 403-style state — pick one, consistent); user with it passes.
- [ ] **Step 3: Implement** — attach `canActivate: [capabilityGuard('...')]` to each; keep backend as authority (comment in guard file stating client guards are UX-only).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `fix(auth): capability guards on all mutating routes`

### Task 17: Unsaved-changes guard on create/edit order

**Finding:** FE-AVAIL-04 (Medium) — 5-step `create-order` wizard and 800-line `edit-order` have no `CanDeactivate`.

**Files:**
- Create: `src/app/core/guards/unsaved-changes.guard.ts`
- Modify: `app.routes.ts`, `create-order.component.ts`, `edit-order.component.ts` (expose a `isDirty()` method or signal)
- Test: new `unsaved-changes.guard.spec.ts`

- [ ] **Step 1: Write failing test** — dirty form + navigation away → confirm dialog blocks (mock `confirm`); clean form → navigation proceeds; guard unit tests for true/false paths.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — `CanDeactivate` guard calling `component.canDeactivate?.()`; dirty tracking = any field changed from initial snapshot (create: any input touched; edit: compare against loaded order — reuse the edit form's existing change detection if present).
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 5: Commit** `feat(orders): unsaved-changes guard for create and edit`

### Task 18: Quarantine mock/demo features and hardcoded data

**Findings:** X-1 (Critical) — `order-files.component.ts` fully fake (`INITIAL_FILES`, `simulateUpload`, `downloadAll() {}`), `grid.component.ts` 100% mock, `scan-center` files never uploaded, `forms.component.ts` showcase, `OrderDataService.previewState()` POC code in production service. FE-REL-08 — `"Jessica Ruiz"` (`sub-order.component.ts:472-474`), `unreadNotificationsCount = 3` (`navigation.service.ts:96`), fixed demo dates in grid.

**Files:**
- Modify: `src/app/features/orders/order-files/order-files.component.ts` (+html), `src/app/features/grid/grid.component.ts`, `src/app/features/scan-center/scan-center.component.ts`, `src/app/features/forms/forms.component.ts`, `src/app/core/services/order-data.service.ts` (`previewState`), `src/app/features/orders/sub-order/sub-order.component.ts`, `src/app/core/services/navigation.service.ts`, `src/app/app.routes.ts` (route visibility)
- Test: affected specs

**Rulings:** Real file upload is a backend feature that does not exist — do NOT build it. Quarantine: (a) `order-files` shows a clear "File management coming soon" empty state (reuse `EmptyState` component) with no fake files/upload/download; (b) `scan-center` upload area disabled with the same honest messaging; (c) `grid` and `forms` routes removed from navigation/routing (keep the code on disk behind a `demoRoutes` array commented out — do not delete files); (d) `previewState()` deleted along with its callers; (e) `"Jessica Ruiz"` → authenticated user's display name from auth service; (f) `unreadNotificationsCount = 3` → real notifications length or 0 (read `notification-data.service` for the actual source).

- [ ] **Step 1: Write failing tests** — order-files renders empty-state, contains no `simulateUpload`; navigation service count reflects data (0 when no notifications); sub-order shows current user name; `previewState` no longer exists (compile-time — spec referencing it removed).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per Rulings.
- [ ] **Step 4: Run** — PASS; full `npm test` — no regressions; `npm run lint` — 0; `npm run build` succeeds (routes removed cleanly).
- [ ] **Step 5: Commit** `fix(demo): quarantine mock features, remove poc preview state and hardcoded data`

### Task 19: OnPush change detection + binding memoization

**Finding:** FE-PERF-05 (Medium) — 39/40 components use default CD with 1000+ line templates; method-call bindings (`pageNumbers()`, `rangeStart()`, `rangeEnd()`), per-call SVG map rebuilds (~10 components), `notifications.component.ts:70-97` rebuilds SVG strings per call.

**Files:**
- Modify: all feature/shared components — `changeDetection: ChangeDetectionStrategy.OnPush` + memoized/precomputed bindings
- Modify: `notifications.component.ts`, `billing.component.ts` first (largest offenders), then the rest
- Test: touched specs must still pass (Karma runs with zone — verify CD-sensitive specs)

**Batching:** this task is dispatched as **3 sequential sub-batches** by the controller (A: billing, notifications, dashboard, orders; B: remaining feature components; C: shared components + layout) — each sub-batch gets its own implementer pass and its own review package; the task completes when all three are merged.

- [ ] **Step 1 (per batch):** add OnPush to the batch's components; convert method-call template bindings to `computed()` signals (page windows, ranges, icon maps as module-level constants); ensure every async result flows through signals or `async` pipe.
- [ ] **Step 2:** run the batch's specs — PASS; full `npm test` — no regressions; `npm run lint` — 0.
- [ ] **Step 3:** `npm run build` succeeds.
- [ ] **Step 4 (batch):** commit `perf(ui): onpush change detection batch <A|B|C>`.

### Task 20: Refactor debt + bundle weight

**Findings:** FE-SCAL-03 (Medium) — `core/base/*.api` ceremony (15 single-method base classes reimplemented by services). FE-SCAL-04 (Low) — template mapping duplicated (`sub-order-data.service.ts` vs `core/utils/order-flow.utils.ts` — note: this path may actually be `features/orders/order-flow.utils.ts`, verify), `NavigationService` hand-rolls router URL building, header empty `effect` + `notification: any` (`header.component.ts:55-59,105`). FE-PERF-07 (Low) — `zone.js` runtime dep despite zoneless app; 7 `@taiga-ui/*` packages; redundant `ThemeService` provider (`app.config.ts:33` + `providedIn root`); empty `core/config/` dir.

**Files:**
- Modify: `src/app/core/base/*.api.ts` (fold into a generic `EntityApi<T>` or delete where unused), corresponding data services
- Modify: `src/app/core/services/navigation.service.ts`, `src/app/core/layout/navbar/header.component.ts`, `src/app/app.config.ts`, `package.json`, `angular.json` (polyfills), `src/app/core/services/theme.service.ts`
- Test: affected specs

**Rulings:** Taiga UI packages are NOT removed in this task (auditing actual usage could break templates invisibly — instead add a follow-up note with per-package usage counts from `grep`); zone.js is removed from runtime `polyfills` but KEPT as a devDependency for Karma (X-5 zoneless-test mismatch is Task 21's scope).

- [ ] **Step 1: Inventory** — grep each `core/base/*.api.ts` subclass usage; delete base classes with no distinct value (services implement the endpoint directly); dedupe template-mapping into one module; replace `NavigationService` URL parsing with router-based navigation where trivially equivalent (keep its public API if components depend on it — adapter pattern).
- [ ] **Step 2: Write tests** — navigation service behavior preserved (existing specs or new); header effect removal keeps notification badge behavior (spec).
- [ ] **Step 3: Implement** — remove empty `effect`, type `notification` model, dedupe `ThemeService` provider, delete empty `core/config/`, drop `zone.js` from `angular.json` polyfills + runtime deps.
- [ ] **Step 4: Run** — full `npm test` — no regressions; `npm run lint` — 0; `npm run build` succeeds; report bundle-size delta from the build output.
- [ ] **Step 5: Commit** `refactor: fold api ceremony, dedupe utils, drop zone.js runtime dep`

### Task 21: Repo hygiene — ESLint, CI, artifact cleanup, test-stack alignment

**Findings:** X-4 — `evidence/` committed with a deleted regeneration script (`package.json` `evidence` script points at missing `scripts/capture-evidence.mjs`); X-5 — no ESLint (`npm run lint` = tsc), Karma runs with zone.js while app is zoneless; no CI in either repo (backend gets its CI in its own plan? NO — backend CI was not in the backend plan; add backend CI workflow here only for the frontend repo, and note the backend gap for the controller to schedule).

**Files:**
- Create: `.eslintrc`-equivalent flat config (`eslint.config.js`) + `@angular-eslint` devDeps (devDeps allowed — Global Constraint bans runtime deps only), `.github/workflows/ci.yml`
- Modify: `package.json` (lint script → real eslint + tsc; remove broken `evidence` script or restore a minimal `scripts/capture-evidence.mjs` — ruling: **remove the script**, keep `evidence/` history), `.gitignore` (add `coverage/`, `storybook-static/`, `.angular/cache/` if not already ignored — verify; untrack them if tracked: `git ls-files coverage storybook-static .angular`), `karma.conf.js`/`angular.json` (document the zone test/app mismatch; keep zone in tests)
- Test: CI runs `npm run lint` + `npm test -- --watch=false --browsers=ChromeHeadless`

- [ ] **Step 1: Inventory tracked artifacts** — `git ls-files | grep -E "coverage/|storybook-static/|\.angular/|evidence/"` → untrack build outputs (`git rm -r --cached`), keep `evidence/` screenshots?? ruling: **untrack `coverage/`, `storybook-static/`, `.angular/` (build outputs); keep `evidence/` (it is the project's audit trail) but delete the broken `evidence` npm script**.
- [ ] **Step 2: Add ESLint** — `ng add @angular-eslint/schematics` or flat-config equivalent with `typescript-eslint` + Angular template rules; fix or explicitly `// eslint-disable` every violation found (report counts; no more than the minimal set — do not refactor code for lint beyond safe autofixes).
- [ ] **Step 3: Add CI** — GitHub Actions: install, `npm run lint`, `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless` on push/PR.
- [ ] **Step 4: Run** — `npm run lint` (now eslint+tsc) 0 errors; `npm test` headless passes; `npm run build` passes.
- [ ] **Step 5: Commit** `chore: real eslint, ci workflow, untrack build artifacts` (split commits OK).

### Task 22: Close the test gaps

**Finding:** X-6 (Medium) — no specs for `capability.guard`, `order-lock.guard`, `authorization.service`, `navigation.service` (if not done in Task 20), 14/15 adapters, pipes (`safe-html` — deleted in Task 14, so skip), `display-date`, `display-currency`, utils (`api-error`, `sort-a11y`), components `grid`/`scan-center`/`archived-orders` (archived done in Task 10). Regression specs for deep-link loading, param staleness, refresh redirect, numeric sorting — must already exist from Tasks 1/2/8; verify and fill only what's missing.

**Files:**
- Create: specs for `capability.guard.spec.ts` (if not from Task 16), `order-lock.guard.spec.ts`, `authorization.service.spec.ts`, `display-date.pipe.spec.ts`, `display-currency.pipe.spec.ts`, `api-error.spec.ts`, `sort-a11y.spec.ts`, adapter tests (one parameterized spec covering all adapters' mapping tables is acceptable and preferred over 14 files)
- Modify: none of the production code — **this task writes tests only**; if a test finds a real bug, fix it in a separate commit within the task and flag it prominently in the report.

- [ ] **Step 1: Write specs** per the list, with real assertions (no "should create" placeholders — each asserts a behavior: guard allows/denies by capability/lock state, pipe formats per locale rules, adapter maps every field incl. edge nulls).
- [ ] **Step 2: Run** `npm test` — all pass; coverage report delta noted (`npm test -- --code-coverage` optional if cheap).
- [ ] **Step 3: `npm run lint`** — 0.
- [ ] **Step 4: Commit** `test: cover guards, pipes, utils, and adapters`.

---

## Rulings (recorded at plan time)

- **Real file upload (X-1) not built** — backend has no upload endpoint; quarantining is the honest fix. *If wrong: build multipart upload as a new feature request.*
- **Taiga UI not removed (Task 20)** — usage audit deferred with counts reported; removal is a separate risk-managed task. *If wrong: bundle stays larger than needed.*
- **CSP as `<meta>` (Task 15)** — true enforcement needs server headers (backend plan Task 19 adds its own CSP for API responses); frontend meta documents intent and blocks the worst vectors. *If wrong: some directives unenforceable via meta — acceptable interim.*
- **`evidence/` stays tracked (Task 21)** — it is the project's audit trail; the broken regeneration script is removed instead of restored. *If wrong: stale artifacts linger in history (already committed once).*
- **zone.js stays as devDependency (Tasks 20/21)** — Karma requires it while the app is zoneless; test-stack migration to zoneless is out of scope here. *If wrong: tests exercise slightly different CD than production — documented in Task 21.*
