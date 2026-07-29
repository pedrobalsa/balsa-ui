# Palette

Choose seven colors. Balsa derives the rest.

## Install

Components already install the adaptive foundation. Add the optional palette item only when you want Balsa's named presets.

```sh
npx balsa-ui@latest add button
npx balsa-ui@latest add balsa-palette
```

## Use

```css
@import "tailwindcss";
@import "./styles/balsa-foundation.css";
@import "./styles/balsa-theme.css";
@import "./styles/balsa-palette.css"; /* optional */
```

Activate a preset on the application or one subtree:

```html
<html data-palette="dark">
```

Without `balsa-palette`, components use adaptive neutral colors from the foundation.

## Edit the palette

The website editor and floating palette menu share the same seven colors:

- Background
- Foreground
- Surface
- Muted
- Primary
- Secondary
- Accent

Copy the result as JSON or as an agent prompt to apply it in another project.

## Advanced editing

Expand Overrides only when a derived or feedback color needs a custom value. Reset an override to return to automatic derivation.
