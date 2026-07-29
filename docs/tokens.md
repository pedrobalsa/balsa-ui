# Semantic tokens

`src/styles/balsa-foundation.css` owns adaptive defaults, derivation, and namespaced Tailwind CSS 4 utilities. The optional `src/styles/balsa-palette.css` supplies explicit seven-color Dark and Light presets. `src/styles/balsa-theme.css` owns geometry, typography, depth, material, and motion, so components, palettes, and design themes can be installed and selected independently.

Concrete hex, rgb, hsl, oklch, or `color()` values belong to a built-in or consumer palette. Components depend only on the semantic contract below. There is no public numbered palette and no legacy `DesignColor` compatibility layer.

Balsa defines only the namespaced `balsa` Tailwind color utilities. It does not clear or replace Tailwind's standard color namespace, so an existing project's `slate`, `blue`, `white`, and other utilities continue to compile. Use `balsa` utilities where content or component surfaces must follow the active palette; keep host colors for deliberately product-specific decoration.

## Foundation and surfaces

| CSS variable | Tailwind examples | Purpose |
| --- | --- | --- |
| `--balsa-color-background` | `bg-balsa-background` | Application canvas |
| `--balsa-color-foreground` | `text-balsa-foreground` | Default content on the canvas |
| `--balsa-color-surface` | `bg-balsa-surface` | Standard component surface |
| `--balsa-color-surface-foreground` | `text-balsa-surface-foreground` | Content on a standard surface |
| `--balsa-color-surface-elevated` | `bg-balsa-surface-elevated` | Menus, dialogs, and raised panels |
| `--balsa-color-surface-elevated-foreground` | `text-balsa-surface-elevated-foreground` | Content on elevated surfaces |
| `--balsa-color-muted` | `bg-balsa-muted` | Quiet regions and low-emphasis states |
| `--balsa-color-muted-foreground` | `text-balsa-muted-foreground` | Supporting content |
| `--balsa-color-inverse` | `bg-balsa-inverse` | High-contrast inverse region |
| `--balsa-color-inverse-foreground` | `text-balsa-inverse-foreground` | Content on inverse regions |
| `--balsa-color-code` | `bg-balsa-code` | Consistently dark source and command surface; Glassmorphism derives a dark translucent material from it |
| `--balsa-color-code-foreground` | `text-balsa-code-foreground` | Legible content on code surfaces |

## Actions and feedback

Primary, secondary, accent, and destructive actions each define their foreground and interaction states. Status roles are used only where success, warning, or information has actual meaning.

| Role | CSS variables |
| --- | --- |
| Primary | `--balsa-color-primary`, `--balsa-color-primary-foreground`, `--balsa-color-primary-hover`, `--balsa-color-primary-active` |
| Secondary | `--balsa-color-secondary`, `--balsa-color-secondary-foreground`, `--balsa-color-secondary-hover`, `--balsa-color-secondary-active` |
| Accent | `--balsa-color-accent`, `--balsa-color-accent-foreground`, `--balsa-color-accent-hover`, `--balsa-color-accent-active` |
| Destructive | `--balsa-color-destructive`, `--balsa-color-destructive-foreground`, `--balsa-color-destructive-hover`, `--balsa-color-destructive-active` |
| Success | `--balsa-color-success`, `--balsa-color-success-foreground` |
| Warning | `--balsa-color-warning`, `--balsa-color-warning-foreground` |
| Information | `--balsa-color-info`, `--balsa-color-info-foreground` |

## Controls

| CSS variable | Purpose |
| --- | --- |
| `--balsa-color-border` | Quiet dividers and decorative edges |
| `--balsa-color-border-strong` | Meaningful component boundaries |
| `--balsa-color-input` | Editable control background |
| `--balsa-color-input-foreground` | Input values and icons |
| `--balsa-color-input-border` | Required control boundary |
| `--balsa-color-focus-ring` | Keyboard focus indicator |
| `--balsa-color-selected` | Selected option or navigation state |
| `--balsa-color-selected-foreground` | Content on selected states |
| `--balsa-color-disabled` | Unavailable control background |
| `--balsa-color-disabled-foreground` | Unavailable control content |
| `--balsa-color-overlay` | Dialog and sheet backdrop |

Shape, spacing, and depth are theme-owned Tailwind values. Public elevation uses `--balsa-shadow-sm`, `--balsa-shadow-md`, and `--balsa-shadow-lg`; the control, surface, and panel variables remain compatibility aliases. Components expose typed shadow levels when they own elevation, while `auto` retains the recipe and `--balsa-shadow-detail` remains internal.

## Theme material layer

The public `--balsa-color-*` variables remain palette-owned. A design theme derives internal `--balsa-material-*` values from them for standard, raised, muted, action, input, selected, inverse, code, border, and overlay materials. Glassmorphism obtains its depth from translucent fills plus backdrop blur: standard, strong, input, and semantic action rims are low-opacity material colors, and shadows provide only restrained outer separation. It intentionally avoids inset shadows and universal painted gradients, allowing the same material recipe to remain glass-like over Light, Dark, and custom palette backgrounds. The Button `glass` variant uses theme-owned `--balsa-material-glass-control*` recipes for its translucent body, interaction states, and restrained rim; `outline` remains the higher-boundary action treatment. Documentation-workbench layers use the same opacity-led system. The playground's preview canvas remains opaque while its explicit theme and palette boundary follows the active documentation selectors. Consumers should normally customize palette roles or select a theme instead of overriding material variables directly.

Theme authors normally choose seven finite `ThemeOptions`: typography, shape, density, border, elevation, motion, and material. Balsa deterministically derives typography, radii, borders, shadows, spacing, effects, transforms, semantic materials, and compatible component defaults from those choices. Structured `ThemeTokens` remain available under `overrides.tokens` for exceptional exact values. Numeric geometry uses pixels, motion uses milliseconds, and opacity is normalized from zero to one. Materials reference palette roles and serialize to `color-mix()`, so a custom theme never owns palette colors. See [Design themes](./themes.md) for inheritance, providers, recipes, and overrides.

## Built-in guarantees

Without a palette, components use neutral adaptive defaults from the host `color-scheme`. `[data-palette="dark"]` and `[data-palette="light"]` explicitly define the seven source colors; the foundation derives the remaining roles. Both are neutral and brand-independent, while restrained hues remain only for semantic feedback. Representative normal text pairs meet 4.5:1, while meaningful boundaries and focus pairs meet 3:1.

See [Palette](./palette.md) for the seven configurable source colors, existing-project adapters, explicit activation, CSS derivation, optional overrides, and Advanced Palette Studio.
