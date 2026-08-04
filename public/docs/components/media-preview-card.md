# MediaPreviewCard

Asset preview, publication status, and replacement action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add media-preview-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Spectrum components](https://opensource.adobe.com/spectrum-web-components/index.html). Canonical source: \`src/components/compositions/MediaPreviewCard.vue\`; contract: \`specs/components/media-preview-card.json\`.
