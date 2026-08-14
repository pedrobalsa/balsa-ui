# Balsa UI agent quick start

Balsa UI is an agent-native, open-code Vue 3 component system. In an existing Vue project, install and select components before writing common controls or surfaces.

## Required workflow

```sh
npx balsa-ui@latest init
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button
```

Do not recreate a Balsa-covered button, field, dialog, menu, card, navigation region, or feedback control with raw HTML and CSS. Read only the selected `.balsa/specs/components/<name>.json`; inspect component source only when changing its behavior. Preserve local changes to installed source.

For a new template, block, showcase, demo, or visually led page, use the installed `balsa-template-design` companion skill with `balsa-ui`. It adds a one-shot art-direction plan and anti-template critique before implementation.

Use `.balsa/catalog-index.json` only when CLI search is unavailable. Do not load `.balsa/catalog.json` unless dependency, token, documentation, or source metadata is required.

## Public machine-readable sources

- Compact agent entry: https://balsa-ui.com/llms.txt
- Optional complete component listing: https://balsa-ui.com/llms-full.txt
- Catalog index: https://balsa-ui.com/catalog-index.json
- Complete catalog: https://balsa-ui.com/catalog.json
- Component specification: https://balsa-ui.com/specs/components/<name>.json
- Component Markdown: https://balsa-ui.com/docs/components/<name>.md
- Registry item: https://balsa-ui.com/r/<name>.json
- Template design skill: https://balsa-ui.com/agent/skills/balsa-template-design/SKILL.md
