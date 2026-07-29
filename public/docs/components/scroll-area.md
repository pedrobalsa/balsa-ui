# Scroll Area

Scroll Area preserves a native browser scroll container while applying Balsa geometry, focus, and scrollbar materials. The labelled region keeps wheel, touch, pointer, keyboard, and programmatic scrolling intact.

Use Scroll Area for long content within a deliberately bounded panel or horizontal strip. Avoid unnecessary same-axis nested scrolling. Install with `npx balsa-ui@latest add scroll-area`. Canonical source: `src/components/ui/ScrollArea.vue`; interactive documentation: `/docs/components/scroll-area`; contract: `specs/components/scroll-area.json`.

The component provides vertical, horizontal, and two-axis overflow, automatic/always/hover scrollbar visibility, thin and regular widths, optional edge fades, shared `Rounded`, native scroll events, exposed `scrollTo` and `scrollBy` methods, consumer class merging, and `theme?: ThemeInput`.
