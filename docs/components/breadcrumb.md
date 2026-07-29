# Breadcrumb

Use Breadcrumb to communicate a compact location hierarchy. Each item accepts a label and optional `href`; applicable ancestors render as native links, while the resolved current item exposes `aria-current="page"`. Choose `chevron`, `slash`, or `dot` separators and `sm` or `md` sizing. Install with `npx balsa-ui@latest add breadcrumb`. Canonical source: `src/components/ui/Breadcrumb.vue`; interactive documentation: `/docs/components/breadcrumb`; contract: `specs/components/breadcrumb.json`.

Breadcrumb inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
