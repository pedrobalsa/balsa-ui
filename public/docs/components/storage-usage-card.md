# StorageUsageCard

Half-height single measurement with the bar that puts it in context. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add storage-usage-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 1x0.5 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [AWS S3 storage lens](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage_lens.html). Canonical source: \`src/components/compositions/StorageUsageCard.vue\`; contract: \`specs/components/storage-usage-card.json\`.
