# Modal

Modal supports `surface`, `solid`, `outline`, `soft`, and `glass` panel materials; `primary`, `secondary`, `accent`, and `destructive` semantic colors; `sm`, `md`, `lg`, and `full` dialog sizes; and Tailwind-style `rounded` values from `none` through `full`. `solid` uses the selected role's paired contrast-safe foreground, `soft` is a flat low-emphasis tint, and `glass` is the only blurred panel material. Sheets remove their bottom border so they meet the viewport edge cleanly.

Use Modal for a short focused decision or task, not long primary content. Presentations are centered `dialog`, bottom `sheet`, and chromeless `fullscreen`; slots provide eyebrow, body, and footer. The component provides dialog naming, a keyboard focus trap, Escape/backdrop dismissal, background-scroll locking that preserves wheel and touch scrolling inside the dialog, and trigger-focus restoration. Install with `npx balsa-ui@latest add modal`. Dependencies: Vue, `@lucide/vue`, and the Balsa theme foundation. Canonical source: `src/components/ui/Modal.vue`; interactive documentation: `/docs/components/modal`; contract: `specs/components/modal.json`.

Modal inherits the nearest `data-theme` and accepts `theme?: ThemeInput`; teleported backdrops and panels preserve that resolved theme.
