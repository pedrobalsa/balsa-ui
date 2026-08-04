# ErrorStateCard

Recoverable failure with request context and retry action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add error-state-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Vercel Geist empty state](https://vercel.com/geist/empty-state). Canonical source: \`src/components/compositions/ErrorStateCard.vue\`; contract: \`specs/components/error-state-card.json\`.
