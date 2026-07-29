# Carousel

Carousel wraps the maintained Embla Vue engine with Balsa-owned typed items, semantic slide names, surface, outline, soft, and glass variants, previous/next actions, indicators, empty state, alignment, orientation, looping, and optional autoplay. Arrows can sit inside the viewport or below it; indicators can sit inside or below at the start, center, or end. Autoplay pauses while the user hovers, focuses, or leaves the document.

Use Carousel for related visual items that benefit from direct drag and snap browsing. Install with `npx balsa-ui@latest add carousel`. Canonical source: `src/components/ui/Carousel.vue`; interactive documentation: `/docs/components/carousel`; contract: `specs/components/carousel.json`.

Embla is retained as the runtime dependency because gesture velocity, snapping, loop geometry, reinitialization, and cross-input behavior are a maintained interaction engine rather than a Balsa visual recipe. Balsa remains responsible for semantic labels, controls, themes, geometry, empty state, and reduced-distraction autoplay policy.
