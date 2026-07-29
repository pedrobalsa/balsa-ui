# Dropdown

Use Dropdown for a compact panel anchored to a relative parent. It provides `surface`, `outline`, `soft`, and `glass` materials with `primary`, `secondary`, `accent`, and `destructive` color roles, configurable `width` and `rounded` geometry, and aligns to the parent's `start`, `end`, or `center`. It uses no outer shadow. Use `align="auto"` when a trigger can approach either viewport edge; the panel flips to the safe edge instead of overflowing. The consumer owns the trigger and uses the default slot for native links or buttons.

Install it with `npx balsa-ui@latest add dropdown`. Canonical source: `src/components/ui/Dropdown.vue`; interactive documentation: `/docs/components/dropdown`; contract: `specs/components/dropdown.json`.

Dropdown inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
