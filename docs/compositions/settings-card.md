# SettingsCard

Related workspace settings with explicit reset and save actions. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add settings-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Shopify app patterns](https://polaris-site-prod-kit.shopify.prod.shopifyapps.com/patterns). Canonical source: \`src/components/compositions/SettingsCard.vue\`; contract: \`specs/components/settings-card.json\`.
