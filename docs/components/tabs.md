# Tabs

Tabs supports `surface`, `outline`, `soft`, and `glass` materials, plus `segmented`, `underline`, `pills`, and icon-forward `tiles` layouts. It also supports `sm`, `md`, and `lg` scales and Tailwind-style `rounded` values from `none` through `full` for its connected and panel surfaces. Underline tabs default to square geometry, and their tab list always keeps square corners so the active underline stays straight. Set `:panel-surface="false"` to keep the tabpanel semantics while rendering your inserted content without the default card material or padding.

Use Tabs to switch among related local panels. It implements tablist, tab, and tabpanel semantics plus arrow, Home, and End keyboard navigation. Install with `npx balsa-ui@latest add tabs`. Canonical source: `src/components/ui/Tabs.vue`; interactive documentation: `/docs/components/tabs`; contract: `specs/components/tabs.json`.

Tabs inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
