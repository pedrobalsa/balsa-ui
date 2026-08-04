# TransactionListCard

Scannable activity rows with identity, metadata, time, and amount. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add transaction-list-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Primer ActionList](https://primer.style/product/components/action-list/guidelines/). Canonical source: \`src/components/compositions/TransactionListCard.vue\`; contract: \`specs/components/transaction-list-card.json\`.
