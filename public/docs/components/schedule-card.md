# ScheduleCard

Date selection paired with a concise upcoming-event list. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add schedule-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Fluent Calendar roadmap](https://fluent2.microsoft.design/component-roadmap/). Canonical source: \`src/components/compositions/ScheduleCard.vue\`; contract: \`specs/components/schedule-card.json\`.
