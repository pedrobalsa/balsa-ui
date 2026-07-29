# Pagination

Pagination moves through a finite result set with a numeric Vue model, derived page count, bounded sibling range, semantic ellipses, and labelled first, previous, next, and last actions. Use `presentation="action-labels"` for adjacent labelled actions only, or `presentation="icons"` for compact icon-only controls. Values are clamped whenever the result total changes.

Use Pagination for result sets and server-backed collections, not form progress or continuous feeds. Install with `npx balsa-ui@latest add pagination`. Canonical source: `src/components/ui/Pagination.vue`; interactive documentation: `/docs/components/pagination`; contract: `specs/components/pagination.json`.

The component provides optional edge controls and visible labels, localized action/page labels, responsive compact rendering, `sm`, `md`, and `lg` sizes, the shared `Rounded` scale, disabled state, native button semantics, consumer class merging, and `theme?: ThemeInput`.
