# GradientBackground

Generate deterministic flowing fabric, mist, luminous ribbons, smoke, monochrome terrain, or soft iridescent fields directly in a Vue layout. The component uses a Balsa-owned single-pass shader on Three.js WebGL infrastructure; no source image or video is required.

Install with:

```sh
npx balsa-ui@latest add gradient-background
```

The registry item installs the component, versioned typed configuration helpers, preset metadata, renderer, and shader. It reports `three` and `@types/three` as required npm dependencies.

## Usage

```vue
<script setup lang="ts">
import GradientBackground from "@/components/ui/GradientBackground.vue";
</script>

<template>
  <section class="relative isolate min-h-screen overflow-hidden">
    <GradientBackground preset="obsidian-fold" :seed="1847" />
    <main class="relative z-10">Your content</main>
  </section>
</template>
```

The component is absolutely positioned and does not create layout height. Give its containing block a position and dimensions. The canvas is `aria-hidden`, pointer-transparent, and decorative.

## Presets

- `obsidian-fold`: deep monochrome fabric and broad highlights.
- `silver-dunes`: bright grainy terrain with misty transitions.
- `cloud-dancer`: high-key white, cool gray, and soft silver folds for light surfaces.
- `smoke-field`: faster, large-scale diffuse forms using the Silver palette.
- `liquid-metal`: high-contrast black chrome with hard silver reflections and a restrained warm-steel undertone.
- `iridescent-flow`: soft lavender, pink, mint, and blue liquid ribbons.
- `holographic-flow`: high-key pearl, cyan, periwinkle, lilac, blush, and champagne folds inspired by holographic foil.
- `solar-bloom`: warm radial bloom with concentric ember ripples.
- `mesh-drift`: soft drifting blue mesh gradient.
- `terminal-rain`: ribbon field redrawn as green ASCII glyphs.
- `newsprint`: contour bands under an inverted 45-degree halftone screen.
- `plotter`: blob field redrawn as flowing plotter lines.
- `aurora-veil`: teal, emerald, and violet curtains over a deep night ground.
- `terracotta-dune`: warm clay and sand strata with a bleached horizon.
- `neon-drift`: a magenta and cyan conic sweep quantized by ordered dithering.

Every preset defines every renderer value and has a stable seed. Preset defaults are applied first, `config` overrides them second, and individual component props have final precedence.

`obsidian-fold` is the default identity: it supplies the geometry whenever no preset is named, including in palette mode, where only its colors are replaced by the inherited roles. Every preset is authored artwork in `custom` mode, and naming one keeps its stops unless you set `color-mode` explicitly.

## Pattern generators

`pattern` selects which generator turns the shared warped domain into the field. The domain warp, scale, direction and octave counts feed all six identically, so only the final shaping differs.

- `ribbon` (default): the original silk and fold geometry. Every configuration written before patterns existed renders exactly as it did.
- `radial`: distance from a movable center. A clean bloom at low `wave`, concentric ripples as it rises.
- `conic`: angle around a center with a radius-dependent twist, reading as a chrome sweep. The arm count is rounded to an integer, because a fractional one leaves a seam where the angle wraps.
- `blobs`: drifting gaussians merged into a soft mesh gradient. Anchors come from the seed.
- `contour`: the terrain sliced into topographic bands, with `softness` setting line width.
- `cellular`: Worley facets. The most expensive of the six; keep `patternComplexity` low on constrained hardware.

`patternDensity` is the repeat count in each generator's own terms -- ribbon count, ring count, arm count, band count -- and `patternComplexity` sizes `blobs` and `cellular` instead. Because those numbers mean different things per generator, switching pattern in Background Studio brings that pattern's own starting values rather than carrying over numbers tuned for the last one.

```vue
<GradientBackground pattern="radial" :pattern-density="1.4" :wave="0.6" />
<GradientBackground pattern="blobs" :pattern-complexity="5" />
```

## Effects

`effect` redraws the finished gradient as marks: `ascii`, `halftone`, `dots`, `lines`, `dither`, or `crosshatch`.

While `effect` is `none` the gradient renders straight to the canvas exactly as before. Choosing one allocates a render target and adds a second full-screen pass that reads the first as a texture, so nothing pays for the machinery until it is used.

