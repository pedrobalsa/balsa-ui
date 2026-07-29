# Context Menu

Context Menu opens the shared typed menu engine at a pointer context request or a keyboard ContextMenu/Shift+F10 request on its focusable target. It supports typed semantic color and panel roundness; by default it renders in the page layer to avoid host clipping, while contained menus correct their position within the target. Disabled mode preserves the browser menu, and documented actions must also remain available through visible UI. Install with `npx balsa-ui@latest add context-menu`.

Canonical source: `src/components/ui/ContextMenu.vue`; interactive documentation: `/docs/components/context-menu`; contract: `specs/components/context-menu.json`.
