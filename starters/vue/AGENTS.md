# Balsa Vue starter agent rules

- Start with `.balsa/catalog-index.json`; read `.balsa/catalog.json` only for dependency, token, documentation, or source metadata.
- Read only the selected `.balsa/specs/components/<name>.json` before creating UI. Prefer installed Balsa components over rebuilding controls.
- Install missing items with `npx balsa-ui@latest add <name>` and preserve local edits. Never use `--force` without reviewing differences.
- Use Vue 3 `<script setup lang="ts">`, typed public APIs, semantic Balsa tokens, and existing accessible behavior.
- Keep labels, keyboard behavior, focus visibility, accessible names, and state announcements intact.
- Validate changes with `npm run lint`, `npm run test`, and `npm run build`.
