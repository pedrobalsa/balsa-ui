# FormProgressCard

Linear multistep progress with current-step semantics. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add form-progress-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [USWDS progress guidance](https://designsystem.digital.gov/patterns/complete-a-complex-form/progress-easily/). Canonical source: \`src/components/compositions/FormProgressCard.vue\`; contract: \`specs/components/form-progress-card.json\`.
