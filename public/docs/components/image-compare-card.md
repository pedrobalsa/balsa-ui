# ImageCompareCard

Before-and-after comparison where the reader sets the split. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add image-compare-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x1.5 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Figma version compare](https://help.figma.com/hc/en-us/articles/360038006754). Canonical source: \`src/components/compositions/ImageCompareCard.vue\`; contract: \`specs/components/image-compare-card.json\`.
