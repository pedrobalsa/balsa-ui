# AccountSecurityCard

Credential update and separated destructive account action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add account-security-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [USWDS create-account guidance](https://designsystem.digital.gov/templates/authentication-pages/create-account/). Canonical source: \`src/components/compositions/AccountSecurityCard.vue\`; contract: \`specs/components/account-security-card.json\`.
