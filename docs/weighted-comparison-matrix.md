# Weighted Comparison Matrix

Date: 2026-09-22

This matrix is intentionally conservative and evidence-based. It does not invent scores for controlled AI comparison evidence that has not yet been executed in a controlled way.

## Weights

| Criterion | Weight |
| --- | ---: |
| Existing-system and business understanding | 10% |
| Technology comparison and evidence | 20% |
| Design-system architecture | 15% |
| Component implementation | 25% |
| Code quality, testing, and accessibility | 15% |
| Documentation and presentation | 10% |
| Git collaboration and AI validation | 5% |
| Total | 100% |

## Scoring Basis

Scores below are qualitative project scores for the current repository state, not a claim of production approval.

| Criterion | Score | Justification | Evidence / Source Basis |
| --- | ---: | --- | --- |
| Existing-system and business understanding | 8/10 | The repo already demonstrates the dental CRM/customer-portal context through orders, patients, doctors, clinics, billing, workflow, and file handling. | Routed feature set, JSON fixtures, order/sub-order data services, and current UI surface. |
| Technology comparison and evidence | 6/10 | The technology stack is clearly implemented, but the dedicated comparison artifact and controlled AI comparison evidence were not present at inspection time. | Current Angular/PrimeNG/Taiga/CDK/Tailwind usage plus missing evidence artifacts. |
| Design-system architecture | 8/10 | Tokens, theme mapping, and shared controls already exist and are wired into the app shell. | `src/styles/tokens.scss`, `src/styles/theme.scss`, `src/styles.scss`, shared controls. |
| Component implementation | 8/10 | Many reusable controls and business views already exist, including the Orders TreeTable and workflow board. | Shared components, Orders, workflow, and routed detail pages. |
| Code quality, testing, and accessibility | 7/10 | The repository already contains extensive unit tests, but the task-specific accessibility and state-validation evidence still needs completion. | Existing spec files and validation docs; remaining evidence gaps. |
| Documentation and presentation | 5/10 | Prior docs exist, but the required final README, AI log, checkpoint status, and contribution summary were missing in the inspected snapshot. | Documentation inventory inspection. |
| Git collaboration and AI validation | 4/10 | Git evidence exists only indirectly in the workspace; controlled AI comparison artifacts are not yet present. | Repository state, lack of AI usage log, lack of controlled comparison evidence. |

## AI-Assisted Development Effectiveness

Weight: 15% within the broader selection criteria requested by the task.

Status: **AWAITING HUMAN EXECUTION.**

The controlled comparison is fully specified in [`docs/ai-comparison-protocol.md`](./ai-comparison-protocol.md) (frozen requirement, exact prompt, fixed context bundle, 60-minute allowance, 3-iteration limit, rubric weights 20/20/20/15/15/10 = 100%). Empty capture slots are prepared in [`evidence/ai-comparison/`](../evidence/ai-comparison/).

Contribution formula once executed: `protocol_score / 100 × 15%`.

No score will be entered into this matrix without a completed `evidence/ai-comparison/scoresheet.md` and `effort-log.md`. Any score appearing before that would be fabricated.

## Notes

- This matrix should be revisited only after the controlled AI comparison, artifact completion, and final validation are complete.
- The matrix total is 100%.