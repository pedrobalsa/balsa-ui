# ServiceHealthCard

Half-height status strip reporting state and latency per region. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add service-health-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x0.5 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Cloudflare status](https://www.cloudflarestatus.com). Canonical source: \`src/components/compositions/ServiceHealthCard.vue\`; contract: \`specs/components/service-health-card.json\`.
