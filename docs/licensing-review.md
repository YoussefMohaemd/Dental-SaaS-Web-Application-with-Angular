# Licensing Review: KendoReact vs MUI vs Vuetify

Date retrieved: 2026-09-26

## Sources

- KendoReact free vs premium overview: https://www.telerik.com/kendo-react-ui/components/getting-started/free-vs-premium
- KendoReact license activation requirements: https://www.telerik.com/kendo-react-ui/components/my-license
- KendoReact pricing page: https://www.telerik.com/kendo-react-ui/pricing
- Progress Kendo UI EULA: https://www.telerik.com/purchase/license-agreement/kendo-ui
- Material UI MIT license: https://raw.githubusercontent.com/mui/material-ui/master/LICENSE
- Material UI package README (license reference): https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/README.md
- MUI X README (open-core/commercial split): https://raw.githubusercontent.com/mui/mui-x/master/README.md
- Vuetify MIT license: https://raw.githubusercontent.com/vuetifyjs/vuetify/master/packages/vuetify/LICENSE.md

## Summary table

| Candidate | Free usage | Premium/commercial boundary | Trial behavior | Long-term dependency risk |
| --- | --- | --- | --- | --- |
| React + KendoReact | Yes, KendoReact Free tier (50+ components) | Premium tier (120+ components/features/support) needs license-key workflow and commercial subscription | Trial unlocks premium temporarily, with license key required for premium use | Higher legal/procurement coupling when premium features are adopted |
| React + MUI | Material UI core is MIT | MUI X follows open-core model: community packages MIT, Pro/Premium features commercial | Commercial evaluation depends on MUI X plans; advanced feature sets map to paid tiers | Moderate: low lock-in on core, but advanced data-grid/chart/tree capabilities can couple to paid MUI X |
| Vue 3 + Vuetify | MIT-licensed framework | No separate paid core license in primary framework package | No license-key gating in the framework license flow | Lower legal lock-in, but still carries technical migration cost if framework strategy changes |

## Notes by candidate

### React + KendoReact (Telerik)

- KendoReact docs state a **free** tier and a **premium** tier, with premium requiring license management.
- Premium usage requires installing and activating a license key via `@progress/kendo-licensing`.
- Pricing page states paid per-developer subscriptions for premium support/features.
- The EULA and subscription lifecycle introduce procurement/governance overhead (renewals, license-key refresh, entitlement tracking).

Implication:

- Excellent enterprise support story, but non-trivial commercial governance overhead for long-term maintenance.

### React + Material UI

- Material UI core is MIT licensed.
- MUI X README explicitly describes **open-core** packaging: community MIT packages + commercial Pro/Premium packages for advanced capabilities.

Implication:

- Strong default legal flexibility with MIT core, but advanced features may require recurring commercial licensing decisions.

### Vue 3 + Vuetify

- Vuetify framework package license is MIT.

Implication:

- Minimal license-gating overhead at framework level; risk is primarily technical (framework ecosystem choice), not legal.

## npm package licensing implications

- MIT packages (`@mui/material`, `vuetify`) generally support broad redistribution/use with attribution requirements.
- Mixed/commercial ecosystems (KendoReact premium and MUI X Pro/Premium packages) require governance around:
  - package selection boundaries,
  - CI/CD entitlement checks,
  - renewal and procurement continuity,
  - developer-seat compliance.

## POC implication for this repository

Per DEV-1 in [`scope-exceptions.md`](./scope-exceptions.md), this repository remains on the approved Angular stack. This licensing review is evidence for the assignment comparison record, not a migration trigger.
