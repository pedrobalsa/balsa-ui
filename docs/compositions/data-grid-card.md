# DataGridCard

Sortable, selectable, paginated table of records with real columns. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add data-grid-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x2 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Vercel deployments](https://vercel.com/docs/deployments). Canonical source: \`src/components/compositions/DataGridCard.vue\`; contract: \`specs/components/data-grid-card.json\`.
