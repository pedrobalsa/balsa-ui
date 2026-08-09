# SchedulePlannerCard

Calendar paired with the bookable hours for the chosen day. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add schedule-planner-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x2 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Cal.com booking](https://cal.com/docs). Canonical source: \`src/components/compositions/SchedulePlannerCard.vue\`; contract: \`specs/components/schedule-planner-card.json\`.
