# Checkbox

Checkbox exposes `outline`, `surface` (default), `soft`, and `glass` variants for its unchecked control.

Checkbox supports `sm`, `md`, and `lg` control sizes plus Tailwind-style `rounded` values from `none` through `full`.

Use Checkbox for explicit independent selections such as agreement or multi-option choices. It uses a native checkbox with an associated label, hint, required state, and disabled state. Install with `npx balsa-ui@latest add checkbox`. Canonical source: `src/components/ui/Checkbox.vue`; interactive documentation: `/docs/components/checkbox`; contract: `specs/components/checkbox.json`.

Checkbox inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
