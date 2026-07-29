# Balsa UI contributor guide

- Start with `.balsa/catalog-index.json`, then read the selected `specs/components/<name>.json` and canonical source.
- Edit canonical files under `src/`; never directly edit generated `registry/vue`, `public/r`, starter component/style copies, or smoke-fixture component/style copies.
- Use Vue 3 `<script setup lang="ts">`, strict typed APIs, semantic Balsa tokens, existing primitives, and accessible native behavior.
- Keep source, specification, registry metadata, Markdown documentation, focused tests, and changelog aligned.
- Preserve local changes and inspect `git diff` before handoff.
- Run `npm run check:changed` for ordinary work and `npm run check` for release or distribution integration.