Cells are measured in **CSS pixels**, not device pixels. That keeps mark density identical across device pixel ratios and, more visibly, keeps a 1920px exported PNG showing the density its preview showed rather than the density its own pixel count would imply.

ASCII builds its glyph atlas at runtime from `effect-characters` and orders the columns by measured ink coverage, so the mapping from luminance to glyph rises evenly however the set was typed. Where no canvas is available the effect degrades to a dot mark rather than rendering black.

The atlas fits the heaviest glyph in the set to the cell and lets the cell aspect follow from that ink box, so glyphs sit shoulder to shoulder rather than floating with the field showing through the gaps. Measuring the whole set against one shared box, rather than normalizing each glyph, is what keeps a period light and an at-sign heavy. ASCII also draws on a clean ground: a glyph carries its tone by which character is chosen, so washing the cell with the field underneath would render the type decorative and the boxes load-bearing.

Grain is applied in whichever pass runs last. A cell effect reads the field once per cell, so grain added upstream would be sampled at a single point and smeared flat across the cell; moving it into the effect pass keeps it per pixel. Raise `grain` with an effect selected -- it now survives, and it reaches 0.5.

`grainSize` is measured in CSS pixels, like the effect cell, so grain is the same size on a 1x and a 2x display and an exported PNG carries the grain its preview showed. Grain also has its own hash, separate from the one the field is built on: the field's ends on a product of two fractions, which is invisible once smoothed into fBM but falls along visible hyperbolae when read per pixel -- that is what makes weak grain look like a tiled overlay rather than film.

In `duotone` and `ink` color modes the effect's own pair is what content ends up sitting on, so `effectInk` and `effectPaper` receive the same contrast repair the gradient stops get.

```vue
<GradientBackground effect="ascii" effect-characters=" .:-=+*#%@" :effect-scale="11" />
<GradientBackground effect="halftone" :effect-angle="45" effect-color-mode="duotone" effect-invert />
<GradientBackground effect="dither" :effect-levels="3" />
```

## Versioned configuration

`BalsaBackgroundConfig` uses `schemaVersion: 3`, a finite preset identity, a deterministic integer seed, a custom or palette color mode, two to six colors, a pattern generator, an optional effect, visual parameters, and quality. Runtime resources and Studio UI state never appear in the JSON.

Older files remain accepted. Schema-one files migrate their former structural `noiseOctaves` and `noiseFrequency` values to `fieldOctaves` and `fieldFrequency`, taking new visible-noise values from the selected preset. Schema-two files carry `ribbonDensity` straight across to `patternDensity` -- the same quantity under a name that also fits rings, arms, and bands -- and land on `pattern: "ribbon"` with `effect: "none"`, which is what they described.

Use `parseGradientBackgroundConfig`, `normalizeGradientBackgroundConfig`, and `serializeGradientBackgroundConfig` when configurations cross a trust boundary. Unknown fields are ignored during normalization; unsupported schema versions, unknown presets, malformed colors, and invalid stop counts are rejected during parsing.

Create an editable project configuration from a preset, the Studio's inline handoff, or saved JSON:

```sh
npx balsa-ui@latest background create hero --preset obsidian-fold
npx balsa-ui@latest background create hero --config STUDIO_PAYLOAD
npx balsa-ui@latest background create hero --from ./balsa-background.json
```

The Studio generates the complete `--config` command with a shell-safe inline payload, so importing the exact live configuration requires no download. All forms support `--cwd`. Differing existing files are refused unless the explicit reviewed `--force` workflow is used.

## Palette-aware color

Palette color is the default inside a palette. When neither `color-mode` nor a preset is given and the boundary inherits Balsa palette variables, the background adopts that palette and restyles with the rest of the interface. Naming a preset selects that preset's authored colors, and an explicit `color-mode` always wins:

```vue
<GradientBackground />                            <!-- palette, when one is inherited -->
<GradientBackground preset="iridescent-flow" />   <!-- the preset's authored stops -->
<GradientBackground color-mode="custom" :colors="[...]" />
<GradientBackground color-mode="palette" />       <!-- force palette, even with a preset -->
```

