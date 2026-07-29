# Badge

Badge supports `sm`, `md`, and `lg` sizes plus Tailwind-style `rounded` values: `none`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, and `full`.

Use Badge for short, passive status, category, or metadata labels. It supports solid, soft, outline, and low-rim translucent glass variants with typed action and status intent; keep an explicit text label so color is never the only signal. Install with `npx balsa-ui@latest add badge`. Canonical source: `src/components/ui/Badge.vue`; interactive documentation: `/docs/components/badge`; contract: `specs/components/badge.json`.

Badge inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.

Consumer root classes and styles are merged after Badge defaults, so normal spacing, typography, and radius utilities can customize the status treatment without important modifiers.
