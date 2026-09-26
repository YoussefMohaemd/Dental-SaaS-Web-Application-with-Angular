# Responsive evidence checklist

- Generated: 2026-09-26
- Method: Playwright against the production build (auth bypass via `localStorage.dentalab-auth`), three viewports: **desktop 1440×900**, **tablet 768×1024**, **mobile 375×812**.
- Raw data: [`overflow-results.json`](./overflow-results.json), [`sidebar-toggle-results.json`](./sidebar-toggle-results.json)

## Captured screenshots (per viewport)

| Target | Route | Files |
| --- | --- | --- |
| Layout shell / sidebar behavior | `/dashboard` | `layout-shell.png`, `sidebar-open.png` (mobile/tablet), `cards.png` |
| Orders table | `/orders` | `orders-table.png` |
| Forms | `/forms` | `forms.png` |
| Toolbars (data-table + search/filter toolbar) | `/patients` | `toolbars.png`, `dialog.png` |
| Cards (quick stats) | `/dashboard` | `cards.png` |
| Dialog (Add Patient, PrimeNG-based entity dialog) | `/patients` | `dialog.png` |
| Workflow board | `/workflow-board` | `workflow-board.png` |

## Overflow results (automated)

Horizontal document overflow (`documentElement.scrollWidth > innerWidth`): **none** in all **15** page × viewport combinations (5 pages × 3 viewports). Per-page `scrollWidth == innerWidth` at every viewport — see `overflow-results.json`.

## Sidebar behavior (automated)

| Viewport | Initial `aside` x | After toggle | Backdrop click closes | Result |
| --- | --- | --- | --- | --- |
| tablet-768 | 0 (persistent) | 0 | n/a (persistent at ≥640px) | Sidebar always visible |
| mobile-375 | -252 (off-canvas) | 0 (drawer + dimmed backdrop) | -252 (closed) | Drawer opens via `Toggle sidebar`, closes via backdrop |

Screenshots: `mobile-375/layout-shell.png` (closed), `mobile-375/sidebar-open.png` (open drawer), `tablet-768/sidebar-open.png` (persistent).

## State screenshots

Order Management states captured via the in-app state toggle: [`../states/orders-normal.png`](../states/orders-normal.png), [`orders-loading.png`](../states/orders-loading.png), [`orders-empty.png`](../states/orders-empty.png), [`orders-error.png`](../states/orders-error.png).

## REQUIRES HUMAN VALIDATION

- Visual spacing/aesthetic judgment at each viewport (screenshots provided for eyes-on review).
- Touch target sizes (≥44×44 CSS px) on mobile — not measured programmatically here.
- Landscape orientation and intermediate widths (e.g. 480, 600, 992, 1280).
- 200% browser zoom and 400% text spacing (WCAG 1.4.4 / 1.4.12) reflow behavior.
- Table horizontal-scroll affordances inside the orders table region (no page-level overflow, in-container scrolling not machine-checked).
