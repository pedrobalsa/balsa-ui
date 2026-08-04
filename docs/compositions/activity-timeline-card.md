# ActivityTimelineCard

Chronological actor, action, target, and time event stream. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add activity-timeline-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Primer ActionList](https://primer.style/product/components/action-list/guidelines/). Canonical source: \`src/components/compositions/ActivityTimelineCard.vue\`; contract: \`specs/components/activity-timeline-card.json\`.
