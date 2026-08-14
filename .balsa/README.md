# Balsa agent context

Use the CLI to search by intent before loading catalog files into context. Then read only the selected specification under `specs/components/`.
Use `catalog-index.json` only when CLI search is unavailable, and `catalog.json` only for dependency, token, documentation, or source metadata.

```sh
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button
```

For new templates, showcases, blocks, or visually driven pages, use the companion `balsa-template-design` skill installed under `.agents/skills/` together with `balsa-ui`.

Installed source belongs to this application. Preserve local changes and do not use `--force` without reviewing the diff.
