# Autocomplete

Autocomplete exposes `outline`, `surface` (default), `soft`, and `glass` variants for both its input and suggestion list.

Use Tailwind-style `rounded` values from `none` through `full` for both the input and suggestion list; the existing `sm` and `md` presets control field size.

Use Autocomplete for assisted text entry with filtered suggestions. Set `multiple` to bind an array of selected suggestions while keeping the query editable: choosing a suggestion toggles it, selected values render accessible remove actions, and Backspace removes the final value only when the query is empty. Choose `size="sm"` for compact search and property surfaces or `size="md"` for the default form treatment. It shares Input and Select geometry, label, feedback, focus, popup, and option styling; consumer `class` and `style` attributes merge onto the native input for local layout adjustments. Its manually controlled browser-top-layer suggestion list remains visible across clipped cards and navigation rails without light-dismissing the opening click. It implements editable combobox semantics, keyboard navigation, accessible field feedback, and loading and validation states. Install with `npx balsa-ui@latest add autocomplete`. Dependencies: Vue, Balsa Button, and the Balsa theme foundation. Canonical source: `src/components/ui/Autocomplete.vue`; interactive documentation: `/docs/components/autocomplete`; contract: `specs/components/autocomplete.json`.

Autocomplete inherits the nearest `data-theme` and accepts `theme?: ThemeInput`; its top-layer suggestions keep the same override.

Native-control classes are conflict-merged after the selected size and state defaults, so ordinary geometry utilities can replace them without important modifiers.
