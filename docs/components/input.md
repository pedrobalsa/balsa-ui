# Input

Input exposes `outline`, `surface` (default), `soft`, and `glass` variants for its base material.

Use Tailwind-style `rounded` values from `none` through `full`; the existing `sm` and `md` size presets remain available.

Use Input for short text, passwords, email, number, date, phone, monetary, and percentage values; use Select or Autocomplete when their interaction model fits better. Choose `size="sm"` for compact property panels and `size="md"` for the default form treatment. Consumer `class` and `style` attributes merge onto the native input for local layout adjustments without adding competing visual variants. A unique `id` and visible `label` are required. Loading, disabled, validated, and unvalidated states preserve native semantics, and invalid feedback is text-associated rather than color-only. Install with `npx balsa-ui@latest add input`. Dependencies: Vue, `@lucide/vue`, and the Balsa theme foundation. Canonical source: `src/components/ui/Input.vue`; interactive documentation: `/docs/components/input`; contract: `specs/components/input.json`.

Use `type="phone"` for the built-in `(##) #####-####` phone mask. Use a custom `mask` string with `#` digit placeholders for other compact formatted identifiers. Use `type="monetary"` for localized currency display; it emits a numeric amount through `v-model` while formatting the visible input. Set `currency` and `locale` when the defaults of `USD` and `en-US` do not match the form.

Use `type="percentage"` for a numeric 0â€“100 model value. It keeps the editable number separate from a persistent percent suffix so decimal entry remains natural, and clamps out-of-range input to 0â€“100.

Configure validation with `status="validated"` or `status="unvalidated"`; use `statusMessage` to provide the explicit associated error text for an unvalidated field.

Input inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.

Native-control classes are conflict-merged after the selected size and state defaults, so ordinary geometry utilities can replace them without important modifiers.
