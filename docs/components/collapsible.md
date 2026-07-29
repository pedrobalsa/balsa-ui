# Collapsible

Collapsible reveals one optional region from a native disclosure button. It keeps its content mounted for browser search while making the closed panel inert and hidden from assistive technology. The trigger exposes `aria-expanded`, controls a labelled region, and responds to native Enter and Space activation.

Use Collapsible for one block of optional supporting detail. Use Accordion when several related disclosures need coordinated single or multiple state. Install with `npx balsa-ui@latest add collapsible`. Canonical source: `src/components/ui/Collapsible.vue`; interactive documentation: `/docs/components/collapsible`; contract: `specs/components/collapsible.json`.

The component defaults to the compact `underline` disclosure and also supports `surface`, `outline`, `soft`, and `glass` materials. Closed panels retract all content padding and borders. It supports `sm`, `md`, and `lg` sizes, the shared Tailwind-style `rounded` scale, semantic heading levels 2 through 6, disabled state, a scoped trigger slot, and default panel content. It inherits the nearest design theme and accepts `theme?: ThemeInput`.
