# AnalyticsChartCard

Trend visualization with period context and semantic delta. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add analytics-chart-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Stripe reports](https://docs.stripe.com/stripe-reports). Canonical source: \`src/components/compositions/AnalyticsChartCard.vue\`; contract: \`specs/components/analytics-chart-card.json\`.
