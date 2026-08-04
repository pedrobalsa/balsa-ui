# Toggle

Use Toggle for a two-state action that stays visibly pressed, such as bold formatting, a bookmark, or an independent toolbar mode. It renders a native button, exposes its state through `aria-pressed`, and inherits Space and Enter activation from the platform. Use Switch for a boolean setting and Checkbox for a delayed form choice. Install with `npx balsa-ui@latest add toggle`. Canonical source: `src/components/ui/Toggle.vue`; interactive documentation: `/docs/components/toggle`; contract: `specs/components/toggle.json`.

The default `type="button"` uses the typed `surface`, `solid`, `outline`, and `glass` variants for its released treatment. Pressed state uses the selected `primary`, `secondary`, `accent`, or `destructive` color with its paired foreground so state remains unmistakable. Sizes are `sm`, `md`, `lg`, and `xl`; `rounded` accepts the shared Tailwind-style scale from `none` through `full`.

Use `type="icon"` for a compact icon-only action: its neutral surface stays unchanged while the icon switches from its outlined form to its filled form. Set an accessible `aria-label` and choose `icon="bookmark"`, `heart`, `star`, `pin`, `bell`, or `flag`; each option provides a paired Material Design Icon. `disabled` preserves the pressed value while blocking activation.

Use `prefixIcon` or `suffixIcon` for imported Lucide components on the default button treatment and keep an explicit visible label. The component keeps the pointer cursor for enabled actions; disabled actions use the not-allowed cursor.

Toggle inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for an independent Modern Flat, Brutalism, or Glassmorphism override.

Before this migration, Balsa used the Toggle name for its boolean switch. Replace those imports and templates with Switch; the new Toggle is intentionally not API-compatible with the old form control.
