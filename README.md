# Balsa UI

Balsa UI is an agent-native, open-code UI system for Vue 3. It installs readable component source into an application, with independent palettes, design themes, and gradient backgrounds that work separately or together.

## Use Balsa

```sh
npx balsa-ui@latest init
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button
```

`init --palette` adds Balsa's explicit Dark and Light presets. Without it, components use the adaptive foundation and can coexist with an existing project palette.

## Agent discovery

Start with `.balsa/catalog-index.json`, then read only the selected `.balsa/specs/components/<name>.json`. The CLI synchronizes catalogs, specifications, provenance, and the optional Balsa skill into consuming projects.

Public machine-readable documentation is hosted at:

- https://balsa-ui.com/llms.txt
- https://balsa-ui.com/catalog-index.json
- https://balsa-ui.com/specs/components/button.json
- https://balsa-ui.com/docs/components/button.md

## Develop

```sh
npm install
npm run fixtures:install
npm run check
```

Canonical public source lives under `src/components/ui`, `src/styles`, `src/theme`, and `src/background`. Registry, hosted payload, starter, and fixture copies are generated.

The documentation website is maintained in a separate private repository. This repository contains the complete open-source Balsa UI distribution.

## License

MIT
