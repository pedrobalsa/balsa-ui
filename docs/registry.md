# Registry usage

## Discover and build

```sh
npm run registry:list
npm run registry:build
npm run registry:validate
```

`registry.json` is the shadcn-style index. The documentation deployment exposes built item payloads at `https://balsa-ui.com/r/<name>.json`.

To confirm compatibility against the current official Vue CLI without replacing deterministic repository artifacts:

```sh
npx --yes shadcn-vue@latest build registry.json --output .tmp/shadcn-registry
```

This compatibility command validates all registry items against the official Vue registry format. It requires network access and may enforce a newer supported Node patch than the local deterministic scripts.

## Install editable source locally

From a consuming Vue project, use the Balsa CLI:

```sh
npx balsa-ui@latest init
npx balsa-ui@latest search "settings form"
npx balsa-ui@latest info input --markdown
npx balsa-ui@latest add breadcrumb
```

`init` installs the adaptive foundation and theme recipes, configures a recognized Tailwind stylesheet, and adds compact agent instructions without replacing existing `AGENTS.md` content. Use `init --palette` only for the explicit Dark and Light presets.

Generate a typed deterministic background from a built-in preset, the Studio's shell-safe inline handoff, or saved schema-one/schema-two JSON:

```sh
npx balsa-ui@latest background create hero --preset obsidian-fold
npx balsa-ui@latest background create hero --config STUDIO_PAYLOAD
npx balsa-ui@latest background create hero --from ./balsa-background.json
```

Background Studio supplies the complete `--config` command, so exact-current import needs no intermediate download. The background command installs the `gradient-background` registry item and its support files through the same safe installer, writes `src/backgrounds/<name>.ts`, records provenance, and refuses a differing generated file unless `--force` is explicit.

Repository contributors can run the equivalent deterministic local command:

```sh
npm run registry:install -- breadcrumb --cwd ../my-vue-app
```

Both commands recursively install `@balsa/balsa-theme` and `@balsa/balsa-foundation`, write source under the target project's `src/`, synchronize the compact catalog, specifications, and optional skill, and record hashes in `.balsa/installed.json`. Components do not install a palette. Import the adaptive foundation and design-theme recipes after Tailwind:

```css
@import "tailwindcss";
@import "./styles/balsa-foundation.css";
@import "./styles/balsa-theme.css";
```

Generate a source-controlled theme from a built-in preset, JSON file, or quick
editor payload with `balsa theme create <name>`. The command installs
`balsa-theme`, writes `src/themes/<name>.ts`, tracks its hash in the installed
manifest, protects differing files, and prints registration instructions
without editing application entrypoints.

Generate a complete design system — palette and theme together — from a Design
Studio payload with `balsa design-system create <name>`. The command installs
`balsa-theme` and `balsa-palette`, writes `src/themes/<name>.ts` alongside
`src/styles/<name>-palette.css`, records both files in the installed manifest,
protects differing files, and prints the import and activation instructions.
Palette token values are restricted to plain hex, keyword, and standard color
functions so a generated stylesheet can never carry arbitrary CSS.

Install and import `balsa-palette` separately only when the project wants the explicit Dark/Light presets. Importing it is inert until a `data-palette` selector is applied.

Install npm dependencies reported by `registry.json` (`vue`, `tailwindcss`, and `@lucide/vue` for this example). The installed `.vue`, `.ts`, and `.css` files are ordinary editable source. If a target already differs from the canonical source, installation stops rather than overwriting customization.

Compatible shadcn-style tooling can consume `https://balsa-ui.com/r/<name>.json`. Agents start with the compact `/llms.txt` workflow and CLI search, then load one per-item specification or Markdown page. `/llms-full.txt` and the catalogs remain available for explicit bulk discovery.

## Installation smoke test

```sh
npm run test:registry
```

The test installs `button-group`, `breadcrumb`, `input`, and `gradient-background` into `tests/fixtures/registry-vue`, verifies transitive source and Three.js dependencies, type-checks the fixture, and performs a production build.
