# LoadingStateCard

Stable skeleton geometry with accessible busy semantics. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add loading-state-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Carbon loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/). Canonical source: \`src/components/compositions/LoadingStateCard.vue\`; contract: \`specs/components/loading-state-card.json\`.
