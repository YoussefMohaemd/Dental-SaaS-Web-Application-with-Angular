# Technology Comparison

Date: 2026-09-22

This comparison treats the technologies according to their actual roles in the repository. Angular is the application framework, PrimeNG and Taiga UI are component systems, Angular CDK is a low-level interaction toolkit, and Tailwind CSS is the utility styling system.

## Angular

Role: application framework.

Strengths: strong routing, standalone components, dependency injection, forms, signals, and a mature TypeScript-based architecture.

Limitations: does not provide a large enterprise component suite by itself.

Maintainability: high in this repository because the app already uses typed services, standalone components, and clear feature boundaries.

Accessibility: depends on the authored templates and chosen component libraries.

Customization: high because the framework is flexible and does not lock the UI into a single visual language.

Design-system integration: strong when paired with centralized tokens and shared controls.

Technical suitability: already proven by the current app shell and routed feature architecture.

Dependency considerations: framework upgrade path must be managed carefully, but the current codebase already aligns on Angular 21.

Performance considerations: good for this POC, especially with lazy-loaded routed features and signal-based state.

Current project fit: excellent.

## PrimeNG

Role: enterprise UI component library.

Strengths: provides complex widgets such as TreeTable, dialogs, tables, paginator controls, and form elements that reduce custom implementation effort (cards and badges are provided by PrimeNG but not used in this POC).

Limitations: visual defaults need theming alignment to match the project system.

Maintainability: good when used for complex widgets and wrapped with clear project conventions.

Accessibility: useful baseline, but authored markup and configuration still matter.

Customization: high enough for the current POC, especially with themed overrides in global styles.

Design-system integration: strong because global token mapping already exists in the repo.

Technical suitability: strong for the Orders TreeTable and dialog-heavy surfaces.

Dependency considerations: introduces a substantial component dependency, so it should be used intentionally rather than as a catch-all.

Performance considerations: acceptable for this POC; complex tables should still be measured carefully.

Current project fit: excellent for enterprise data-heavy surfaces.

## Taiga UI

Role: Angular UI/component system where applicable.

Strengths: good Angular ergonomics and a clean root/layout integration surface.

Limitations: it is not the primary enterprise widget system in this repo and should not be treated as a duplicate of PrimeNG.

Maintainability: good when its role is limited and well defined.

Accessibility: depends on the specific Taiga widgets used and how they are composed.

Customization: suitable for the root and targeted UI primitives, but not a replacement for the current enterprise component layer.

Design-system integration: adequate for shared base styling and root setup.

Technical suitability: appropriate for the app root and any low-friction Angular UI primitives.

Dependency considerations: should remain scoped to avoid overlap with PrimeNG responsibilities.

Performance considerations: neutral for the current usage level.

Current project fit: good as a supporting UI system, not as the primary enterprise table/dialog stack.

## Angular CDK

Role: low-level UI and interaction primitives.

Strengths: drag/drop, overlay support, accessibility primitives, and foundational utilities without imposing a design system.

Limitations: intentionally not a component library; it needs custom UI around it.

Maintainability: high when used for discrete behavior such as the workflow board.

Accessibility: strong foundation for keyboard and interaction behavior if used correctly.

Customization: very high because it only supplies primitives.

Design-system integration: excellent because it does not compete with the visual system.

Technical suitability: excellent for the workflow board drag/drop and interaction logic.

Dependency considerations: minimal overlap risk, since its responsibility is different from PrimeNG and Taiga UI.

Performance considerations: good; behavior is usually lightweight compared with full widgets.

Current project fit: excellent.

## Tailwind CSS

Role: utility-first styling and layout system.

Strengths: fast layout iteration, consistent spacing, and easy token application without inventing custom CSS for every view.

Limitations: can produce style duplication if not paired with shared components and tokens.

Maintainability: strong here because tokens are centralized and the current styles already use shared values.

Accessibility: neutral by itself; it supports accessible layouts but does not guarantee them.

Customization: excellent for layout and spacing while preserving the existing visual language.

Design-system integration: strong because the repo already maps tokens into Tailwind theme values.

Technical suitability: very good for the current app shell and page layout work.

Dependency considerations: should remain a styling layer, not a second component library.

Performance considerations: good, especially with the current generated stylesheet approach.

Current project fit: excellent.

## Summary

The current project fit is strongest when each technology keeps its own responsibility:

- Angular owns application structure.
- PrimeNG owns enterprise widgets.
- Taiga UI supports Angular UI/root integration where needed.
- Angular CDK owns interaction primitives.
- Tailwind owns utility styling and layout.

That separation matches the inspected codebase and should be preserved.