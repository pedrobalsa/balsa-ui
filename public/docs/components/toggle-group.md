# ToggleGroup

Use ToggleGroup for a connected set of exclusive or multiple pressed-state actions. It composes Toggle, accepts typed options with unique ids, labels, optional MDI icons, and per-item disabled state, and exposes a string model in `single` mode or a string-array model in `multiple` mode. Install with `npx balsa-ui@latest add toggle-group`. Canonical source: `src/components/ui/ToggleGroup.vue`; interactive documentation: `/docs/components/toggle-group`; contract: `specs/components/toggle-group.json`.

The group has one accessible label and each option remains a real `aria-pressed` button. A roving tab stop enters on the selected or first enabled item. Arrow keys move along the configured horizontal or vertical axis, Home and End move to the boundaries, disabled options are skipped, and focus wraps.

Single mode allows an empty value by default, matching conventional pressed-state groups. Set `:allow-empty="false"` when the surrounding task must always retain one active option. Multiple mode toggles ids independently and emits a new array without mutating the consumer value.

`variant`, `color`, `size`, and `rounded` apply consistently to the connected control. Enabled group controls retain the pointer cursor, while disabled controls use the not-allowed cursor. ToggleGroup inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for an independent Modern Flat, Brutalism, or Glassmorphism override.

Use ButtonGroup for mutually exclusive view actions that always have one selected destination. Use ToggleGroup when each item represents persistent pressed state.
