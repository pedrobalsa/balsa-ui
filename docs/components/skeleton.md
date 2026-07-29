# Skeleton

Skeleton reserves the geometry of content that has not loaded yet. Text mode can render one to twelve lines with a shorter final line; rectangle and circle modes provide useful size presets while consumer classes can match the exact final box.

Skeleton output is always `aria-hidden`. Put `aria-busy="true"` and an accessible loading name on the region that owns the pending content. Install with `npx balsa-ui@latest add skeleton`. Canonical source: `src/components/ui/Skeleton.vue`; interactive documentation: `/docs/components/skeleton`; contract: `specs/components/skeleton.json`.

The component supports text, rectangle, and circle shapes; muted, soft, and glass materials; `sm`, `md`, and `lg` sizes; the shared `Rounded` scale; pulse, wave, and static animation; reduced-motion fallback; consumer class overrides; and `theme?: ThemeInput`.
