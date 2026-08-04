# MetricGridCard

Aligned operational KPIs with labels, values, and supporting detail. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add metric-grid-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Vercel projects](https://vercel.com/docs/projects). Canonical source: \`src/components/compositions/MetricGridCard.vue\`; contract: \`specs/components/metric-grid-card.json\`.
