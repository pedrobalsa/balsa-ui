# Registry directory submissions

Listing Balsa in public registry directories is the last Phase 0.4 item, and it is the only one that cannot be completed from inside this repository: each directory is a third-party repository or form that needs your GitHub account and your name on the submission. This document is the prepared payload so each submission is copy-and-paste.

Do not submit until the release the directories will point at is actually deployed. A directory entry pointing at a `registry.json` that 404s is worse than no entry.

## Prerequisites

Verify the public surface first, because every listing depends on it:

```sh
curl -sSf https://balsa-ui.com/r/registry.json | head -c 200
curl -sSf https://balsa-ui.com/r/button.json  | head -c 200
```

Both must return JSON. `registry.json` must report the same `version` as the published npm package. `npm run release:check` enforces that locally; nothing enforces that the deploy actually happened.

Then confirm a clean external project can install through the standard shadcn path:

```sh
npx shadcn-vue@latest add https://balsa-ui.com/r/button.json
```

## Canonical metadata

Reuse these values verbatim so listings stay consistent with the package and the site.

| Field | Value |
| --- | --- |
| Name | Balsa UI |
| Registry namespace | `@balsa` |
| Registry URL | `https://balsa-ui.com/r/{name}.json` |
| Registry index | `https://balsa-ui.com/r/registry.json` |
| Homepage | `https://balsa-ui.com` |
| Repository | `https://github.com/pedrobalsa/balsa-ui` |
| npm package | `balsa-ui` |
| License | MIT |
| Framework | Vue 3 |
| Styling | Tailwind CSS 4 |
| Items | 100 registry items, 95 documented components and compositions |

Short description (one line, for directory tables):

> Agent-native, open-code Vue 3 components with independent palettes, themes, and gradient backgrounds.

Long description (for a directory entry body):

> Balsa UI is an agent-native design-system layer and CLI for the shadcn-vue ecosystem. It publishes a compatible registry of Vue 3 components, compositions and blocks, plus machine-readable component contracts with exact TypeScript prop types, enumerated semantic unions and accessibility requirements, so coding agents can compose interfaces without guessing an API. Balsa items install through the shadcn CLI, or through the Balsa CLI, which additionally applies the design system and records installation provenance.

The minimal `components.json` snippet consumers using other shadcn-compatible
tooling need is below. `balsa init` writes the complete official-schema
configuration automatically and preserves an existing file.

```json
{
  "registries": {
    "@balsa": "https://balsa-ui.com/r/{name}.json"
  }
}
```

## Where to submit

Registry directories move; confirm each destination still exists and still accepts submissions before opening anything. Search for the current list with `shadcn registry directory` and `awesome shadcn` before relying on the entries below.

1. **shadcn's own registry directory** — <https://ui.shadcn.com/docs/registry>. Follow whatever submission route that page currently documents; it has previously been a form and previously a repository listing.
2. **`awesome-shadcn-ui`** — <https://github.com/birobirobiro/awesome-shadcn-ui>. Open a pull request adding one row to the registries/component-libraries table using the short description above.
3. **shadcn-vue community listings** — <https://github.com/unovue/shadcn-vue>. Check for a community or ecosystem page; a Vue-specific registry belongs there more than in the React directory.
4. **Directories that index registries automatically** — some crawl `/r/registry.json`. These need no submission but do need the deploy to be live, which is why the prerequisites above come first.

## Suggested pull-request body

```markdown
Adds Balsa UI, a Vue 3 registry for the shadcn ecosystem.

- Registry: https://balsa-ui.com/r/{name}.json
- Index: https://balsa-ui.com/r/registry.json
- Docs: https://balsa-ui.com
- Source: https://github.com/pedrobalsa/balsa-ui
- License: MIT

Balsa publishes 100 registry items compatible with `shadcn-vue build`, verified
byte-for-byte against that tool's own output. Items install with
`npx shadcn-vue@latest add https://balsa-ui.com/r/<name>.json`, or through the
Balsa CLI, which also applies the design system and records provenance.
```

## After a listing goes live

Add the destination to this file with the date it was accepted, so the next release knows what has to keep working. A directory entry is a promise that the registry URL stays stable; treat changing it as a breaking change.
