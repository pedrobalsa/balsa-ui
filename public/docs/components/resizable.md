# Resizable

Resizable divides one bounded region into two panels with a controlled first-panel percentage. Its separator supports pointer capture, horizontal or vertical geometry, Arrow-key steps, and Home/End limits while reporting the current value to assistive technology. Compose a nested Resizable inside one panel when a workspace needs three or more panes.

Use Resizable for editor panes, master-detail layouts, and direct comparison. Prefer responsive stacking when either panel becomes unusable at its minimum. Install with `npx balsa-ui@latest add resizable`. Canonical source: `src/components/ui/Resizable.vue`; interactive documentation: `/docs/components/resizable`; contract: `specs/components/resizable.json`.

The component provides horizontal and vertical orientation, explicit min/max/step values, optional grip, disabled state, three handle sizes, `surface`, `outline`, `soft`, and `glass` materials, shared `Rounded`, two named panel slots, consumer class merging, and `theme?: ThemeInput`.
