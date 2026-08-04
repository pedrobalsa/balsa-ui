# OnboardingChecklistCard

Setup tasks with progress and complete/current/future state. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add onboarding-checklist-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Primer feature onboarding](https://primer.style/product/ui-patterns/feature-onboarding/). Canonical source: \`src/components/compositions/OnboardingChecklistCard.vue\`; contract: \`specs/components/onboarding-checklist-card.json\`.
