# Avatar

Avatar represents a person or entity through one accessible image surface. It displays explicit fallback text or deterministic initials while an image is absent, loading, delayed, or failed, then swaps in a successfully loaded source without changing geometry.

Use Avatar for identity in profiles, lists, and ownership cues. Wrap it in a semantic Link or Button when it must be interactive. Install with `npx balsa-ui@latest add avatar`. Canonical source: `src/components/ui/Avatar.vue`; interactive documentation: `/docs/components/avatar`; contract: `specs/components/avatar.json`.

The component provides `sm`, `md`, `lg`, and `xl` sizes; `circle`, `rounded`, and `square` shapes; native eager or lazy image loading; delayed fallback; custom fallback and badge slots; image-state events; consumer class merging; and `theme?: ThemeInput`.
