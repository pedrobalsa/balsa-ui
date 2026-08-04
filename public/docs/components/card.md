# Card

When `padding` is omitted, `size="sm" | "md" | "lg"` selects the matching internal spacing; `rounded` accepts Tailwind-style `none` through `full` radius values.

Use Card to group related content and actions on a consistent surface. It defaults to a neutral rim so ordinary application containers share one surface language. Its `surface`, `elevated`, `muted`, `outline`, `soft`, and `glass` variants supply intentional material; use `color="primary" | "secondary" | "accent" | "destructive"` only when the Card communicates matching action or status intent. It provides visual containment without inventing semantic landmarks. Install with `npx balsa-ui@latest add card`. Canonical source: `src/components/ui/Card.vue`; interactive documentation: `/docs/components/card`; contract: `specs/components/card.json`.

Card inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override. When `rounded` is omitted, the live `--balsa-radius-surface` token owns its geometry; an explicit `rounded` prop is a deliberate local override.

For repeated application panels with a compact header, optional action, body, and metadata footer, install the public `application-card` composition. It preserves Card's theme contract instead of freezing presentation inside a site wrapper.

Use the typed `padding` values `none`, `sm`, `md`, and `lg` for internal spacing. Choose `none` before supplying fully custom padding utilities. Set `:shadow="false"` when a Card or contextual theme recipe must remain flat, including restrained documentation workbenches. Card merges consumer classes after its defaults, so ordinary layout and radius utilities work without important modifiers; consumer `style` attributes remain available for one-off layout adjustments.
