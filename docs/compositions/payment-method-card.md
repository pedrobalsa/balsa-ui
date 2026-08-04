# PaymentMethodCard

Selectable saved payment methods and a focused continuation action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add payment-method-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Carbon structured list](https://carbondesignsystem.com/components/structured-list/usage/). Canonical source: \`src/components/compositions/PaymentMethodCard.vue\`; contract: \`specs/components/payment-method-card.json\`.
