# Balsa agent context

Start with `catalog-index.json`, then read only the selected specification under `specs/components/`.
Use `catalog.json` only when dependency, token, documentation, or source metadata is needed.

```sh
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button
```

Installed source belongs to this application. Preserve local changes and do not use `--force` without reviewing the diff.
