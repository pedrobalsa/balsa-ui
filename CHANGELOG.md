# Changelog

## 0.7.1

- Released `balsa-ui@0.7.1` as a packaging-only patch release. No component
  API, configuration schema, or registry item version changed. `balsa add
  text-3d` failed for anyone installing from npm: the item declares 84 files,
  76 of them typeface JSON under `public/fonts/typeface/`, and that directory
  was missing from the published package. Local installation reads every
  declared file and has no network fallback, so the command exited with
  `ENOENT` on the first typeface. Installing from the hosted registry was
  unaffected, because `/r/<name>.json` embeds file content at build time,
  which is why the failure was visible only through the npm CLI. Upgrade to
  install `text-3d`; nothing else in 0.7.0 was affected and no reinstall of
  previously installed components is required.

## 0.7.0

- Released `balsa-ui@0.7.0` as a breaking pre-1.0 minor release. Text3D moves
  to item version 0.7.0; no other registry item version changes. Additive
  Text3D work in this release includes camera `zoom`, `gradientPreset`, runtime
  Google Fonts through `fontFamily`, composited/text/backdrop PNG export
  layers, and a `text-3d add` workflow that installs the component before
  writing a scene.

## 0.6.0

- Released `balsa-ui@0.6.0`. There are no breaking component or configuration
  changes in this release: no existing prop, event, slot, model, item name, or
  configuration field was removed or renamed. The release adds the optional,
  consent-gated Analytics item; completes the unified visual Library and its
  implementation comparisons; makes CLI onboarding and named design-system
  application self-contained; expands the certified shadcn-vue showcase wave;
  and refines Design Studio, Gradient Studio, navigation, overlays, and responsive
  Tabs behavior. Analytics starts at item version 0.1.0. Breadcrumb, Button,
  Footer, Link, Modal, Navbar, and Slider move to 0.1.1 for additive contracts or
  behavior fixes, while Tabs moves to 0.1.2; every other retained item version is
  unchanged.

## 0.5.0

- Released `balsa-ui@0.5.0`. Breaking: the theme recipe option formerly named `density` is now `size`, because control size and surrounding spacing are independent dimensions. Rename `options.density` to `options.size` in typed `defineTheme` calls and authored theme modules. Schema-one theme/design-system payloads and CLI input still accept `density` and normalize it to `size`; the `density` props on Table and DataTable and the legacy `--balsa-spacing-density-*` tokens did not move. The composition catalog also removes `account-security-card`, `action-list-card`, `appointment-card`, `balance-summary-card`, `empty-state-card`, `file-upload-card`, `invite-members-card`, `payout-method-card`, `savings-goal-card`, `schedule-card`, `transaction-list-card`, `transfer-funds-card`, and `usage-summary-card` after a provenance audit found them derivative of an upstream gallery. They have no compatibility aliases: keep an already installed local copy if it is intentionally customized, or use `balsa search` to choose and install one of the rebuilt production patterns. Finally, `search --json` now returns ranked Balsa and certified-upstream results with `kind`, `score`, and `matched`; machine consumers that require only Balsa entries should filter out `kind: "upstream"` rather than relying on the previous result set or order.

  The shadcn-vue integration advances from a color bridge to a certified adapter program: 58 generated manifests record exact upstream hashes, dependency measurements, portal behavior, RTL and reduced-motion support, and per-dimension reach. Styling patches carry spacing, borders, elevation, logical-direction fixes, and current `@lucide/vue` imports where upstream has no variable; a stale hash or ambiguous patch safely downgrades the entire item to unpatched. The installer now rewrites upstream sibling imports to consumer aliases, derives missing npm dependencies from source, and compiles the twelve-item proof wave without unreachable imports or silent adapter loss. Balsa's registry remains the default, while `@shadcn/<item>` is installable through the same CLI.

  The design system gains a token-backed thirteen-step spacing scale, independent Control size and Spacing recipes, concentric `rounded="auto"` surface geometry, nested automatic elevation, and a resolved palette-role layer so Glass interaction states remain translucent instead of falling through invalid CSS variables. Conformance gates now measure all public Balsa surfaces and adapted upstream showcases, certify upstream drift without mutating source, type-check every documented example, and keep adapter manifests generated from the sources they certify.

  Agent and source-lifecycle tooling is now complete: `balsa diff` distinguishes unchanged, local, upstream, diverged, and missing installed source; `balsa update` takes safe upstream changes while preserving local work; `doctor` reports project configuration, modifications, and outdated adapters; `design-system show` explains token dimensions and measured upstream reach; and the read-only `balsa mcp` server exposes search, component contracts, design-system state, project status, and update planning over JSON-RPC without adding an SDK dependency.

  The public surface grows from 88 to 95 documented items and from 91 to 100 registry entries. Nineteen original production compositions replace the thirteen removed patterns, covering data grids, scheduling, command palettes, carousels, resizable workspaces, release notes, device verification, service health, storage, inboxes, filters, incidents, plans, profiles, usage, environments, API keys, integrations, and runbooks; `image-compare-card` is the twentieth new item and completes the rebuilt 38-composition catalog. No retained prop, event, slot, or model was removed. Alert, Resizable, ScrollArea, and Table move to item version 0.2.0 for additive `rounded="auto"`; Charts moves to 0.3.0 for `areaFill`; InputOTP moves to 0.2.0 for `fluid`; the twelve retained compositions whose authored defaults changed move to 0.1.1; all twenty new items start at 0.1.0; every other item version is unchanged.

## 0.4.0

