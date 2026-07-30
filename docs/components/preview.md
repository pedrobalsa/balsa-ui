# Preview

Preview renders Vue slot content inside an isolated document whose responsive CSS evaluates against a natural, preset, or exact logical viewport. Use `desktop`, `tablet`, and `mobile` for responsive maximum widths of 1600px, 768px, and 390px, or `fixed` with exact logical dimensions and optional fit scaling.

Use `aspectRatio` when a bounded preview canvas must remain fluid, such as `16 / 9` for a scaled-down desktop gallery preview. The logical `width` and `height` still determine the iframe viewport, so desktop layouts remain intact as the canvas scales.

Set `autoHeight` for complete pages and templates. Preview then measures the rendered document, removes the iframe scrollbar, and preserves the full content height. Wheel and touch input inside the iframe automatically moves the nearest `data-balsa-preview-scroll-owner` or naturally scrollable ancestor and also emits `previewScroll` for observation. `maxWidth` overrides a preset maximum when a different review width is required.

Use Preview for component demonstrations, device-size simulation, complete template review, and optional chromeless fullscreen inspection. Its compact fullscreen trigger uses a near-opaque background/foreground surface pair, thin boundary, and soft elevation instead of relying on low-contrast glass or a heavy halo over unknown preview content. Install with `npx balsa-ui@latest add preview`. The component synchronizes theme, palette, root styles, and local stylesheets into the frame and retains accessible frame and fullscreen labels. Canonical source: `src/components/ui/Preview.vue`; interactive documentation: `/docs/components/preview`; contract: `specs/components/preview.json`.
