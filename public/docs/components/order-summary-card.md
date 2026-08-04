# OrderSummaryCard

Line items, calculated totals, and order confirmation. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add order-summary-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Carbon progress indicator](https://carbondesignsystem.com/components/progress-indicator/usage/). Canonical source: \`src/components/compositions/OrderSummaryCard.vue\`; contract: \`specs/components/order-summary-card.json\`.
