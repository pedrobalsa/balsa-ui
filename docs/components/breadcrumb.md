# Breadcrumb

Use Breadcrumb to communicate a compact location hierarchy. Each item accepts a label and optional `href`; applicable ancestors render as native links, while the resolved current item exposes `aria-current="page"`. Choose `chevron`, `slash`, or `dot` separators and `sm` or `md` sizing. Install with `npx balsa-ui@latest add breadcrumb`. Canonical source: `src/components/ui/Breadcrumb.vue`; interactive documentation: `/docs/components/breadcrumb`; contract: `specs/components/breadcrumb.json`.

Breadcrumb inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.

Clicking a navigable ancestor emits `navigate(item, event)` with a normalized `NavigationLink` and the original `MouseEvent`. Breadcrumb never prevents the native anchor itself, so a client router can opt into same-origin interception without removing ordinary link fallback or modifier-click behavior.
