# EmptyStateCard

Blank-slate explanation with one primary next step. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add empty-state-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Primer empty states](https://primer.style/product/ui-patterns/empty-states/). Canonical source: \`src/components/compositions/EmptyStateCard.vue\`; contract: \`specs/components/empty-state-card.json\`.
