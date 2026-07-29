# Navbar

Use Navbar for responsive application navigation. It receives typed logo and navigation data, provides compact item-anchored desktop menus and a mobile accordion, supports `surface`, `outline`, `soft`, and `glass` materials plus `primary`, `secondary`, `accent`, and `destructive` color roles, and offers `bar`, `floating`, and `minimal` layouts. Each desktop submenu shares the Navbar's selected material and background color with a tighter compact radius and no outer shadow; use a dedicated navigation page instead of supplying a large unstructured inventory. Its default `reveal` behavior hides on downward scrolling and returns on upward scrolling; choose `static` or `fixed` when required. The floating slab shares the site container’s width and content alignment, including when it is fixed or revealing. Glassmorphism automatically resolves to that inset floating glass treatment unless `type` or `variant` is explicit. Use the `actions` slot for desktop primary actions. Install with `npx balsa-ui@latest add navbar`. Canonical source: `src/components/ui/Navbar.vue`; interactive documentation: `/docs/components/navbar`; contract: `specs/components/navbar.json`.

For a route with a wider page container, pass `floatingLayout="container"` and that container’s CSS maximum width through `floatingMaxWidth`. The slab then follows the route width exactly, while its contents use the same 20px, 32px, and 48px insets as the shared site container. The default `inset` layout remains appropriate for a visually detached slab.

For a full-width `bar` or `minimal` Navbar, pass the matching route maximum through `contentMaxWidth`. Its background remains full width while the logo, navigation, and actions align with the route content edges.

Desktop navigation items align to the right by default. Set `itemsAlignment="left"` or `itemsAlignment="center"` when the surrounding shell calls for a different relationship between the brand, destinations, and actions.

Navbar inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.
