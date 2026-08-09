# DeviceVerificationCard

Single-purpose one-time-code step with resend and explicit confirmation. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add device-verification-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

It is designed for a 1x1 gallery tile; see the composition catalog for what that means and why the span is part of the design rather than a layout hint.

Pattern research: [Auth0 multifactor](https://auth0.com/docs/secure/multi-factor-authentication). Canonical source: \`src/components/compositions/DeviceVerificationCard.vue\`; contract: \`specs/components/device-verification-card.json\`.
