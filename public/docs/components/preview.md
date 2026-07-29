# Preview

Preview renders Vue slot content inside an isolated document whose responsive CSS evaluates against a natural or exact logical viewport. Fixed desktop, mobile, or custom dimensions scale only to fit the available workbench, and an optional chromeless fullscreen view keeps one inset close action.

Use Preview for component demonstrations and device-size design review. Install with `npx balsa-ui@latest add preview`. Canonical source: `src/components/ui/Preview.vue`; interactive documentation: `/docs/components/preview`; contract: `specs/components/preview.json`.

The component synchronizes theme, palette, root styles, and local stylesheets into the frame; provides responsive and fixed modes, typed dimensions, maximum workbench height, fit and edge-to-edge policies, accessible titles, fullscreen labels, consumer configuration, and `theme?: ThemeInput`.
