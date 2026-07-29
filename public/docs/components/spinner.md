# Spinner

Spinner announces an indeterminate operation through a polite status role and a required accessible label. The label can remain visually hidden, appear to the right, or sit below the ring. Use Progress when a measurable value exists and Skeleton when pending content should preserve its final layout.

Spinner does not own overlay positioning, focus, or interaction blocking; compose those behaviors at the task surface. Install with `npx balsa-ui@latest add spinner`. Canonical source: `src/components/ui/Spinner.vue`; interactive documentation: `/docs/components/spinner`; contract: `specs/components/spinner.json`.

The component supports five sizes, slow/normal/fast motion, every `SemanticColor` with information as the loading default, reduced-motion fallback, and `theme?: ThemeInput`.
