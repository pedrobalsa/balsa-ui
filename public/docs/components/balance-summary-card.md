# BalanceSummaryCard

Compact balance, availability, and contextual action summary. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add balance-summary-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Stripe Dashboard basics](https://docs.stripe.com/dashboard/basics). Canonical source: \`src/components/compositions/BalanceSummaryCard.vue\`; contract: \`specs/components/balance-summary-card.json\`.
