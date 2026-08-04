# NotificationPreferencesCard

Independently controlled notification channels with concise explanations. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add notification-preferences-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Primer ActionList](https://primer.style/product/components/action-list/guidelines/). Canonical source: \`src/components/compositions/NotificationPreferencesCard.vue\`; contract: \`specs/components/notification-preferences-card.json\`.
