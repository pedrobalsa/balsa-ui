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
- `void-ribbon`: narrow light ribbons over black.
- `black-silk`: vertical silver folds with restrained highlights.
- `smoke-field`: faster, large-scale diffuse forms using the Silver palette.
- `liquid-metal`: high-contrast black chrome with hard silver reflections and a restrained warm-steel undertone.
- `iridescent-flow`: soft lavender, pink, mint, and blue liquid ribbons.
- `holographic-flow`: high-key pearl, cyan, periwinkle, lilac, blush, and champagne folds inspired by holographic foil.
- `palette-flow`: derives background, surface, primary, secondary, and accent from the nearest semantic palette boundary.

Every preset defines every renderer value and has a stable seed. Preset defaults are applied first, `config` overrides them second, and individual component props have final precedence.

`obsidian-fold` is the default identity: it supplies the geometry whenever no preset is named, including in palette mode, where only its colors are replaced by the inherited roles. `palette-flow` is the only preset that ships `colorMode: "palette"` itself; every other preset is authored artwork in `custom` mode, and naming one keeps its stops unless you set `color-mode` explicitly.

## Versioned configuration

`BalsaBackgroundConfig` uses `schemaVersion: 2`, a finite preset identity, a deterministic integer seed, a custom or palette color mode, two to six colors, visual parameters, and quality. Runtime resources and Studio UI state never appear in the JSON. Schema-one files remain accepted and migrate their former structural `noiseOctaves` and `noiseFrequency` values to `fieldOctaves` and `fieldFrequency`; new visible-noise values come from the selected preset.

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

## Background Studio

Open `/tools/background-studio` on the official site for an immersive full-screen canvas. Entering the Studio selects Glassmorphism so generated fields are immediately evaluated behind translucent surfaces. Its hideable configuration drawer hugs the active section's content and grows only to its viewport-safe maximum, where the controls scroll internally without constraining the generated field. The Color palette menu previews several editable palettes as segmented swatches beside their names, and the selected colors remain available as one contiguous two-to-six-segment color-picker strip. Stop labels and hex values remain accessible inside each editor without repeating on the strip; its outlined destructive trash action sits beside Close and disables at the two-stop minimum. Continuous synthesis values use compact labeled sliders with individual resets, grouped under expandable Wave generation & form and Adjustments sections; Render quality stays categorical and Seed is the final input. Randomize now derives a fresh reproducible variation from the selected preset's proven geometry and enforces expressive minimums for wave strength, warp, contrast, ribbon density, and noise layers rather than changing only the seed. The compact bottom-left quick-actions toolbar keeps layout choices in a hover/focus menu attached to Show UI, with structurally distinct Storefront, Dashboard, and Editorial options presented like the site's theme selector. Every simulation uses explicit placeholder or lorem-ipsum copy so it cannot be mistaken for real site content. No layout is selected while the simulation is hidden; selecting a layout reveals it, selecting the active layout again hides it, and clicking Show UI directly starts with Editorial. A neighboring Theme menu applies Modern Flat, Brutalism, or Glassmorphism to the simulation over the same generated field. Theme and layout menus retain their paired selected foreground and background while hovered. Selecting a layout or theme closes configuration automatically, while a separate rounded button at the bottom-right reopens it. The Export tab has three disclosures: Balsa CLI is expanded initially and embeds the exact normalized configuration in one shell-safe `background create --config` command that installs and writes the background without an intermediate file, followed by copyable Vue import/template usage for the generated module; Manual retains typed configuration, Vue usage, and optional JSON exchange; Prompt explicitly obtains GradientBackground through `npx balsa-ui@latest add gradient-background` before providing the normalized configuration. Still PNG export remains available at common dimensions below the project workflows.

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
- `speed`, `scale`, `warp`, `wave`, `softness`, `grain`, `grainSize`, `contrast`, `brightness`, `direction`: direct visual overrides.
- `fieldOctaves`, `fieldFrequency`, `warpFrequency`, `ribbonDensity`: structural field and ribbon overrides.
- `noiseAmount`, `noiseOctaves`, `noiseFrequency`: independent visible-noise overrides.
- `quality?: "auto" | "low" | "medium" | "high"`: render resolution and FPS profile.
- `paused?: boolean`: explicit static state.
- `theme?: ThemeInput`: local Balsa theme boundary.
- `capturePng({ width, height })`: resolve a still PNG Blob; each dimension is clamped to 320-4096 pixels.
- `renderStill()`: draw the current static frame.

Canonical source: `src/components/ui/GradientBackground.vue`, `gradient-background.ts`, `gradient-background-renderer.ts`, `gradient-background-shader.ts`, and `gradient-background-presets.json`.
