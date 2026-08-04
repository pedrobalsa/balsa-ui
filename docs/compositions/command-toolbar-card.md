# CommandToolbarCard

Stacked command launcher with consistently aligned icon cells, labels, descriptions, shortcuts, and full-row actions. The vertical list stays balanced when labels or shortcut lengths differ and avoids claiming toolbar keyboard behavior it does not implement. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add command-toolbar-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines). Canonical source: \`src/components/compositions/CommandToolbarCard.vue\`; contract: \`specs/components/command-toolbar-card.json\`.
