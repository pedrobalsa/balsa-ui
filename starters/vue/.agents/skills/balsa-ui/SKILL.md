---
name: balsa-ui
description: Discover, install, compose, add, update, and validate Balsa UI open-code components for Vue applications. Use when implementing or reviewing Vue UI that should follow Balsa components, compositions, blocks, semantic tokens, registry metadata, accessibility rules, or installed-source update safety.
---

# Work with Balsa UI

## Discover before building

1. Read `.balsa/catalog-index.json` and choose likely items by name, category, purpose, and description. Do not load the complete catalog first.
2. Read only the selected `.balsa/specs/components/<name>.json` for use/avoid guidance, status, states, accessibility, and mistakes. In the Balsa repository, the canonical path is `specs/components/<name>.json`.
3. Read `.balsa/catalog.json` only when dependency, token, documentation, or source metadata is needed.
4. Inspect installed source before changing its behavior. Do not infer behavior from a screenshot alone.
5. Prefer, in order, a matching block, composition, then primitive. Create raw UI only when no approved item covers the behavior.

Search without loading catalog files into context:

```sh
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
```

## Install

Initialize Balsa once in an existing Vue project, then add only the needed components:

```sh
npx balsa-ui@latest init
npx balsa-ui@latest add <name>
```

Use `init --palette` only when the application wants Balsa's explicit Dark and Light presets. Components work with the adaptive foundation without the optional palette. Registry dependencies install recursively, local agent context is synchronized under `.balsa/`, and the CLI reports any missing npm dependencies.

Repository contributors can use `npm run registry:install -- <name> --cwd <vue-project>`.

Treat installed files as application source. Preserve local edits; never use `--force` unless the user explicitly chooses replacement after reviewing a diff. Consult `docs/installed-component-updates.md` for provenance rules.

## Compose

- Use components for low-level controls, compositions for recurring combined behavior, and blocks for meaningful page sections.
- Use semantic tokens documented in `docs/tokens.md`. Avoid arbitrary colors, spacing, radii, or shadows.
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
