# Accordion

Accordion composes public Collapsible items into one connected, vertically stacked disclosure surface. It supports one open item with optional all-closed state or multiple independently open items. ArrowUp and ArrowDown wrap focus among enabled triggers; Home and End move to the edges; Enter and Space retain native button behavior.

Use Accordion for frequently asked questions or related supporting sections. Use Tabs for mutually exclusive peer views and standalone Collapsible for one disclosure. Install with `npx balsa-ui@latest add accordion`. The registry installs Collapsible automatically. Canonical source: `src/components/ui/Accordion.vue`; interactive documentation: `/docs/components/accordion`; contract: `specs/components/accordion.json`.

Items provide stable ids, visible titles, optional fallback content, and per-item disabled state. Named slots matching each item id can replace fallback content. The component supports borderless `underline` alongside `surface`, `outline`, `soft`, and `glass` materials, `sm`, `md`, and `lg` sizes, the shared Tailwind-style `rounded` scale, semantic heading levels, group disabled state, and local `theme?: ThemeInput`.
