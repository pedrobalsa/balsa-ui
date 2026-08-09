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

## CLI reference

```sh
balsa init
balsa add button
balsa list
balsa search "settings form"
balsa info button --markdown
balsa docs button --markdown
balsa view @shadcn/stepper
balsa diff
balsa update
balsa doctor
balsa mcp --tools
balsa theme apply --list
balsa background create hero --preset obsidian-fold
balsa palette create product --config PAYLOAD
balsa design-system show
balsa version
balsa help
```

`diff` is read-only. `update` applies safe upstream changes and keeps locally edited or diverged source unless replacement is explicitly forced. `mcp` exposes the same read-only discovery, contract, project, design-system, and update-planning answers over stdio.

## Agent discovery

Search by intent with `npx balsa-ui@latest search "<intent>"`, then read only the selected `.balsa/specs/components/<name>.json`. Use the compact catalog index only when CLI search is unavailable. The CLI synchronizes catalogs, specifications, provenance, and the optional Balsa skill into consuming projects.

Public machine-readable documentation is hosted at:

- https://balsa-ui.com/llms.txt
- https://balsa-ui.com/llms-full.txt
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
