# UsageSummaryCard

Time-series usage, key totals, and quota progress in one panel. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add usage-summary-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Vercel projects](https://vercel.com/docs/projects). Canonical source: \`src/components/compositions/UsageSummaryCard.vue\`; contract: \`specs/components/usage-summary-card.json\`.
