# Candidate Weighted Comparison Matrix (Research Baseline)

Date: 2026-09-26

This matrix separates **frontend technology** (React, React, Vue 3) from **component library** (KendoReact, MUI, Vuetify). They are evaluated as paired candidates for this assignment, but they are not equivalent product categories.

> Scope note: this matrix is evidence-based research for the assignment record. The organizational stack decision for this repository remains Angular + PrimeNG/Taiga/CDK/Tailwind (see [`scope-exceptions.md`](./scope-exceptions.md), DEV-1).

## Criteria and weights

| Criterion | Weight |
| --- | ---: |
| Technical suitability | 20% |
| Licensing & cost | 15% |
| Accessibility (library-level) | 10% |
| Maintainability | 10% |
| Team fit | 10% |
| Dependency / lock-in risk | 10% |
| Ecosystem maturity | 10% |
| **AI-Assisted Development Effectiveness** | **15%** |
| **Total** | **100%** |

## Scored matrix

Scores are on a 0–10 scale. Each cell includes score + one-line justification + citation.

| Criterion (Weight) | React + KendoReact | React + Material UI | Vue 3 + Vuetify |
| --- | --- | --- | --- |
| Technical suitability (20%) | **8** — broad enterprise component coverage (120+ full tier), strong fit for data-heavy POCs ([Kendo free vs premium](https://www.telerik.com/kendo-react-ui/components/getting-started/free-vs-premium)). | **8** — mature React component system with broad ecosystem and composability ([MUI Material README](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/README.md)). | **7** — complete Vue UI framework with rich defaults, but less aligned with current React-oriented assignment comparators ([Vuetify why page](https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides)). |
| Licensing & cost (15%) | **6** — usable free tier exists, but premium/advanced coverage is commercial and license-key enforced ([Kendo licensing](https://www.telerik.com/kendo-react-ui/components/my-license), [Kendo pricing](https://www.telerik.com/kendo-react-ui/pricing)). | **8** — Material UI core is MIT; advanced MUI X features move to commercial Pro/Premium tiers ([MUI LICENSE](https://raw.githubusercontent.com/mui/material-ui/master/LICENSE), [MUI X README](https://raw.githubusercontent.com/mui/mui-x/master/README.md)). | **9** — Vuetify framework is MIT licensed with permissive use terms ([Vuetify LICENSE](https://raw.githubusercontent.com/vuetifyjs/vuetify/master/packages/vuetify/LICENSE.md)). |
| Accessibility (library-level) (10%) | **8** — enterprise-grade component set with documented production usage and support pathways ([Kendo docs home](https://www.telerik.com/kendo-react-ui/components/)). | **8** — established component library widely used for accessible React patterns ([MUI docs](https://mui.com/material-ui/)). | **7** — strong defaults, but app-level accessibility quality depends heavily on implementation discipline ([Vuetify docs](https://vuetifyjs.com/en/)). |
| Maintainability (10%) | **7** — commercial support improves SLA, but license-key lifecycle adds operational overhead ([Kendo licensing activation](https://www.telerik.com/kendo-react-ui/components/my-license)). | **8** — open-source core + large ecosystem and clear docs reduce long-term maintenance friction ([MUI README](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/README.md)). | **7** — cohesive framework helps consistency, but tighter framework conventions can raise migration cost if strategy changes ([Vuetify intro](https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides)). |
| Team fit (10%) | **6** — strongest when team accepts commercial workflow, procurement, and license governance ([Kendo pricing](https://www.telerik.com/kendo-react-ui/pricing)). | **8** — easiest hiring/onboarding fit for broad React talent pools and OSS-first workflows ([MUI docs](https://mui.com/material-ui/)). | **6** — requires Vue-specific expertise and ecosystem transition from React baselines in spec comparisons ([Vuetify docs](https://vuetifyjs.com/en/)). |
| Dependency / lock-in risk (10%) | **5** — premium feature reliance + commercial EULA and subscription lifecycle increase lock-in risk ([Kendo EULA](https://www.telerik.com/purchase/license-agreement/kendo-ui), [Kendo licensing](https://www.telerik.com/kendo-react-ui/components/my-license)). | **7** — core is MIT, but advanced grid/chart/tree capabilities often shift to commercial MUI X plans ([MUI X README](https://raw.githubusercontent.com/mui/mui-x/master/README.md)). | **7** — MIT licensing lowers legal lock-in, though framework-level coupling can still create technical switching cost ([Vuetify LICENSE](https://raw.githubusercontent.com/vuetifyjs/vuetify/master/packages/vuetify/LICENSE.md)). |
| Ecosystem maturity (10%) | **8** — long-lived commercial ecosystem with support, templates, and tooling ([Kendo pricing/features](https://www.telerik.com/kendo-react-ui/pricing)). | **9** — very large ecosystem and sustained OSS/community momentum around Material UI + MUI X ([MUI README](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/README.md), [MUI X README](https://raw.githubusercontent.com/mui/mui-x/master/README.md)). | **8** — mature Vue ecosystem option with established component suite ([Vuetify docs](https://vuetifyjs.com/en/)). |
| **AI-Assisted Development Effectiveness (15%)** | **PENDING HUMAN EXECUTION** — score must come from [`ai-comparison-protocol.md`](./ai-comparison-protocol.md); contribution formula: `protocol_score / 100 × 15%`. | **PENDING HUMAN EXECUTION** — score must come from [`ai-comparison-protocol.md`](./ai-comparison-protocol.md); contribution formula: `protocol_score / 100 × 15%`. | **PENDING HUMAN EXECUTION** — score must come from [`ai-comparison-protocol.md`](./ai-comparison-protocol.md); contribution formula: `protocol_score / 100 × 15%`. |

## Provisional weighted subtotal (excluding AI 15%)

| Candidate | Weighted subtotal across first 7 criteria (max 85) |
| --- | ---: |
| React + KendoReact | 58.0 |
| React + Material UI | 69.0 |
| Vue 3 + Vuetify | 62.0 |

Final ranking is intentionally blocked until the AI 15% controlled run is executed and scored.