The component reads inherited semantic CSS variables from its own boundary and reacts to `data-palette`, class, and inline token changes. It does not import a site palette or theme store.

Inherited stops are kept readable. Palette roles are generated to contrast with `background` rather than with each other, so `primary` often lands on or near `foreground` — in the stock dark palette they are the same color, which would hide any text sitting over that stop. Each inherited stop is checked against `--balsa-color-foreground` and, if it falls below 4.5:1 (WCAG AA for body text), mixed toward whichever of black or white reaches the floor first, preserving as much of the authored hue as the threshold allows. Stops that already pass are untouched, and a color the component cannot parse is passed through unchanged.

## Readable content over authored colors

Presets and explicit `colors` are authored designs, so they are never altered on their own. A dark preset under light-scheme body text is the common mismatch: `obsidian-fold` opens on `#050506`, which near-black text disappears into. Opt in when you want the same repair applied to authored stops:

```vue
<GradientBackground />                              <!-- authored stops, untouched -->
<GradientBackground content-contrast />             <!-- repaired vs inherited text color -->
<GradientBackground content-color="#18181B" />      <!-- repaired vs an exact color -->
```

`content-contrast` reads the text color the gradient's own box inherits, which is the color sibling content will normally use. Pass `content-color` when that guess is wrong — when the overlay sets its own color, or when the background renders before the content it must stay readable behind. Either one also overrides the palette text roles in `palette` mode.

## Scrim

Stop repair fixes the colors handed to the shader, but `contrast`, `brightness`, and grain then reshape them, so a stop that cleared the floor can still land under it on screen. When content sits straight on the field with no surface of its own — a hero of bare text and links — pull the whole field toward the palette background:

```vue
<GradientBackground scrim />              <!-- 0.65 -->
<GradientBackground :scrim="0.1" />       <!-- explicit opacity, clamped to 0..1 -->
<GradientBackground scrim scrim-color="#0B0D10" />
```

How much scrim a field needs depends on the design sitting on it, not on the background, so the amount stays a caller decision. In practice the two schemes want very different values: a dark palette draws near-white text over a mostly near-black field and already has the headroom, so it can keep almost all of the gradient, while a light palette puts saturated mid-tone accents under near-black text and needs most of the help. This site drives it from the active palette:

```ts
const scrim = computed(() => palette.activePaletteBase.value === "dark" ? 0.1 : 0.65);
```

The scrim defaults to `--color-balsa-background`, the color content is already designed to be legible against. It is a composition control rather than part of the background's identity, so it is not written into `BalsaBackgroundConfig` and does not appear in Studio exports.

## Performance

- Device pixel ratio is capped at 1.5; lower quality modes reduce it further.
- Automatic quality selects a low 24 FPS profile for small viewports and a 30 FPS medium profile otherwise.
- Quality changes resolution and frame rate without silently reducing configured field or noise layers.
- Rendering pauses when explicitly paused, offscreen, or hidden with the document.
- Elapsed time excludes paused periods, so resuming does not jump.
- Reduced-motion users receive a static rendered frame.
- Uniform objects and color allocations are reused as configuration changes.
- Full-range configuration seeds are deterministically mapped into a shader-safe range before hashing, avoiding floating-point precision collapse and flat fields.
- Geometry, material, render lists, renderer, observers, listeners, and animation frames are disposed on unmount.
- A static CSS gradient remains visible if WebGL initialization fails or context is lost.

Prefer one large shared background over several simultaneous full-page instances. Use `quality="low"` for constrained embedded previews or known low-power contexts.

## Accessibility

The canvas is decorative and exposes no information. Keep all content and controls in normal semantic DOM above it. Protect text with an intentional Balsa surface, verify contrast against every preset, and avoid making animation necessary to understand state. Forced-colors mode suppresses the canvas in favor of the system Canvas color.

## Gradient Studio

Open `/tools/gradient-studio` on the official site: a rounded live preview on the left, the editor beside it. Entering the Studio selects Glassmorphism, so a generated field is judged behind translucent surfaces from the first frame. Preview-side controls pause motion and reveal a Storefront, Dashboard, or Editorial simulation; choosing the active layout again hides it. Every simulation uses explicit placeholder or lorem-ipsum copy so it cannot be mistaken for real content.

