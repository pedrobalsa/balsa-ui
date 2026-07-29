# Balsa Vue starter agent rules

- Before writing common UI, run `npx balsa-ui@latest search "<intent>"`; use `.balsa/catalog-index.json` only when CLI search is unavailable.
- Read only the selected `.balsa/specs/components/<name>.json`, then install missing items with `npx balsa-ui@latest add <name>` before implementation.
- Prefer installed Balsa components over rebuilding controls. The specification is sufficient for normal use; inspect component source only when changing behavior.
- Preserve local edits and never use `--force` without reviewing differences.
- Use Vue 3 `<script setup lang="ts">`, typed public APIs, semantic `balsa` color utilities for theme-aware UI, and existing accessible behavior. Standard Tailwind colors remain available for product-specific decoration.
- The starter activates the Light palette on `<html>`. Keep palette, semantic content colors, and Balsa component surfaces consistent.
- Keep labels, keyboard behavior, focus visibility, accessible names, and state announcements intact.
- Validate changes with `npm run lint`, `npm run test`, and `npm run build`.
