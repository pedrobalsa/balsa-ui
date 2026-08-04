# SubscriptionCard

Plan, renewal, included usage, and management action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add subscription-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Stripe Dashboard basics](https://docs.stripe.com/dashboard/basics). Canonical source: \`src/components/compositions/SubscriptionCard.vue\`; contract: \`specs/components/subscription-card.json\`.
