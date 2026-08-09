# IncidentAlertCard

Half-height incident banner with acknowledge and open actions. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add incident-alert-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 2x0.5 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Datadog incidents](https://docs.datadoghq.com/service_management/incident_management/). Canonical source: \`src/components/compositions/IncidentAlertCard.vue\`; contract: \`specs/components/incident-alert-card.json\`.
