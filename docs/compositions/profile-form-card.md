# ProfileFormCard

Labelled profile fields with picture, handle, time zone, and biography. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add profile-form-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 1x2 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [GitHub profile settings](https://docs.github.com/account-and-profile). Canonical source: \`src/components/compositions/ProfileFormCard.vue\`; contract: \`specs/components/profile-form-card.json\`.
