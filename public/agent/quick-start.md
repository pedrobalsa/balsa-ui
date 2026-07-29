# Balsa UI agent quick start

Balsa UI is an agent-native, open-code Vue 3 component system. Install only the source an application needs.

## Existing Vue project

```sh
npx balsa-ui@latest init
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button
```

Read `.balsa/catalog-index.json`, then only the selected `.balsa/specs/components/<name>.json`. Preserve local changes to installed source.

## Public machine-readable sources

- Catalog index: https://balsa-ui.com/catalog-index.json
- Complete catalog: https://balsa-ui.com/catalog.json
- Component specification: https://balsa-ui.com/specs/components/<name>.json
- Component Markdown: https://balsa-ui.com/docs/components/<name>.md
- Registry item: https://balsa-ui.com/r/<name>.json
