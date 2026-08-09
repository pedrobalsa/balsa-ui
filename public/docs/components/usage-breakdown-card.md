# UsageBreakdownCard

Stacked bars attributing billed usage to categories over time. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add usage-breakdown-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x1 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [AWS cost explorer](https://docs.aws.amazon.com/cost-management/). Canonical source: \`src/components/compositions/UsageBreakdownCard.vue\`; contract: \`specs/components/usage-breakdown-card.json\`.
