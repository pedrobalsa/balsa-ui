# Alert

Alert communicates important feedback in normal flow or presents a focused decision through a native modal alert dialog. Inline mode defaults visible and never moves focus. Dialog mode defaults closed, enters the browser top layer, traps focus natively, prevents background interaction and scrolling, supports deliberate Escape/backdrop policies, and restores focus after close.

Use neutral, information, success, warning, or destructive status only when it matches the message meaning. The component defaults to neutral, keeps the title and description beside its icon, and provides surface, outline, soft, solid, and glass materials, three sizes, shared `Rounded` geometry, a color-specific default or custom MDI icon, dismissible behavior by default, and `persistent` for alerts that must remain until a task-specific action resolves them. Rich content and action slots and `theme?: ThemeInput` are also available. Install with `npx balsa-ui@latest add alert`.

Canonical source: `src/components/ui/Alert.vue`; interactive documentation: `/docs/components/alert`; contract: `specs/components/alert.json`.
