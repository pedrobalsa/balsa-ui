# Radio Group

Radio Group presents one labelled set of mutually exclusive choices with native radio semantics. Its default layout is `column`; wrapping `row` and descriptive `cards` remain available. All layouts share the same model, visible legend, Arrow-key selection, required behavior, and Balsa form feedback.

Options are typed as `{ value, label, description?, disabled? }`. The `color` prop accepts every `SemanticColor` role and defaults to `primary`, applying to the checked indicator and selected cards. Validation feedback retains precedence. The visually customized indicator leaves the native input in control of focus and form behavior. Install with `npx balsa-ui@latest add radio-group`.

Canonical source: `src/components/ui/RadioGroup.vue`; interactive documentation: `/docs/components/radio-group`; contract: `specs/components/radio-group.json`.
