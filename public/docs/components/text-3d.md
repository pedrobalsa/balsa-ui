# Text3D

Render short display text as extruded metallic, solid, or glass geometry. Text3D combines finite presets, independently authored reflected-light cards, lighting environments, fonts, palette-aware material color, theme-aware typography, four exclusive motion modes (`static`, `pointer`, `auto-rotate`, and `float`; `pointer` is the default), pointer drag, and PNG capture while preserving readable flat text when WebGL or a typeface is unavailable.

Install with:

```sh
npx balsa-ui@latest add text-3d
```

The registry item installs the Vue component, typed configuration and presets, the procedural environment recipes, the Three.js renderer, the typeface loader and converter, and all 76 generated runtime typeface assets. It reports `three`, `@types/three`, `fontkit`, and `@types/fontkit` as required npm dependencies; no separate font-generation step is needed after installation. `fontkit` is only imported when a scene names an arbitrary Google Fonts family, so a project that stays on the shipped families never loads it.

`npx balsa-ui@latest text-3d add <name>` installs that same registry item if it is missing, then writes a typed `src/text-3d/<name>.ts` scene module. 3D Text Studio's Use command is that one step — a first-time project does not need a separate `balsa add text-3d`.

## Playground

```vue
<script setup lang="ts">
import Text3D from "@/components/ui/Text3D.vue";
</script>

<template>
  <section class="h-96 overflow-hidden rounded-balsa-surface bg-balsa-background">
    <Text3D
      text="Balsa"
      preset="liquid-chrome"
      color-mode="palette"
      font-mode="theme"
    />
  </section>
</template>
```

The component fills its containing block (`h-full w-full`), so that container must have a definite height. A wrapping `div` with no height computes the child's percentage height to auto, which is the classic first-run blank canvas for a WebGL component ([CSS 2.1 §10.5](https://www.w3.org/TR/CSS22/visudet.html#the-height-property)). `h-96`, `h-[min(70vh,36rem)]`, `size-40`, or `absolute inset-0` on a sized ancestor all work; `min-h-96` also works because the minimum is definite. The active font follows the inherited Balsa title font by default, and its body, highlight, rim, and base environment follow the active palette. Set `font-mode="custom"` with `font`, or `color-mode="custom"` with exactly three `colors`, to override either relationship. Reflected-light cards remain independent of that three-color material tuple.

## Placement

A hero wordmark owns a block with an explicit viewport-relative height. Pointer mode is the default for new scenes and is the interactive case worth advertising:

```vue
<script setup lang="ts">
import Text3D from "@/components/ui/Text3D.vue";
import { heroText } from "@/text-3d/hero-text";
</script>

<template>
  <section class="relative h-[min(70vh,36rem)] w-full overflow-hidden">
    <Text3D :config="heroText" pose-mode="pointer" />
  </section>
</template>
```

An inline accent sits inside a heading as a fixed-size replaced box. The span, not the heading, is the containing block:

```vue
<script setup lang="ts">
import Text3D from "@/components/ui/Text3D.vue";
</script>

<template>
  <h1 class="flex flex-wrap items-center gap-balsa-sm text-4xl font-medium">
    Launch
    <span class="inline-block h-16 w-40 align-middle">
      <Text3D text="now" preset="liquid-chrome" pose-mode="pointer" />
    </span>
    the next release.
  </h1>
</template>
```

A fixed-size block is the same contract with literal dimensions, for example `h-96 w-full` or `size-80`. A full-bleed background layer is `absolute inset-0 -z-10` inside a `relative min-h-svh` ancestor, so the scene paints the page without taking layout height from the content above it. No extra layout props are required; the existing CSS containing-block rules are the API.

## Presets and variants

The five presets are `liquid-chrome`, `chrome-balloon`, `polished-chrome`, `brushed-steel`, and `frosted-pane`. Preset values apply first, `config` applies second, `overrides` applies third, and individual props have final precedence.

