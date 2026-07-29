# Toast

Toast presents transient, non-blocking feedback through a declarative item model and a viewport-level host. `ToastViewport` teleports its bounded stack outside clipping ancestors, preserves the nearest theme and palette, adapts to narrow viewports, manages timed or sticky items, pauses timeouts during hover, focus, window blur, and hidden documents, and dismisses the newest eligible item with Escape without moving focus. New and departing items animate toward the corresponding top or bottom stack edge.

Each `ToastItem` has a stable id, visible title, optional description, a primary-by-default `SemanticColor`, four typed materials, three sizes, shared `Rounded` geometry, a default or custom MDI icon, an optional action, duration or sticky behavior, and a close policy. Non-destructive items use polite status semantics; destructive items use assertive alert semantics. Install both public parts with `npx balsa-ui@latest add toast`.

Canonical sources: `src/components/ui/Toast.vue` and `src/components/ui/ToastViewport.vue`; interactive documentation: `/docs/components/toast`; contract: `specs/components/toast.json`.
