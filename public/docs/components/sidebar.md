# Sidebar

Sidebar presents typed grouped destinations as persistent desktop navigation and composes Balsa Drawer for the modal mobile form. It supports an expanded surface, compact rail, off-canvas collapse, nested destinations, active state, icons, concise badges, header/footer slots, and a configurable Command/Ctrl shortcut.

Use Sidebar for application and workspace navigation, not router ownership or marketing-site headers. Install with `npx balsa-ui@latest add sidebar`. Canonical source: `src/components/ui/Sidebar.vue`; interactive documentation: `/docs/components/sidebar`; contract: `specs/components/sidebar.json`.

The consumer owns URLs, routing, analytics, and persistence. Rail items keep accessible labels and visible hover titles; mobile mode inherits Drawer focus entry, trap, Escape/backdrop dismissal, scroll locking, and focus restoration.
