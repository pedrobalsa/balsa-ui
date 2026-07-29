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

Set `color-mode="palette"` or use `palette-flow`. The component reads inherited semantic CSS variables from its own boundary and reacts to `data-palette`, class, and inline token changes. It does not import a site palette or theme store.

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
- `colorMode?: "custom" | "palette"`: explicit stops or inherited semantic roles.
- `colors?: readonly string[]`: two to six six-digit hex colors.
- `speed`, `scale`, `warp`, `wave`, `softness`, `grain`, `grainSize`, `contrast`, `brightness`, `direction`: direct visual overrides.
- `fieldOctaves`, `fieldFrequency`, `warpFrequency`, `ribbonDensity`: structural field and ribbon overrides.
- `noiseAmount`, `noiseOctaves`, `noiseFrequency`: independent visible-noise overrides.
- `quality?: "auto" | "low" | "medium" | "high"`: render resolution and FPS profile.
- `paused?: boolean`: explicit static state.
- `theme?: ThemeInput`: local Balsa theme boundary.
- `capturePng({ width, height })`: resolve a still PNG Blob; each dimension is clamped to 320-4096 pixels.
- `renderStill()`: draw the current static frame.

Canonical source: `src/components/ui/GradientBackground.vue`, `gradient-background.ts`, `gradient-background-renderer.ts`, `gradient-background-shader.ts`, and `gradient-background-presets.json`.
