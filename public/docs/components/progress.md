# Progress

Progress communicates measurable task completion with native progressbar semantics. Pass a finite numeric `value` and positive `max` for determinate progress or `null` for an indeterminate process. Values are clamped safely; complete, loading, and indeterminate states are exposed through stable data attributes.

A visible label is required. `showValue` controls the adjacent visual value without changing the accessible value text, and `formatValue` can describe bytes, steps, or time instead of a percentage. Install with `npx balsa-ui@latest add progress`. Canonical source: `src/components/ui/Progress.vue`; interactive documentation: `/docs/components/progress`; contract: `specs/components/progress.json`.

The component supports solid, soft, and striped variants, every `SemanticColor`, `sm`, `md`, and `lg` sizes, the shared `Rounded` scale, reduced-motion behavior, and `theme?: ThemeInput`.
