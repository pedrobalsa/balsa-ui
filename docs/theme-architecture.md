# Design theme architecture decision

## Decision

Balsa separates appearance into two independent, inheritable contracts:

- **Palette** owns semantic color values and `color-scheme` through `data-palette`.
- **Theme** owns component recipes, typography treatment, geometry, density, borders, material, elevation, and motion through `data-theme`.

`modern-flat` is the canonical default theme. `brutalism` and `glassmorphism` are complete alternatives expressed through the same seven typography, shape, density, border, elevation, motion, and material choices available to custom themes. Custom `defineTheme` definitions inherit from a built-in or another definition. Theme and palette selectors may be combined globally or on any subtree without mutating one another.

Public components expose `theme?: ThemeInput`. Built-in strings retain the existing attribute contract; custom scopes write `data-theme-base` and the complete token output derived from their options plus sparse exact overrides. Existing variants continue to express component intent, while typed derived and overridden defaults can set appearance when the component prop is omitted.

## Layers

1. `src/styles/balsa-foundation.css` defines adaptive defaults, derivation, override hooks, and namespaced Tailwind utilities.
2. `src/styles/balsa-palette.css` optionally defines seven source colors for explicit palette selectors.
3. `src/styles/balsa-theme.css` maps effective colors into theme materials and defines component recipes.
4. `src/components/ui/theme.ts`, `theme-context.ts`, and `BalsaThemeProvider.vue` own definition validation, inheritance, serialization, default resolution, and scoped context.
5. Canonical Vue components expose stable hooks, resolve appearance precedence centrally, and preserve context through top layers.
6. The consumer store persists selection only. The documentation website additionally persists its authored custom definitions.

Component recipes use CSS variables for reusable decisions and stable data hooks for legitimate component-specific behavior. CSS behavior is never keyed to a built-in theme ID outside the static preset declarations, allowing independent recipe choices to compose. Balsa does not duplicate Vue templates per theme or build theme-by-variant TypeScript matrices.

## Reference interpretation

- **Modern Flat** takes the BuyCo reference's clear color fields, rounded composition, solid/outline hierarchy, generous spacing, and restrained elevation without copying its colors, assets, content, or marketing timing.
- **Brutalism** takes the Latereio reference's rectangular geometry, visible borders, monospaced utility, compact rhythm, and direct motion while using flat, shadow-free elevation and the active Balsa palette.
- **Glassmorphism** adapts Apple's Liquid Glass principles for the web: glass is strongest on functional and transient layers, ordinary content remains readable, and transparency, contrast, motion, and performance fallbacks are mandatory.

## Public coverage

Theme coverage is checked against the installable catalog. Every public primitive, composition, and block must render intentionally in built-in and custom scopes, including detached popovers and teleported dialog layers.