Liquid Chrome and Chrome Balloon both disable the native bevel and keep the authored extrusion at `0.01 × size`, but their custom profiles are deliberately different. Balloon's projected caps return to the original planes and meet across the thin native wall, preserving the pinched foil seam. Liquid evaluates one C1 height field on a shared 2D domain so the two halves meet at a vertical-tangent silhouette: each stroke is a self-similar ellipse of local half-width W, `h = A(W) √(t(2 − t))` with `t = d/W` and `A = min(W, 0.2 × size)`, so a thick stroke rolls over in the same proportion as a thin one. Ordinary display weights stay full semicircles; only a counter-free blob, whose medial distance approaches half the glyph, is flattened into an ellipse so it does not inflate to a hemisphere. `LIQUID_RIM_RADIUS_SCALE` (`0.05 × size`) floors the rim tessellation step and the outline-smoothing window; it is not a global rollover radius. The recorded benchmark and proportions live in [the liquid profile note](../text-3d-liquid-profiles.md).

Materials are `metallic`, `solid`, and `glass`. Environments are `studio`, `rim`, `soft`, `dramatic`, and `neon`. Alignment is `left`, `center`, or `right`; render quality is `auto`, `low`, `medium`, or `high`.

`text3DMaterialDefaults` and `text3DEnvironmentDefaults` are the two recipes an editor applies on a change of kind, through `applyText3DMaterialDefaults` and `applyText3DEnvironmentDefaults`. The split is deliberate: a material owns the physical response of the surface, and an environment owns the whole lighting layout — key strength, ambient fill, angle, surround rotation and contrast, and how many light cards stand where. It does not own their colors, so relighting a scene cycles the palette colors the scene already owns over the new layout. Neither is applied by `normalize`, because rewriting an authored config on every parse would make a saved scene unstable. The finite recipes reuse the proven Studio preset layouts; their key/rim split follows Blender's documented studio model, and their width/intensity controls follow Three.js rectangular area lights, which model windows, strip lights, and softboxes ([Blender Workbench lighting](https://docs.blender.org/manual/en/latest/render/workbench/lighting.html), [Three.js RectAreaLight](https://threejs.org/docs/pages/RectAreaLight.html)).

The presets deliberately span different light fields: Liquid Chrome combines pearl, cyan, blush, and broad white across its metal and reflected-light cards, paired with the named Holographic Flow backdrop; Chrome Balloon uses a cooler surround of white, pale steel, cyan, and blush over the same studio layout; Polished Chrome balances four cooler cards at a softer contrast; Brushed Steel balances narrow cool streaks with a broad front fill; Frosted Pane uses one broad softbox.

Presets default to their curated custom material colors so chrome remains silver and glass remains legible regardless of the surrounding primary token. Set `color-mode="palette"` when a composition should deliberately inherit primary, accent, and secondary instead.

The bundled font set is Space Grotesk, Inter, Noto Sans, Roboto, Open Sans, Source Sans 3, Lato, Montserrat, Poppins, Raleway, Oswald, Playfair Display, and Rubik Spray Paint. `font-weight` accepts `300`, `400`, `500`, `600`, `700`, `800`, and `900`; a bundled family that does not publish a static face at the requested weight renders its nearest shipped weight rather than fetching an asset that does not exist. Rubik Spray Paint publishes one 400 face, so every requested weight maps to that generated outline. Liquid Chrome and Chrome Balloon both pin this family by default rather than following the surrounding title font.

In 3D Text Studio the Font menu is a curated quick picker of the shipped families. Weight, alignment, size, letter spacing, and line height live in the Type toolbar in the sidebar; Reset typography restores only those fields from the active preset and leaves material, environment, palette, pose, and background untouched. Bevel recipes live on the Extrusion row, with size, thickness, and segments behind Advanced settings.

### Arbitrary Google Fonts families

