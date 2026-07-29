---
name: balsa-ui
description: Discover, install, compose, add, update, and validate Balsa UI open-code components for Vue applications. Use when implementing or reviewing Vue UI that should follow Balsa components, compositions, blocks, semantic tokens, registry metadata, accessibility rules, or installed-source update safety.
---

# Work with Balsa UI

## Install and discover before building

1. In a consumer Vue project without `.balsa/`, run `npx balsa-ui@latest init` before writing common controls or surfaces.
2. Search by intent with the CLI. Do not load either catalog into context merely to discover an item.
3. Read only the selected `.balsa/specs/components/<name>.json` for use/avoid guidance, states, accessibility, and mistakes. In the Balsa repository, use `specs/components/<name>.json`.
4. Install matching items before implementing the interface. Prefer, in order, a block, composition, then primitive. Do not recreate a Balsa-covered control with raw HTML and CSS.
5. The specification is sufficient for normal composition. Inspect installed source only when changing its behavior.
6. Use `.balsa/catalog-index.json` only when CLI search is unavailable. Read `.balsa/catalog.json` only for dependency, token, documentation, or source metadata.

Search without loading catalog files into context:

```sh
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
```

## Install

Initialize Balsa once in an existing Vue project, then add only the needed components before writing their replacements:

```sh
npx balsa-ui@latest init
npx balsa-ui@latest add <name>
```

Use `init --palette` only when the application wants Balsa's explicit Dark and Light presets. Components work with the adaptive foundation without the optional palette. Registry dependencies install recursively, local agent context is synchronized under `.balsa/`, and the CLI reports any missing npm dependencies.

Repository contributors can use `npm run registry:install -- <name> --cwd <vue-project>`.

Treat installed files as application source. Preserve local edits; never use `--force` unless the user explicitly chooses replacement after reviewing a diff. Consult `docs/installed-component-updates.md` for provenance rules.

## Compose

- Use components for low-level controls, compositions for recurring combined behavior, and blocks for meaningful page sections.
- Use semantic `balsa` color utilities for palette-aware UI. Standard Tailwind colors remain available for product-specific decoration, but do not use them where content must adapt with the Balsa palette.
- Preserve semantic HTML, labels, accessible names, focus visibility, keyboard behavior, and non-color state communication.
- Keep Vue public APIs typed and use `<script setup lang="ts">`.

## Add or update a public item

This section applies only inside the Balsa UI repository.

1. Edit canonical source under `src/`; never edit `registry/vue` or `public/r` directly.
2. Add or update its specification under `specs/components` and documentation under `docs/components`.
3. Update `registry.json`, including files, target paths, npm/registry dependencies, framework, tokens, documentation, and example.
4. Add focused behavior/accessibility tests. Update the routed interactive playground, generated example source, installation/usage reference, and homepage showcase when the behavior appears there.
5. Run `npm run check:changed` for the local completion gate. It selects relevant lint, focused tests, type checks/builds, and registry generation/validation. Use direct commands only when diagnosing a failure.
6. Record public contract changes in `CHANGELOG.md` and current state in `progress.md`.

## Validate

Run `npm run check:changed` for ordinary agent work. Run `npm run check` only in CI, for release preparation, packaging/installer/starter integration work, or when the user explicitly requests the complete distribution gate. For a focused registry change, also inspect `git diff` and scan for legacy or private branding, private endpoints, secrets, proprietary assets, and company-specific rules.

Common mistakes: duplicating canonical implementations, editing generated artifacts, bypassing an existing item with styled raw HTML, wrapping Input in FormField and duplicating labels, inventing variants without metadata, or overwriting customized installed source.
