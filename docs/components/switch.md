# Switch

Use Switch for an immediately applied boolean setting. It keeps the former Balsa Toggle form-control behavior under the conventional public name, renders a native checkbox with `role="switch"`, and associates its visible label and optional hint through `id` and `aria-describedby`. Install with `npx balsa-ui@latest add switch`. Canonical source: `src/components/ui/Switch.vue`; interactive documentation: `/docs/components/switch`; contract: `specs/components/switch.json`.

Switch exposes `outline`, `surface` (default), `soft`, and `glass` materials for its unchecked track. Checked state always uses the semantic primary surface and paired foreground. It supports `sm`, `md`, and `lg` track sizes plus Tailwind-style `rounded` values from `none` through `full`.

Use `required` only when the switch participates in form validation. `name` is forwarded to the native checkbox for form submission. Disabled switches are removed from interaction while keeping the current value visible.

Switch inherits the nearest `data-theme` and accepts `theme?: ThemeInput` for an independent Modern Flat, Brutalism, or Glassmorphism override.

Migration from releases before this rename:

```vue
<script setup lang="ts">
-import Toggle from "@/components/ui/Toggle.vue";
+import Switch from "@/components/ui/Switch.vue";
</script>

<template>
-  <Toggle id="setting" v-model="enabled" label="Setting placeholder" />
+  <Switch id="setting" v-model="enabled" label="Setting placeholder" />
</template>
```

Install `switch` and remove the old boolean `toggle` item only after reviewing local customizations. The `toggle` registry name now installs the pressed-state action component, so it is not a compatibility alias.
