# Select

Select exposes `outline`, `surface` (default), `soft`, and `glass` variants for both its trigger and listbox.

Use Tailwind-style `rounded` values from `none` through `full` for both the trigger and listbox; the existing `sm` and `md` presets control field size.

Use Select for one or more values from a finite list; use Autocomplete when users need to filter a larger suggestion set. Set `multiple` to bind an array of values: selected options retain checkmarks and the listbox stays open while users toggle choices with pointer, Enter, or Space. Every option uses the same fixed row height, with a slight gap between items, so selection and checkmarks never resize the menu; selected material uses the semantic selected surface at 80% opacity. Choose `size="sm"` for compact property panels and `size="md"` for the default form treatment. Consumer `class` and `style` attributes merge onto the combobox trigger for local layout adjustments without adding competing visual variants. Its browser-top-layer listbox stays visible across clipped cards and other overflow containers. The typed `selected` and `option` slots can add concise visual context such as swatches or secondary text while the option label remains the selection identity. It provides typed options, keyboard listbox behavior, labels, hints, loading, disabled, and validation states. Install with `npx balsa-ui@latest add select`. Canonical source: `src/components/ui/Select.vue`; interactive documentation: `/docs/components/select`; contract: `specs/components/select.json`.

Select inherits the nearest `data-theme` and accepts `theme?: ThemeInput`; its top-layer listbox keeps the same override.

Trigger classes are conflict-merged after the selected size and state defaults, so ordinary geometry utilities can replace them without important modifiers.
