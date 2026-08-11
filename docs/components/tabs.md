# Tabs

Tabs supports `surface`, `outline`, `soft`, and `glass` materials, plus `segmented`, `underline`, `pills`, and icon-forward `tiles` layouts. It also supports `sm`, `md`, and `lg` scales and Tailwind-style `rounded` values from `none` through `full` for its connected and panel surfaces. Underline tabs default to square geometry, and their tab list always keeps square corners so the active underline stays straight. Set `:panel-surface="false"` to keep the tabpanel semantics while rendering your inserted content without the default card material or padding. If no default or item-named panel slot is supplied, the associated empty panel remains semantic but receives no surface, spacing, or focus stop.

Use Tabs to switch among related local panels, including a filtered result set placed inside the active panel. Non-tile tab lists scroll horizontally when their labels exceed the available width, without consumer selectors or a cross-axis scrollbar. It implements tablist, tab, and tabpanel semantics plus Left/Right, Home, and End keyboard navigation; Up/Down remain available for page scrolling. Install with `npx balsa-ui@latest add tabs`. Canonical source: `src/components/ui/Tabs.vue`; interactive documentation: `/docs/components/tabs`; contract: `specs/components/tabs.json`.

Tabs inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
