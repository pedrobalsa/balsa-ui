# Slider

Slider selects one bounded number by default or a two-value range when its model is an ordered tuple. Its native range inputs own keyboard, pointer, touch, required, disabled, name, and form behavior while Balsa renders one semantic track, fill, and visible thumb layer.

Range thumbs cannot cross, may reserve a typed minimum number of steps between them, and remain independently draggable. Horizontal and vertical orientations, three sizes, formatted output, configurable geometry, and optional hint text use the same numeric model. Set `showLabel="false"` when surrounding context already supplies the visible name, such as a media transport; the required label remains explicitly associated and visually hidden for assistive technology. This follows [WAI guidance for visually hidden form labels](https://www.w3.org/WAI/tutorials/forms/labels/#hiding-label-text). In Glassmorphism, thumbs use an opaque semantic fill so the track does not show through. Install with `npx balsa-ui@latest add slider`.

Canonical source: `src/components/ui/Slider.vue`; interactive documentation: `/docs/components/slider`; contract: `specs/components/slider.json`.