`fontFamily` names any family published on [Google Fonts](https://fonts.google.com) and is drawn as real extruded outlines, not as a CSS fallback. It applies only under `font-mode="custom"`, outranks `font` while it is set, and returns the scene to `font` when cleared. 3D Text Studio's Font menu stays the curated shipped collection; author the family on the config or the `font-family` prop. Picking a shipped face from the Font menu, or Reset typography, clears a typed family so the visible pick takes effect.

```vue
<Text3D text="Balsa" font-mode="custom" font-family="Bungee Shade" :font-weight="700" />
```

Resolution is a network operation at render time. The component asks the key-free [CSS2 endpoint](https://developers.google.com/fonts/docs/css2) for the requested numeric weight, subset to the characters the scene actually sets, downloads the returned font file, and converts its glyph outlines into a typeface on the same terms the shipped assets were generated on. Families are cached by name, weight, and character coverage, so editing a wordmark within the characters already downloaded costs no second request. A family that does not publish the requested weight resolves to its own drawn cut, matching the nearest-weight behaviour of the shipped single-face families.

Anything that name cannot be resolved through — an unpublished family, a blocked or offline request, a browser that refuses the cross-origin download — leaves the scene rendering the shipped typeface named by `font` rather than losing the geometry, and is never cached as that family's answer. The shipped families continue to load from installed JSON and remain fully available offline.

```vue
<Text3D
  text="Clarity"
  preset="frosted-pane"
  material="glass"
  environment="soft"
  font-mode="custom"
  font="playfair-display"
  :font-weight="700"
/>
```

## Material color and reflected light

In palette mode, primary is the body, accent is the highlight, and secondary is the rim. Background and surface tint the base reflection environment so metal and glass belong to the surrounding design system. In theme font mode, Text3D reads the inherited title-family token and maps it to the supported generated typeface, falling back to Space Grotesk when the family is outside that set.

Custom color mode accepts exactly three six-digit colors in body, highlight, and rim order. That tuple remains material color, not an open-ended mesh gradient. Keep palette mode for semantic examples; reserve custom mode for intentionally authored artwork.

`reflections` independently describes zero to four light cards in the environment. Each card has a six-digit `color`, normalized longitude `position` from `0` to `1`, angular half-`width` from `0.02` to `0.5`, and radiance `intensity` from `0` to `4`. The selected named mode still owns elevation, distance, aspect, roll, the remaining cards, and its broad direct-light layout, so authored values do not collapse the five modes into one rig. `environmentRotation` turns the reflected environment and analytic rig together from `-180` to `180` degrees; `lightAngle` adds its orbit without regenerating the PMREM. Both remain fixed in world space while the text rotates. `environmentContrast` ranges from `0` for a smooth field to `2` for strongly separated bands. More colors here mean more light sources for the material to reflect; they never add colors to the mesh itself.

```ts
const chromeLighting = {
  reflections: [
    { color: "#FFD9A0", position: 0.18, width: 0.05, intensity: 3.2 },
    { color: "#8FD4FF", position: 0.42, width: 0.07, intensity: 2.4 },
    { color: "#FF7AC8", position: 0.68, width: 0.04, intensity: 2 },
  ],
  environmentRotation: 0,
  environmentContrast: 0.85,
} as const;
```

When `background` is true, `backdrop: "color"` paints `backgroundColor`; `backdrop: "gradient"` composes a real `GradientBackground` behind a canvas that clears to transparent, so the field reproduces identically outside the studio and is composited into `capturePng`. Empty `gradientPreset` builds that field from the scene's own colors (reflection cards first, then material roles, capped at six stops) with the tuned blobs room; a named `gradientPreset` mounts that GradientBackground preset instead. Liquid Chrome is the default Text3D preset and authors `holographic-flow` for this field. Unknown names normalize away rather than reaching the component. `backdrop: "environment"` places a bounded, smooth procedural color field behind the text so transmissive glass has detailed scene color to refract. It does not expose the filtered PMREM as a literal skybox. With `background` false the canvas remains transparent: reflections still work, but WebGL cannot refract DOM content behind the canvas.

All five presets ship with `background: true`. Liquid Chrome, Chrome Balloon, Polished Chrome, and Frosted Pane use `backdrop: "gradient"`; Brushed Steel uses `backdrop: "color"`. The studio always paints one of the three styles.

The Studio's Color stops strip follows Gradient Studio's two-to-six-stop interaction. The first three visible stops map to body, highlight, and rim; with only two visible stops, schema-one normalization repeats the second for rim so the public tuple remains exactly three values. Stops four through six are a reflection-color palette cycled across the current Environment cards. Adding, removing, or editing these stops therefore recolors the room without changing card count, position, width, or intensity; those layout controls live only under Environment > Advanced settings.

The defaults follow Three.js's physical-material model: non-metals use `metalness: 0`, metals use `1`, and lower roughness preserves harder reflections; clearcoat is a separate translucent lobe and is therefore restrained on chrome ([Three.js MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html), [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)). Bevel size and thickness remain explicit `TextGeometry` dimensions, with the public `bevelSize` cap narrowed to `0.08` to keep display-glyph counters safe while the raised defaults make the edge readable ([Three.js TextGeometry](https://threejs.org/docs/pages/TextGeometry.html)).

## Motion, interaction, and fallbacks

`rotationX` / `rotationY` / `rotationZ` are the authored base pose, and `zoom` is a camera-framing multiplier whose default `1` is the same fit a scene used before the field existed. Changing `zoom` dollies the perspective camera; it does not change `size`, so it never rebuilds glyph geometry. `poseMode` selects one independent motion offset: `static` contributes no motion, `pointer` follows the cursor, `auto-rotate` contributes accumulated spin, and `float` contributes slow out-of-phase position and tilt waves. New scenes default to `pointer`; presets can still deliberately author another mode. An `interactive` drag edits the base pose in every mode. Pointer release normalizes that base through the public rotation ranges, emits `update:pose` once, and never writes the active cursor tilt, spin, or drift into the configuration, so the visible motion continues without a handover jump or repeated-drag ratchet.

Scroll-wheel zoom is gated the same way as pose drag by `interactive`. The embed default is `wheelZoom="modifier"`: Ctrl/Cmd + wheel zooms, a plain wheel scrolls the page — the convention maps and this repository's CompositionMatrix already use, so a hero wordmark in a scrolling document cannot trap the reader. 3D Text Studio sets `wheelZoom="always"` because its preview fills the viewport and the page does not scroll. A wheel burst updates the camera immediately and commits the settled `zoom` once through the same `update:pose` path as a released drag, not on every event. At the 0.25 / 4 range limits a plain `always` wheel is left to the page.

Follow cursor uses a maximum 4° X pitch from vertical position, 6° Y yaw from horizontal position, and a deliberately quieter 1.5° Z bank from horizontal position. All three use the same `damping` response and ease back to the base pose on leave. This is substantially more restrained than the 15° default maximum documented by [Vanilla Tilt](https://www.npmjs.com/package/vanilla-tilt), while the quarter-scale roll keeps the object-like lean subordinate to pitch and yaw. `damping` also smooths `float`; higher values respond more softly. The deprecated `autoRotate` boolean remains a synchronized compatibility mirror, not a second motion state.

The `paused` lifecycle prop, an offscreen or hidden document, and reduced-motion preference stop procedural time. Reduced motion pins `pointer`, `auto-rotate`, and `float` to the configured static pose. None of these states changes the readable DOM text.

While a typeface loads, after a font request fails, when WebGL cannot initialize, or after context loss, the component retains a selectable flat-text treatment. In forced-colors mode the canvas is hidden and the fallback uses the system text color.

## Versioned configuration

`BalsaText3DConfig` remains on schema version one because the reflection, `fontFamily`, `poseMode`, `gradientPreset`, and `zoom` fields are additive; a payload saved without `fontFamily` resolves to `""`, which is the shipped-typeface behaviour it was saved with. A schema-one scene without `poseMode` maps its legacy `autoRotate: true` to `"auto-rotate"` and every other value to `"static"`; the briefly shipped `poseMode: "pose"` value also normalizes to `"static"`. Normalized output keeps `autoRotate` as a deprecated mirror derived from the selected mode, which preserves older readers without allowing two motion settings to disagree. A `fontFamily` that is not a usable family name — a URL, an injected query parameter, anything over 64 characters — normalizes to `""` rather than reaching the loader. A payload without `gradientPreset`, or with a name that is not a GradientBackground preset, normalizes to `""` and keeps the derived blobs room. A payload saved without `zoom` normalizes to `1` and frames the camera exactly as it did before the field existed. Use `normalizeText3DConfig`, `parseText3DConfig`, and `serializeText3DConfig` when configurations cross a trust boundary. A schema-one payload saved before these fields existed remains valid and resolves to `reflections: []`, `environmentRotation: 0`, `environmentContrast: 0.35`, `backdrop: "color"`, `gradientPreset: ""`, and `zoom: 1`; newer or otherwise unsupported schema versions are rejected. Text is limited to four lines and 64 characters per line; numeric fields are clamped to their published ranges, reflection lists are truncated to four entries, and unsupported enum values return to safe defaults.

```vue
<script setup lang="ts">
import Text3D from "@/components/ui/Text3D.vue";
import type { Text3DConfigInput } from "@/components/ui/text-3d";

const title: Text3DConfigInput = {
  text: "Balsa",
  material: "metallic",
  environment: "studio",
  colorMode: "palette",
  fontMode: "theme",
  interactive: true,
  poseMode: "pointer",
};
</script>

<template>
  <div class="h-96 bg-balsa-background">
    <Text3D :config="title" />
  </div>
</template>
```

## Capture

The exposed `capturePng({ width, height, opaque, layer })` method produces a PNG from the live renderer or the readable fallback. Each dimension is clamped to 320–4096 pixels. `layer` selects which picture to encode: `composite` (default) is the on-screen stack, `text` is the glyphs with alpha and no backdrop, and `gradient` is the backdrop field alone. Capture uses the same camera framing as the preview, including the authored `zoom`. In 3D Text Studio, Export PNG offers those three modes at the selected size; the downloaded file name includes `-text` or `-gradient` when a layer is exported separately. `renderStill()` draws the current frame, and `resetPose()` clears transient motion and returns to the configured rotation and zoom. In 3D Text Studio, the Reset pose action first writes the active preset's authored rotations and zoom back through the editor config, so the Pose sliders and rendered scene return together.

## Accessibility

Keep Text3D to short display copy. The component retains the text in semantic DOM, marks the canvas and visual fallback as hidden from assistive technology, makes drag and wheel zoom optional, and stops motion for reduced-motion users. Wheel zoom does not trap page scroll: an embedded canvas ignores a plain wheel unless `wheelZoom="always"`. Do not use rotation, zoom, or material alone to communicate meaning.

## API reference

- `preset`: one of the five named presets.
- `config`: serializable partial Text3D configuration.
- `overrides`: partial direct override object, applied after config.
- `text`, `fontMode`, `font`, `fontFamily`, `fontWeight`, `size`, `letterSpacing`, `lineHeight`, `alignment`: content and layout.
- `material`, `colorMode`, `colors`, `metalness`, `roughness`, `clearcoat`, `clearcoatRoughness`, `transmission`, `ior`, `thickness`, `glow`: surface controls.
- `depth`, `bevelEnabled`, `bevelSize`, `bevelThickness`, `bevelSegments`, `curveSegments`: extrusion controls.
- `environment`, `lightIntensity`, `ambientIntensity`, `lightAngle`, `reflectionStrength`, `reflections`, `environmentRotation`, `environmentContrast`, `shadow`: lighting controls.
- `rotationX`, `rotationY`, `rotationZ`, `zoom`, `interactive`, `poseMode`, `autoRotateSpeed`, `damping`: pose, camera framing, and motion. `zoom` is a 0.25–4 camera dolly (`1` is the default fit) and is not `size`. `autoRotate` is the deprecated schema-one compatibility mirror.
- `wheelZoom`: `"modifier"` (default) requires Ctrl/Cmd + wheel so the page can scroll; `"always"` zooms on a plain wheel (3D Text Studio).
- `background`, `backgroundColor`, `backdrop`, `gradientPreset`, `quality`, `paused`: canvas and lifecycle controls. Empty `gradientPreset` keeps the derived gradient room; a named GradientBackground preset replaces it.
- `capturePng`, `renderStill`, `resetPose`: exposed methods. `capturePng` accepts `layer: "composite" | "text" | "gradient"` and honours `zoom`.

Canonical source: `src/components/ui/Text3D.vue`, `text-3d.ts`, `text-3d-presets.json`, `text-3d-environments.ts`, `text-3d-liquid-geometry.ts`, `text-3d-renderer.ts`, `text-3d-fonts.ts`, and `text-3d-typeface.ts`.
