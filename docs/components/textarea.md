# Textarea

Textarea exposes `outline`, `surface` (default), `soft`, and `glass` variants for its base material.

Use Textarea for multi-line notes, messages, descriptions, and configuration. It follows Input's label, validation, loading, size, and Tailwind-style `rounded` contracts, while adding native `rows`, `resizable`, `autoExpand`, and pixel `maxHeight` controls. Set `auto-expand` for content-led height and `max-height` to cap growth before internal scrolling begins. Install with `npx balsa-ui@latest add textarea`. Dependencies: Vue, MDI, and the Balsa theme foundation. Canonical source: `src/components/ui/Textarea.vue`; interactive documentation: `/docs/components/textarea`; contract: `specs/components/textarea.json`.

Textarea inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
