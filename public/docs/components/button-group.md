# ButtonGroup

Use ButtonGroup for a compact connected set of mutually exclusive actions, such as Preview/Code or viewport choices. It composes the public Button primitive, gives the group an accessible name, and exposes the selected option through `aria-pressed`. Options accept unique ids, visible labels, and optional `IconComponent` values. `collapseLabels` immediately hides every icon-bearing option label at every viewport, while each button retains its full accessible name; use it only when every icon remains understandable. Install with `npx balsa-ui@latest add button-group`. Dependencies: Vue, Balsa Button, and the Balsa theme foundation. Canonical source: `src/components/ui/ButtonGroup.vue`; interactive documentation: `/docs/components/button-group`; contract: `specs/components/button-group.json`.

ButtonGroup inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.

The default `surface` variant serves ordinary grouped actions. When no `variant` is supplied, it resolves to `glass` under the nearest Glassmorphism theme and remains `surface` in Modern Flat and Brutalism; pass `surface` explicitly to retain it in Glassmorphism. Use `solid` for a prominent local mode switch, `outline` for secondary grouped choices, and `glass` for a translucent low-rim group in Glassmorphism. Each non-code variant accepts the typed `primary`, `secondary`, `accent`, or `destructive` `color`, and all support `sm`, `md`, `lg`, and `xl` sizes.

ButtonGroup defaults to the same `rounded` silhouette as Button, using `rounded-lg` rather than the broader theme control radius. In Brutalism, that default resolves to `rounded-none`; use a consumer radius class when the context calls for an override. The typed `pill` shape follows the theme-owned pill radius, so it squares off under a square shape recipe rather than staying round.

Use the typed `code` variant for compact controls in a CodeBlock header; it resolves code-surface borders, text, selected state, and interaction colors without descendant selectors or important utilities. Its radius stays compact in Glassmorphism, matching the other themes instead of inheriting the larger glass control radius. Root layout classes and styles are merged normally.

Theme depth and interaction movement apply to the connected group as a whole. Individual options do not scale, translate, or cast their own shadows, preventing decorative effects from creating scrollbars when the group already fits.

ButtonGroup retains its intrinsic width inside flex rows instead of shrinking around its options. `max-w-full` and horizontal overflow remain a fallback only when the complete group is genuinely wider than its container.
