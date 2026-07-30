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

## Create a theme

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

The seven configurable directions are typography, shape, density, border, elevation, motion, and material. Every built-in theme starts Compact: 32px application controls, 12px control insets, and a 4px spacing rhythm. Balanced and Comfortable are opt-in recipes for products that deliberately need more air.

The Glass material automatically applies translucent, backdrop-filtered surfaces to navigation, menus, dialogs, selectors, and other overlay-capable components.

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

## Website editor

The editor at `/docs/themes` shows the seven recipe choices and their effective base values. Exact tokens and defaults stay in the collapsed Overrides section. The first edit creates one unsaved theme named `Custom`; further edits update that same draft. Save promotes the draft to a named reusable theme and clears it, while Discard returns to its parent theme. The page Select and floating Theme menu stay synchronized.

The floating Theme menu remains a selector and links directly to the editor. Website-authored definitions are persisted locally; consumer applications persist selection only.
