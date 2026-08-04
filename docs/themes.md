# Design themes

Themes control typography, shape, density, borders, elevation, motion, materials, and component appearance defaults. Palettes control semantic colors and remain independent.

## Install

```sh
npx balsa-ui@latest add balsa-theme
```

Import `balsa-foundation.css` and `balsa-theme.css`. The palette stylesheet is optional.

## Use

Built-in strings work on one component or a provider:

```vue
<BalsaThemeProvider theme="glassmorphism">
  <Card>Scoped content</Card>
</BalsaThemeProvider>

<Button theme="brutalism">Local override</Button>
```

Install `createDesignThemeStore()` as a Vue plugin to register application themes and provide global defaults:

```ts
const theme = createDesignThemeStore({ themes: [editorial] });
createApp(App).use(theme).mount("#app");
```

Consumer stores persist only the selected theme ID. Keep definitions in source control.

Applications that intentionally provide a theme editor can opt into the editable
custom-theme slot:

```ts
const theme = createDesignThemeStore({ customTheme: true });
```

Built-in presets stay pristine in this mode. The first edit branches the selected
preset into one custom theme (`balsa-custom`) and selects it; every later edit
overwrites that same slot, so a preset never accumulates hidden modifications.

This mode persists schema-five state — the selected id and the single custom
theme with the preset it branched from — plus the applied presentation snapshot
used before Vue starts. It exposes `activeDraft`, `activeBase`, `customTheme`,
`customThemeActive`, `setCustomDraft()`, and `clearCustomTheme()`, which discards
the custom theme and returns to its base preset. The slot is disabled by default.

## Create a theme

Generate an editable source module without changing your application entrypoint:

```sh
npx balsa-ui@latest theme create my-modern-flat-theme --preset modern-flat
npx balsa-ui@latest theme create product-theme --from ./balsa-theme.json
```

The CLI installs `balsa-theme`, writes `src/themes/<name>.ts`, records the
generated module in `.balsa/installed.json`, and prints import and store
registration instructions. A `BalsaThemePresetConfig` uses `schemaVersion: 1`,
a built-in `base`, sparse `options`, and sparse token `overrides`. Differing
files are protected unless `--force` is explicitly supplied.

Choose only the directions that differ from the inherited theme. Balsa derives the exact tokens and compatible component defaults.

```ts
import { defineTheme } from "@/components/ui/theme";

export const editorial = defineTheme({
  id: "editorial",
  name: "Editorial",
  extends: "modern-flat",
  options: {
    typography: "editorial",
    shape: "subtle",
    density: "comfortable",
    elevation: "soft",
    material: "soft",
  },
});
```

The seven configurable directions are typography, shape, density, border, elevation, motion, and material. Border recipes are None (0px), Soft (1px at 55% of the active border-material opacity), Medium (1px at full recipe opacity), and Strong (2px at full recipe opacity). Each level updates structural, input, outlined, glass-control, and filled component boundaries together. Every built-in theme starts Compact: 32px application controls, 12px control insets, and a 4px spacing rhythm. Balanced and Comfortable are opt-in recipes for products that deliberately need more air.

Modern Flat defaults to Soft borders and no elevation, keeping its hierarchy dependent on spacing, surface color, and typography instead of shadows.

The Glass material automatically applies translucent, backdrop-filtered surfaces to Card, navigation, menus, dialogs, selectors, and other overlay-capable components. The blur and saturation come from the theme's effect tokens, so editing Backdrop blur restyles every glass surface at once.

## Overrides

Use overrides only when a recipe choice cannot express the required detail:

```ts
export const editorial = defineTheme({
  id: "editorial",
  name: "Editorial",
  extends: "modern-flat",
  options: { typography: "editorial", shape: "subtle" },
  overrides: {
    tokens: { radius: { control: 6 } },
    defaults: {
      components: { button: { variant: "outline" } },
    },
  },
});
```

Explicit component props still win over component defaults, family defaults, and library fallbacks. The deprecated top-level `tokens` and `defaults` fields remain readable for one compatibility cycle, but exports use `overrides`.

## Website quick editor

The persistent Theme launcher opens a viewport-safe quick editor. Modern Flat,
Brutalism, and Glassmorphism each retain their own local draft; recipe and
advanced-token edits preview and persist immediately, and changed presets show
`(custom)`. Every recipe can be reset independently, while the header Reset
restores the complete active preset.

Main and Base font selectors preview every locally bundled choice in its own
typeface. Main controls the title stack and offers Space Grotesk, Montserrat,
Poppins, Playfair Display, Oswald, and Raleway. Base updates the body and
control stacks and offers Inter, Roboto, Open Sans, Lato, Noto Sans, and Source
Sans 3. System-font placeholders are not preset choices. The remaining
typography weights, transforms, tracking, and custom stacks stay in Typography
Advanced settings.

The quick Radius menu replaces categorical shape language with None, Small,
Medium, Large, XL, 2XL, 3XL, and Pill sizes and uses the border-radius icon.
Borders offers None, Soft, Medium, and Strong; None sets every theme-owned
normal, outline, and solid border width to zero.
Shadow uses the box-shadow icon and offers None through 3XL, scaling the `sm`,
`md`, `lg`, and `detail` layers together. A built-in shadow without an exact
size equivalent, including Glassmorphism's floating recipe, is labelled
`Custom`. Transitions is the quick-editor label for the backward-compatible
`motion` recipe and its advanced timing, easing, and transform controls.

Advanced settings inherit the active material. Glassmorphism dialogs use the
same translucent surface and backdrop filtering as the quick panel. Desktop
dialogs are 576px wide when space permits, collision-flip horizontally, and
grow naturally up to the viewport margin; narrow screens use a nearly
full-height bottom sheet. A compact fixed header owns the property title and
Reset action, while only the form body scrolls. Escape or an outside click
dismisses the dialog and restores focus, so there is no redundant Close button.
The shell uses restrained fixed corners rather than the active panel radius.

The footer copies a `balsa theme create` command containing the current portable
configuration. Component and family defaults are intentionally left to Design
Studio; the quick editor owns only typography, radius, density, borders, shadow,
transitions, and material.
