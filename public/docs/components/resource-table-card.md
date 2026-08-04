# ResourceTableCard

Resource index with status, metadata, row selection, and creation action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add resource-table-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Shopify resource index](https://shopify.dev/docs/api/app-home/patterns/templates/resource-index). Canonical source: \`src/components/compositions/ResourceTableCard.vue\`; contract: \`specs/components/resource-table-card.json\`.
