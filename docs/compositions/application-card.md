# ApplicationCard

ApplicationCard provides the repeated header, action, body, and optional footer anatomy used by application dashboards and workspaces. It composes Card rather than replacing it, so the active theme continues to own material, radius, border width and style, density, and elevation. Install it with `npx balsa-ui@latest add application-card`.

Canonical source: `src/components/compositions/ApplicationCard.vue`; interactive documentation: `/docs/compositions/application-card`; contract: `specs/components/application-card.json`.

Use `title` and `description` for the standard compact header, or replace it with the `header` slot. `headingLevel` defaults to 2 and should match the surrounding document hierarchy. The `action` slot stays aligned at the header end, the default slot owns the body, and `footer` adds a token-sized semantic separator.

ApplicationCard inherits the nearest design context and accepts `theme?: ThemeInput` for a local override. Its `variant`, `size`, `rounded`, and `shadow` props are forwarded through Card's typed contract. Its color contract is deliberately limited to `neutral`, `primary`, `secondary`, and `accent`, keeping application compositions tied to the editable source palette rather than derived feedback colors. Leave appearance props undefined when the active theme should remain authoritative; use explicit values only for a deliberate local exception.
