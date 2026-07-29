# Card

When `padding` is omitted, `size="sm" | "md" | "lg"` selects the matching internal spacing; `rounded` accepts Tailwind-style `none` through `full` radius values.

Use Card to group related content and actions on a consistent surface. Its `surface`, `elevated`, `muted`, `outline`, `soft`, and `glass` variants supply intentional semantic material; use the typed `color` prop (`primary`, `secondary`, `accent`, or `destructive`) to select its rim and soft/glass material. It provides visual containment without inventing semantic landmarks. Install with `npx balsa-ui@latest add card`. Canonical source: `src/components/ui/Card.vue`; interactive documentation: `/docs/components/card`; contract: `specs/components/card.json`.

Card inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.

Use the typed `padding` values `none`, `sm`, `md`, and `lg` for internal spacing. Choose `none` before supplying fully custom padding utilities. Set `:shadow="false"` when a Card or contextual theme recipe must remain flat, including restrained documentation workbenches. Card merges consumer classes after its defaults, so ordinary layout and radius utilities work without important modifiers; consumer `style` attributes remain available for one-off layout adjustments.
