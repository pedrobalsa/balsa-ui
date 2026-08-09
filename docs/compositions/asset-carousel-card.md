# AssetCarouselCard

Browsable run of captured assets with captions and review status. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add asset-carousel-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x1 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Figma file previews](https://help.figma.com). Canonical source: \`src/components/compositions/AssetCarouselCard.vue\`; contract: \`specs/components/asset-carousel-card.json\`.
