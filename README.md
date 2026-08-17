<div align="center">

# Balsa UI

**Open-code UI components for Vue and React — installed as source you own, built for humans and agents.**

[![npm](https://img.shields.io/npm/v/balsa-ui?color=%230b7285&label=npm)](https://www.npmjs.com/package/balsa-ui)
[![downloads](https://img.shields.io/npm/dm/balsa-ui?color=%230b7285)](https://www.npmjs.com/package/balsa-ui)
[![CI](https://github.com/pedrobalsa/balsa-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/pedrobalsa/balsa-ui/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/balsa-ui?color=%230b7285)](./LICENSE)
[![stars](https://img.shields.io/github/stars/pedrobalsa/balsa-ui?style=flat&color=%230b7285)](https://github.com/pedrobalsa/balsa-ui/stargazers)

[Documentation](https://balsa-ui.com) · [Component library](https://balsa-ui.com/library) · [Design systems](https://balsa-ui.com/docs/design-systems) · [Changelog](./CHANGELOG.md)

</div>

```sh
npx balsa-ui@latest add button
```

That's it. Balsa detects whether your project is Vue or React, installs the matching
implementation as editable source in your repository, and never asks you to import from a
black box.

---

## Why Balsa

**You own the code.** Components install as readable source into your project, not as a
dependency you import. Edit them. Balsa tracks what it installed and, on update, preserves
anything you changed rather than overwriting it.

**One catalog, more than one framework.** The same component exists for Vue and React, built
on a shared framework-neutral core, so a design decision lands in both. `balsa add button` is
the correct command in either project — the CLI resolves the framework and reports an error
rather than guessing when a project is ambiguous.

**Built to be read by agents.** Every component ships a machine-readable specification whose
props, types, and enumerated values are derived from the source by the compiler, not written by
hand. An agent can search by intent, read one specification, and install the right component
without scraping documentation.

**Design systems, not just components.** Palettes, design themes, and gradient backgrounds are
independent layers that work alone or together, so the catalog adapts to your product instead of
imposing one look.

## Framework support

| | Items | Primitives | Compositions |
| --- | --- | --- | --- |
| **Vue 3** | 102 | 71 | 39 |
| **React 19** | 99 | 71 | 39 |

Every Vue UI component has a React implementation. Shared CSS, the theme core, and the portal
core are consumed by both.

## Quick start

```sh
npx balsa-ui@latest init            # create components.json, install peer deps
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add input button modal
```

`init` writes a shadcn-compatible `components.json` only when one is missing, and both `init`
and `add` install required npm packages through your detected npm, pnpm, Yarn, or Bun — while
preserving existing configuration and source.

```vue
<script setup lang="ts">
import { Plus } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
</script>

<template>
  <Button :prefix-icon="Plus">Create project</Button>
</template>
```

```tsx
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";

<Button prefixIcon={Plus}>Create project</Button>;
```

## For agents

Balsa is designed so an agent can work from intent rather than from prose:

```sh
npx balsa-ui@latest search "settings form"     # intent → candidate items
npx balsa-ui@latest info input --markdown      # one item's derived contract
npx balsa-ui@latest add input                  # install it
npx balsa-ui@latest mcp --tools                # same answers over MCP/stdio
```

Read only the selected `.balsa/specs/components/<name>.json`; the compact catalog index is a
fallback for when CLI search is unavailable. The CLI keeps catalogs, specifications, provenance,
and the optional Balsa agent skill synchronized inside your project.

Hosted machine-readable surfaces:

- [`https://balsa-ui.com/llms.txt`](https://balsa-ui.com/llms.txt) · [`llms-full.txt`](https://balsa-ui.com/llms-full.txt)
- [`catalog-index.json`](https://balsa-ui.com/catalog-index.json)
- [`specs/components/button.json`](https://balsa-ui.com/specs/components/button.json)
- [`docs/components/button.md`](https://balsa-ui.com/docs/components/button.md)
- Registry payloads: `/r/<name>.json` (Vue) · `/r/react/<name>.json` (React)

## Design systems and themes

Eight authored design systems install by name, and three design themes restyle the whole
catalog without touching component source:

```sh
npx balsa-ui@latest design-system apply press
npx balsa-ui@latest theme apply --list        # modern-flat, brutalism, glassmorphism
npx balsa-ui@latest palette create product --config PAYLOAD
npx balsa-ui@latest background create hero --preset obsidian-fold
```

## Quality contract

Every item is measured against the Balsa design system contract — theme tokens rather than raw
values, a stable identity attribute, and documented theme resolution — and the result is
computed from source rather than declared by the author:

| | Fully integrated | Partial |
| --- | --- | --- |
| Vue | 91 | 6 |
| React | 92 | 5 |

Component contracts are derived by the TypeScript compiler and `vue-component-meta`, so
`balsa info` reports types and enumerated unions that are true by construction. The release
gate proves all of them against their sources on every change.

## CLI

```sh
balsa init                  balsa add <item...>         balsa list
balsa search "<intent>"     balsa info <item>           balsa docs <item>
balsa view @shadcn/stepper  balsa diff                  balsa update
balsa doctor                balsa mcp --tools           balsa version
balsa theme apply           balsa palette create        balsa background create
balsa design-system show    balsa design-system apply   balsa help
```

`diff` is read-only. `update` applies safe upstream changes and keeps locally edited or diverged
source unless replacement is explicitly forced. `mcp` exposes the same read-only discovery,
contract, project, design-system, and update-planning answers over stdio.

## Contributing

```sh
npm install
npm run fixtures:install
npm run check
```

Canonical source lives under `src/components/ui`, `src/styles`, `src/theme`, and
`src/background` for Vue, and `packages/react` for React. Registry, hosted payload, starter, and
fixture copies are generated — edit the canonical source, never the generated output.

`npm run check` is the full distribution gate: lint, tests, build, registry generation and
validation, derived contracts, documented examples, strict consumer type-checking, starter
synchronization, package packing, and release consistency.

The documentation website is maintained in a separate repository. This repository contains the
complete open-source Balsa UI distribution.

## License

[MIT](./LICENSE)
