# Carousel

Carousel uses a Balsa-owned Vue engine for measured slide geometry, pointer dragging, velocity-aware snapping, looping, and responsive reflow. It provides typed items, semantic slide names, surface, outline, soft, and glass variants, previous/next actions, indicators, empty state, alignment, orientation, and optional autoplay. Arrows can sit inside the viewport or below it; indicators can sit inside or below at the start, center, or end. Autoplay pauses while the user hovers, focuses, drags, or leaves the document.

Use Carousel for related visual items that benefit from direct drag and snap browsing. Install with `npx balsa-ui@latest add carousel`. Canonical source: `src/components/ui/Carousel.vue`; interactive documentation: `/docs/components/carousel`; contract: `specs/components/carousel.json`.

The engine has no carousel runtime dependency. Balsa owns gesture thresholds, boundary resistance, transform snapping, loop index normalization, resize measurement, semantic labels, controls, themes, geometry, empty state, and reduced-distraction autoplay policy.
