# Dropdown Menu

Dropdown Menu presents typed actions, labels, separators, checkbox/radio state, shortcuts, destructive items, and one-level submenus from a native button. Item labels may provide `labelFontFamily` when the font itself is the value being previewed. It supports semantic `color` and `rounded` panel geometry. The shared menu engine provides roving focus, Arrow/Home/End keys, typeahead, collision-safe portal positioning, Escape/outside dismissal, and focus restoration. Install with `npx balsa-ui@latest add dropdown-menu`.

The trigger follows the live control-radius token unless an explicit `rounded` corner is requested, so theme edits restyle it alongside the panel it opens.

The same install ships `PropertySelect`, a full-width property row that stacks a quiet caption over the current value with a trailing icon or swatch. Pass `items` to pick a value from the menu, or omit them and place an interactive control such as a ColorPicker in the `trailing` slot — the whole row forwards clicks to it, so the visible target matches the clickable one. It resolves against the same `dropdown-menu` theme contract.

Canonical source: `src/components/ui/DropdownMenu.vue`; interactive documentation: `/docs/components/dropdown-menu`; contract: `specs/components/dropdown-menu.json`.
