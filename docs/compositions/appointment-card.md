# AppointmentCard

Appointment time selection with preparation guidance and confirmation. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add appointment-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [USWDS date guidance](https://designsystem.digital.gov/patterns/create-a-user-profile/enter-a-memorable-date/). Canonical source: \`src/components/compositions/AppointmentCard.vue\`; contract: \`specs/components/appointment-card.json\`.
