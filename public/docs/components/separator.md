# Separator

Separator creates a horizontal or vertical boundary. It is decorative by default and therefore removed from the accessibility tree. Set `:decorative="false"` when the boundary carries document structure; the component then exposes `role="separator"`, its orientation, and an optional accessible label.

Optional label content can divide a horizontal rule at the start, center, or end. Vertical separators inherit their container height and do not render label content. Install with `npx balsa-ui@latest add separator`. Canonical source: `src/components/ui/Separator.vue`; interactive documentation: `/docs/components/separator`; contract: `specs/components/separator.json`.

The component supports solid, dashed, and dotted variants, three line thicknesses, horizontal and vertical orientation, semantic/decorative modes, and `theme?: ThemeInput`. It deliberately uses the semantic border token instead of a color prop.
