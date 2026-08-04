# TransferFundsCard

Account-to-account transfer form with arrival, fee, and total summary. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add transfer-funds-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Stripe Dashboard basics](https://docs.stripe.com/dashboard/basics). Canonical source: \`src/components/compositions/TransferFundsCard.vue\`; contract: \`specs/components/transfer-funds-card.json\`.
