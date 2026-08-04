# InviteMembersCard

Repeatable email and role rows with a single invitation action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add invite-members-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Fluent PeoplePicker roadmap](https://fluent2.microsoft.design/component-roadmap/). Canonical source: \`src/components/compositions/InviteMembersCard.vue\`; contract: \`specs/components/invite-members-card.json\`.
