# SavingsGoalCard

Goal values and progress presented in a repeatable financial rhythm. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add savings-goal-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Stripe reports](https://docs.stripe.com/stripe-reports). Canonical source: \`src/components/compositions/SavingsGoalCard.vue\`; contract: \`specs/components/savings-goal-card.json\`.