- Released `balsa-ui@0.4.0`. Breaking, all in machine-readable contracts rather than component APIs: `.balsa/installed.json` moves to schema two and keys components by fully qualified reference (`@balsa/button`) instead of bare name, because two registries may publish the same name; an older manifest is upgraded in place on the next install, so no reinstall is required. Every component specification's `publicApi` is now an object per prop rather than a list of names, and both `classification` and the catalog's `releaseVersion` are required fields. Anything reading `spec.publicApi.props` as strings must read `prop.name`. No component prop, event, slot or CSS token changed.

  The Balsa CLI becomes the gateway to the shadcn-vue ecosystem. `balsa add` resolves `@namespace/item` against the registries declared in a project's `components.json`, with `@balsa` and `@shadcn` built in, so `balsa add @shadcn/stepper` installs upstream source, its dependencies and its npm packages without the shadcn CLI. A bare name still resolves to `@balsa`; `--implementation <registry>` redirects bare names only. Cross-registry dependencies resolve against the registry that declared them, circular dependencies are reported rather than hung on, and two items may share a file as long as the content agrees. New commands: `balsa view` (resolve and inspect any item, including upstream ones), `balsa doctor` (report project problems by stable code), `balsa theme apply <preset>`, and `balsa version`. The published registry gains an index at `/r/registry.json`; its output is byte-for-byte identical to `shadcn-vue build` on the same source.

  Component contracts are now derived from TypeScript rather than hand-written. `balsa info` reports exact prop types, required flags, defaults, enumerated unions, expanded object shapes, events, slots and `v-model` bindings, so `Badge`'s colors list every legal value and visibly exclude `neutral`, `Navbar`'s `logo` shows both `BrandLogo` variants, and `DatePicker`'s model type is stated. A release gate fails on drift between a specification and its source. Every catalog item is classified `balsa-addition`, `balsa-composition` or `balsa-alternative`, and an alternative must name the upstream item it stands in for.

  Fixes: `balsa docs` and `balsa info --markdown` crashed for 30 of 88 items whose contracts omitted optional arrays; `design-system create` and `palette create` wrote stylesheets without importing them, leaving an unstyled application while reporting success; a partway installation failure recorded nothing, so a rerun could not tell an installed component from a missing one; malformed `rgb()` input produced `NaN` channels instead of `undefined` in ColorPicker and GradientBackground; installed source did not type-check under `noUncheckedIndexedAccess`; and 42 single-word components failed `vue/multi-word-component-names` in a create-vue project, now satisfied by an explicit `defineOptions` name with filenames and imports unchanged. Published registry payloads no longer embed CRLF, so the output no longer depends on the machine that built it. ColorPicker moves to 0.1.1, Select to 0.1.1, GradientBackground to 0.2.1; every other item version is unchanged.

## 0.3.0

- Released `balsa-ui@0.3.0`. Breaking: GradientBackground's `ribbonDensity` prop and config field are renamed `patternDensity`, now that the value is a generic repeat count rather than a ribbon count; the `void-ribbon`, `black-silk`, `chrome-sweep`, `palette-flow`, `topographic` and `crystal-facet` presets are removed; and palette color mode is reached through `color-mode` instead of by naming a preset. Saved configurations keep working -- schema one and two both migrate into schema three, carrying `ribbonDensity` across to `patternDensity` -- and the `balsa background create` CLI contract is unchanged. The release adds six pattern generators (ribbon, radial, conic, blobs, contour, cellular) and seven post-effects (ASCII, halftone, dots, wave lines, ordered dither, crosshatch) rendered through a second pass, three new presets, and rebuilds Background Studio as Gradient Studio at `/tools/gradient-studio`. GradientBackground moves to item version 0.2.0.

## 0.2.0

- Released `balsa-ui@0.2.0`. Breaking: the global Material Design icon font is replaced by tree-shaken `@lucide/vue` components behind a public Icon primitive, so every icon API now takes a typed component instead of a name string; Charts is rebuilt on `@unovis/vue`/`@unovis/ts` in place of Chart.js and vue-chartjs; Carousel drops its Embla dependency for a Balsa-owned engine with the same public API; and the Borders recipe vocabulary moved from None/Subtle/Strong to None/Soft/Medium/Strong. The release also adds the Design System Studio with a deterministic OKLCh palette generator and single-slot customization, 30 installable application compositions plus the public ApplicationCard, the `neutral` ActionColor, PropertySelect, the soft Button variant and the `2xl` size, `balsa design-system create`, a refactored install CLI, and a global typography hierarchy pass.

## 0.1.3

- Released `balsa-ui@0.1.3` with the compact-first density system: smaller application headings, controls, fields, overlays, navigation, tables, theme radii, and responsive gutters; all built-in themes now default to Compact, and the Routemark template follows the same tighter hierarchy.

## 0.1.2

- Released `balsa-ui@0.1.2` with the first controlled Northstar benchmark optimizations: compact `llms.txt` now mandates install/search/add before implementation and delegates the full component listing to `llms-full.txt`; consumer guidance uses CLI search before catalog loading and treats specifications as sufficient for composition. Starter synchronization now pulls the current independent palette contract, keeps standard Tailwind colors available, activates an explicit Light palette, and generates Latin application fonts plus the complete MDI class map with WOFF2-only assets.

## 0.1.1

- Published `balsa-ui@0.1.1` through token-free trusted publishing after cutting the production and distribution surface over to `balsa-ui.com`, including npm metadata, CLI agent links, registry configuration, schemas, generated agent documentation, repository exports, route-aware canonical/social metadata, `robots.txt`, and a generated component sitemap.

## 0.1.0

- Published `balsa-ui@0.1.0` to npm on the `latest` channel, verified the installed CLI against all 56 component contracts, and created the matching public `v0.1.0` GitHub prerelease.
