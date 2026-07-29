# Kbd

Kbd presents one keyboard input or a complete chord in semantic `<kbd>` markup. Pass `keys` for individually styled key caps or use the default slot for one custom key. Use `accessibleLabel` when symbolic modifiers such as `⌘` or `⌥` need an expanded spoken name.

Use Kbd for real keyboard shortcuts and key instructions, never as a clickable control or generic label. Install with `npx balsa-ui@latest add kbd`. Canonical source: `src/components/ui/Kbd.vue`; interactive documentation: `/docs/components/kbd`; contract: `specs/components/kbd.json`.

The component defaults to the supporting `soft` material and also supports `raised` and `outline`, `sm`, `md`, and `lg` sizes, a configurable chord separator, the shared `Rounded` scale, consumer class overrides, and `theme?: ThemeInput`.
