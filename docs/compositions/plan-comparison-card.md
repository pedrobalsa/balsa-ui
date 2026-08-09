# PlanComparisonCard

Plan capabilities compared across tiers with a billing period switch. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add plan-comparison-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x1.5 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Stripe pricing table](https://docs.stripe.com/payments/checkout/pricing-table). Canonical source: \`src/components/compositions/PlanComparisonCard.vue\`; contract: \`specs/components/plan-comparison-card.json\`.
