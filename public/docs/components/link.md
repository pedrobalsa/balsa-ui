# Link

Link supports Tailwind-style `rounded` values from `none` through `full` alongside its existing three size presets.

Use Link for navigation and Button for in-place actions. Link defaults to the semantic `text` presentation; choose `solid` or `outline` only when navigation needs deliberate action emphasis. It supports semantic `ActionColor` intent, three sizes, component-valued Lucide icons, and safe external-link behavior. Install with `npx balsa-ui@latest add link`. Canonical source: `src/components/ui/Link.vue`; interactive documentation: `/docs/components/link`; contract: `specs/components/link.json`.

Link inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for a local override. In Glassmorphism, the outline presentation shares the translucent raised-material body, semantic glass rim, and denser interaction states used by outline Buttons.

Consumer root classes and styles are merged after Link defaults, so normal layout, sizing, typography, and radius utilities can customize the anchor without important modifiers.

Link emits `navigate(item, event)` without cancelling the native click. `item` is a normalized `NavigationLink` using `label` (or `href` when no label is supplied) as its title, and `event` is the original `MouseEvent`. A router can prevent and handle unmodified internal clicks while new-tab gestures and external links keep native anchor behavior.
