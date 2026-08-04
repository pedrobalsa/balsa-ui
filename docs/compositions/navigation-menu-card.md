# NavigationMenuCard

Sectioned local navigation with an explicit current destination. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add navigation-menu-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Vercel dashboard navigation](https://vercel.com/changelog/dashboard-navigation-redesign-rollout). Canonical source: \`src/components/compositions/NavigationMenuCard.vue\`; contract: \`specs/components/navigation-menu-card.json\`.
