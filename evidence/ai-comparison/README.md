# Evidence: controlled AI comparison (partitioned)

Status: **EMPTY — AWAITING HUMAN EXECUTION**

Protocol: [`docs/ai-comparison-protocol.md`](../../docs/ai-comparison-protocol.md)

## Candidate partitions

| Candidate | Folder | Status |
| --- | --- | --- |
| React + KendoReact | [`react-kendo/`](./react-kendo/) | EMPTY |
| React + Material UI | [`react-mui/`](./react-mui/) | EMPTY |
| Vue 3 + Vuetify | [`vue-vuetify/`](./vue-vuetify/) | EMPTY |

Each candidate folder contains the same slot templates:

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

Do not pre-fill any slot. If a capture cannot be produced, record `NOT CAPTURED — reason`.

Root-level duplicate templates were removed on 2026-09-26 (hygiene only — no slot was filled).