The editor opens on a grid of rendered preset miniatures rather than a list of names, since a preset is an artefact whose whole point is how it looks. Names appear on hover and on keyboard focus, and are always available to assistive technology. Below it the selected stops form one directly editable segmented color-picker strip, holding a two-stop minimum.

Generation & form and Adjustments collapse into property rows. A row names its current value -- Calm, Balanced, Film -- and its menu offers the rest, so the Studio is usable without meeting a raw number; Advanced settings opens an anchored panel with that control's sliders, and Reset returns them to the selected preset. Pattern is the exception that does not merely merge values: switching generator brings that pattern's own starting values.

There is no render quality or seed input. Quality stays automatic, and Randomize -- which varies the pattern the configuration is currently drawing -- is how a composition is rerolled. Save carries the exact configuration out as a CLI command, typed configuration and Vue usage, an agent prompt, or a still PNG.

Field layers and scale configure the fBM that constructs wave geometry. Noise amount, layers, and scale configure a separate stable luminance texture after the ribbon field is resolved, so editing noise no longer moves the waves. Grain and grain size remain an independent fine texture. Randomize varies both field and noise settings from the selected preset.

## API reference

- `preset?: GradientBackgroundPresetName`: finite preset identity.
- `config?: GradientBackgroundConfigInput`: serializable configuration overrides.
- `seed?: number`: deterministic composition seed.
- `colorMode?: "custom" | "palette"`: explicit stops or inherited semantic roles. Defaults to `palette` when a palette is inherited and no preset is named, otherwise to the preset's own mode.
- `colors?: readonly string[]`: two to six six-digit hex colors.
- `contentContrast?: boolean`: repair stops to 4.5:1 against the inherited text color.
- `contentColor?: string`: repair stops to 4.5:1 against this exact color.
- `scrim?: boolean | number`: overlay pulling the field toward the palette background; `true` uses 0.65, a number sets the opacity.
- `scrimColor?: string`: scrim color, defaulting to `--color-balsa-background`.
- `speed`, `scale`, `warp`, `wave`, `softness`, `grain`, `contrast`, `brightness`, `direction`: direct visual overrides.
- `grainSize`: grain cell in CSS pixels, so it holds its size across display densities and PNG capture.
- `fieldOctaves`, `fieldFrequency`, `warpFrequency`: structural field overrides.
- `pattern?: "ribbon" | "radial" | "conic" | "blobs" | "contour" | "cellular"`: which generator draws the field.
- `patternDensity`, `patternCenterX`, `patternCenterY`, `patternComplexity`: repeat count, origin, and blob or cell count.
- `effect?: "none" | "ascii" | "halftone" | "dots" | "lines" | "dither" | "crosshatch"`: redraws the finished gradient as marks.
- `effectScale`, `effectAngle`, `effectMix`, `effectLevels`, `effectShape`, `effectInvert`: mark geometry. `effectScale` is in CSS pixels; `effectMix: 0` renders the field exactly as the gradient pass drew it.
- `effectColorMode`, `effectInk`, `effectPaper`: follow the gradient, replace it with a duotone pair, or lay ink over it.
- `effectCharacters`: the ASCII set, reordered automatically from lightest to heaviest.
- `noiseAmount`, `noiseOctaves`, `noiseFrequency`: independent visible-noise overrides.
- `quality?: "auto" | "low" | "medium" | "high"`: render resolution and FPS profile.
- `paused?: boolean`: explicit static state.
- `theme?: ThemeInput`: local Balsa theme boundary.
- `capturePng({ width, height })`: resolve a still PNG Blob; each dimension is clamped to 320-4096 pixels.
- `renderStill()`: draw the current static frame.

Canonical source: `src/components/ui/GradientBackground.vue`, `gradient-background.ts`, `gradient-background-renderer.ts`, `gradient-background-shader.ts`, `gradient-background-effects-shader.ts`, `gradient-background-glyphs.ts`, and `gradient-background-presets.json`.
