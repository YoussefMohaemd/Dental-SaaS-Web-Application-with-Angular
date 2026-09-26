# Keyboard walkthrough & manual accessibility checklist

- Generated: 2026-09-26
- Scope: production build (`dist/dental-saas-angular/browser`), light theme, auth bypass via `localStorage.dentalab-auth`
- Automated evidence: [`axe-report.json`](./axe-report.json), [`axe-summary.md`](./axe-summary.md) (axe-core 4.x, tags `wcag2a, wcag2aa, best-practice`, **24 route-states: 0 violations**), [`keyboard-walkthrough.json`](./keyboard-walkthrough.json), screenshots below.

## Verified from automated runs

| Check | Evidence | Status |
| --- | --- | --- |
| Tab reaches a sortable table header control (`/patients`) | `keyboard-walkthrough.json` → `headerButtonFocused: true`, `keyboard-focus-sort-header.png` | VERIFIED |
| Enter activates sort (`aria-sort` changes `none` → `descending`/`ascending`) | `keyboard-walkthrough.json` → `enterActivated: true` (`none` → `descending`), `keyboard-enter-sort-activated.png` | VERIFIED |
| Every button/link has an accessible name (icon-only toggles, checkboxes, expanders) | axe `button-name`, `link-name`, `select-name` = 0 across 24 route-states | VERIFIED |
| Every form control has a programmatic label (`for`/`id`, `aria-label`, or placeholder fallback) | axe `label` = 0, incl. all 7 `/forms` sections (`/forms#restoration-form` … `#validation-states`) | VERIFIED |
| Table headers provide text for screen readers (incl. select-all/expander columns) | axe `empty-table-header` = 0 | VERIFIED |
| Heading order (h1 → h2 → h3, no skips) | axe `heading-order` = 0 | VERIFIED |
| Color contrast of text/icons (light theme) | axe `color-contrast` = 0 on all 24 route-states | VERIFIED (light theme only) |
| Sort controls are `<button>` elements (keyboard + AT semantics) | axe `nested-interactive`/`role=button` checks = 0; source: `patients`/`doctors`/`billing` templates | VERIFIED |
| `aria-sort` reflects current sort state on sortable headers | source: `[attr.aria-sort]="sortAriaSort(...)"`; exercised by keyboard walkthrough | VERIFIED |

## REQUIRES HUMAN VALIDATION (browser/AT only — not claimed here)

| Check | Notes |
| --- | --- |
| Focus-visible rings on all interactive elements in rendered output | Tokens exist (`utilities.scss` focus ring, `:focus-visible` rules on sort buttons); visual confirmation eyes-on required. |
| Dialog/CDK focus trap: focus cycles inside modal, returns to trigger on close | Implemented via PrimeNG Dialog / CDK overlay; runtime behavior requires manual browser walkthrough. |
| Status is not communicated by color alone | `StatusBadge` renders a **text label** next to color (code-verified); human should confirm legibility against the darker status colors. |
| Form error announcement by screen reader (NVDA/VoiceOver/TalkBack) | Error text is present and associated in markup; actual announcement order/timing needs a screen reader. |
| Keyboard walkthrough of complete flows (login → orders → forms → dialog) | Script covers sortable-header flow only; full-flow walkthrough needs a human. |
| Dark theme contrast | Scan covered the default light theme only; dark theme requires a separate run/walkthrough. |
| 200% zoom / reflow (WCAG 1.4.10) and 400% text spacing (1.4.12) | Not automated; requires human browser check. |
| Storybook a11y addon pass on all stories | Stories exist (`evidence/storybook/`); addon run is a separate execution. |

## Notes

- `change-requests` contains no sortable headers (grep-verified); there was nothing to convert there.
- Axe scans render each route's default state; interactive states (dialogs, expanded rows, validation errors) are covered only where they render by default — human walkthrough items above cover the rest.
- Latest gate: `npm run build` = 0, `npm test -- --watch=false --browsers=ChromeHeadless` = 363/363, `npm run lint` = 0.
