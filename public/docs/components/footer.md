# Footer

Use Footer to close an application shell with linked brand context, a flexible responsive navigation grid, optional contact groups, named social links, and a configurable legal bar. Supply every section and item through typed props rather than coupling the primitive to a router or store. Its playground starts with a real 1366px desktop viewport scaled to the available documentation width, places Properties below the preview, and provides a visual builder for editing the description, adding or removing navigation sections, renaming sections, and managing their item names; preview links and matching Vue source are generated automatically. Install with `npx balsa-ui@latest add footer`. Dependencies: Vue, `@lucide/vue`, and the Balsa theme foundation. Canonical source: `src/components/ui/Footer.vue`; interactive documentation: `/docs/components/footer`; contract: `specs/components/footer.json`.

Footer inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override.

Footer defaults to its established high-contrast `inverse` treatment. Use `variant="surface"` when the footer should remain part of the current application surface, including dark palettes where the inverse role intentionally becomes light.

Every linked brand, section, contact, and social destination emits `navigate(item, event)` while remaining a native anchor. The item is normalized to `NavigationLink` and the second argument is the original `MouseEvent`, allowing the same router handler used by Navbar, Link, and Breadcrumb to synchronously prevent only the internal clicks it owns.
