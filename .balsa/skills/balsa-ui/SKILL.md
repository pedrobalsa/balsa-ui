---
name: balsa-ui
description: Build, fix, review, install, and validate Balsa UI open-code components for Vue applications. Use for focused Balsa repository maintenance, Vue UI built from Balsa components, compositions or blocks, semantic tokens, registry metadata, accessibility behavior, and installed-source update safety. Scale the workflow from direct small fixes to the companion orchestrate-agents skill for independent multi-part work when it is available.
---

# Work with Balsa UI

## Scale the work first

- For a small fix to existing code, work directly. Read the target, its selected
  specification when the public contract matters, and the nearest focused test. Make the
  smallest coherent edit, run the focused test while iterating, then run the repository's
  required changed-area gate once before handoff. Do not initialize Balsa, search the whole
  catalog, research a new design relationship, or update public artifacts when the fix does
  not affect them.
- For new UI or an unfamiliar component choice, use the discovery workflow below. Research
  established practice only before choosing a new scale, ratio, nesting rule, or default
  proportion; record the source with that decision.
- For a new template, block, showcase, demo, or visually led page, load and follow the
  companion `$balsa-template-design` skill before discovery and implementation. It owns art
  direction and the anti-template critique; this skill owns Balsa selection, contracts,
  accessibility, source placement, and validation.
- For a broad task with independent, separately verifiable pieces, use
  `$orchestrate-agents` when that companion skill is installed. Let its protocol choose the
  other Codex account or Claude, isolate parallel writers, and verify their work before
  integration. Do not delegate a small edit; preparing and reviewing the brief would make it
  slower.

## Discover before building new UI

1. In a consumer Vue project without `.balsa/`, run `npx balsa-ui@latest init` before writing common controls or surfaces.
2. Search by intent with the CLI. Do not load either catalog into context merely to discover an item.
3. Read only the selected `.balsa/specs/components/<name>.json`. Its `publicApi` is derived from the component's TypeScript source, so prop types, required flags, defaults, enumerated unions and `v-model` types are exact — do not guess a value that is not in `values`. Its `examples` are complete, type-checked single-file components; copy one rather than inventing usage. In the Balsa repository, use `specs/components/<name>.json`.
4. Install matching items before implementing the interface. Prefer, in order, a block, composition, then primitive. Do not recreate a Balsa-covered control with raw HTML and CSS.
5. The specification is sufficient for normal composition. Inspect installed source only when changing its behavior.
6. Use `.balsa/catalog-index.json` only when CLI search is unavailable. Read `.balsa/catalog.json` only for dependency, token, documentation, or source metadata.

Search without loading catalog files into context:

```sh
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest doctor --json
```

If a `balsa-ui` MCP server is connected, prefer its tools over shelling out for the same
questions — `search_components`, `component_contract`, `design_system`, `project_status`
and `plan_update` return the same answers without a subprocess. Installing is not among
them: run the CLI for that, so a refusal is visible and `--force` stays a deliberate act.

## Use an upstream component only as a fallback

Prefer a Balsa block, composition, or primitive. If Balsa has no suitable item, use the
Balsa CLI to inspect and install a namespaced upstream item such as
`npx balsa-ui@latest view @shadcn/stepper` followed by
`npx balsa-ui@latest add @shadcn/stepper`. Do not run a second registry CLI.

Upstream items receive Balsa's universal color, focus-ring, and base-radius bridge. Additional
design-system reach varies by adapter; inspect `balsa design-system show` or the integration
documentation when that difference matters. Prefer the Balsa implementation when both exist.

When authoring registry metadata, preserve the specification's classification and require a
documented reason before adding a Balsa alternative to an upstream item. Consult upstream
documentation only for an upstream item's own API; Balsa does not mirror it.

## Install

Initialize Balsa once in an existing Vue project, then add only the needed components before writing their replacements:

```sh
npx balsa-ui@latest init
npx balsa-ui@latest add <name>
```

To start from one of Balsa's complete named systems, list and apply it after init:

```sh
npx balsa-ui@latest design-system apply --list
npx balsa-ui@latest design-system apply press
npx balsa-ui@latest design-system show
```

The command installs editable palette, theme, and named-gradient source and reports the exact registration and activation handoff. Use `design-system create` only for a custom Design Studio payload.

Use `init --palette` only when the application wants Balsa's explicit Dark and Light presets. Components work with the adaptive foundation without the optional palette. `init` creates a complete `components.json` only when one is missing; existing configuration stays project-owned. Registry dependencies resolve recursively, required npm packages install through the project's detected npm, pnpm, Yarn, or Bun manager, and local agent context is synchronized under `.balsa/`.

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
2. Add focused behavior or accessibility coverage for the changed behavior.
3. Update `specs/components`, `docs/components`, `registry.json`, examples, playgrounds,
   showcases, `CHANGELOG.md`, and `progress.md` only where the change makes their current
   claims inaccurate. A private implementation fix that preserves the public contract and
   documented behavior does not require mechanical edits to all of them.
4. Run the nearest focused test while iterating. Run `npm run check:changed` once as the local
   completion gate; use broader commands only to diagnose a failure or when explicitly
   required by the repository rules.

## Validate

Run `npm run check:changed` once for ordinary completed agent work. Run `npm run check` only in CI, for release preparation, packaging/installer/starter integration work, or when the user explicitly requests the complete distribution gate. For a focused registry change, also inspect `git diff` and scan for legacy or private branding, private endpoints, secrets, proprietary assets, and company-specific rules.

Common mistakes: duplicating canonical implementations, editing generated artifacts, bypassing an existing item with styled raw HTML, wrapping Input in FormField and duplicating labels, inventing variants without metadata, or overwriting customized installed source.
