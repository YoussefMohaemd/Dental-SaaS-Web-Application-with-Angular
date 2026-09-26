# AI Usage Log

Date: 2026-09-22 (reconciled 2026-09-26)

## Existing AI Usage

No prior AI usage log file was present in the repository snapshot at inspection time.

The current session used AI-assisted repository inspection and documentation drafting to close the task gaps. Because the repository does not contain a prior exported AI transcript, the only truthful record available here is this current session-level summary.

## Current Session Summary

- Prompt context: close the actual gaps found by the prior audit while preserving the rendered UI.
- Generated suggestions accepted: repository re-audit, plan-first execution, documentation-first closure, and verification of existing Angular/PrimeNG/Taiga/CDK/Tailwind usage.
- Generated suggestions rejected: any attempt to invent controlled AI comparison results, mentor approval, screenshots, or test results.
- Manual corrections: the implementation-gap-closure plan was rewritten to reflect the real codebase and the missing evidence artifacts.
- Verification performed: inspected source files, build/test configuration, shared components, order and workflow surfaces, and the absence of Storybook/AI log/README artifacts.

## Compliance Cycle Session (2026-09-26)

- **Prompts:** execute the approved compliance plan phase by phase (deps/baseline → missing specs → Storybook stories → accessibility → evidence pack → AI-comparison protocol → documentation reconciliation), committing per phase and never fabricating evidence.
- **AI-generated work accepted:** sortable-header a11y conversion + `sort-a11y` helpers and specs; Storybook stories; axe-core based scan automation; contrast/label/heading accessibility fixes; evidence capture scripts and artifacts; protocol and documentation drafting.
- **AI-generated work rejected/limited:** any pre-filled AI-comparison scores or outputs (slots left empty); any claim of human-only validations (screen reader, eyes-on checks) — all marked REQUIRES HUMAN VALIDATION; no invented reviewers, approvals, or mentor records.
- **Verification performed by AI:** `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless` (336/336), `npm run lint`, `npm run build-storybook`, axe-core scan across 24 route-states (0 violations), keyboard walkthrough (Tab focus + Enter sort activation), responsive overflow checks (15 combinations, none). Raw logs stored under `evidence/`.
- **Ownership:** human-owned repository; AI-assisted implementation and evidence preparation as logged in `CONTRIBUTION_SUMMARY.md`.

## Controlled AI Comparison

Status: **AWAITING HUMAN EXECUTION** — protocol prepared, run not yet performed.

Protocol: `docs/ai-comparison-protocol.md` (frozen requirement, exact prompt, fixed context bundle, 60-minute time allowance, 3-iteration limit, rubric weights 20/20/20/15/15/10). Empty evidence slots: `evidence/ai-comparison/`.

Required conditions to be satisfied at run time:

- Same approved AI tool and model
- Same sanitized requirement
- Same base prompt and supplied context
- Same time allowance
- Same iteration limit
- Initial generated output and corrected working output recorded under controlled conditions
- Screenshots, build results, test results, accessibility findings, elapsed effort, and iteration count recorded

## Final Ownership

All final claims in this repository must be treated as human-owned unless they are backed by verifiable repository evidence.