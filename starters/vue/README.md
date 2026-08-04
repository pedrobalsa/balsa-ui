# Balsa UI Vue starter

A standalone Vue 3, strict TypeScript, Vite, and Tailwind CSS 4 starting point with Balsa's foundation, palette, themes, representative editable components, validation, and local agent context.

```sh
npm install
npm run dev
npm run check
```

Agents search by intent first, then read only the selected specification and add the matching editable components before writing raw controls:

```sh
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button modal
```

The starter has no dependency on the Balsa monorepo. Installed Balsa files are ordinary application source; preserve local changes when adding or updating items. The generated font stylesheet keeps the Latin application fonts on modern WOFF2 assets, while icons are tree-shaken Vue components.
