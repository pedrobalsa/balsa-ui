# Icon

Icon is Balsa's tree-shaken Lucide rendering primitive. Import each symbol directly from `@lucide/vue`, then pass the component itself. The primitive standardizes `currentColor`, absolute stroke width, five finite sizes, and accessibility semantics without loading a dynamic icon map.

```vue
<script setup lang="ts">
import { CircleHelp, Search } from "@lucide/vue";
import Icon from "@/components/ui/Icon.vue";
</script>

<template>
  <Icon :icon="Search" size="md" />
  <Icon :icon="CircleHelp" label="Help" size="lg" :stroke-width="1.5" />
</template>
```

Without `label`, Icon is decorative (`aria-hidden="true"`). With `label`, it becomes a named image. Icon-only buttons still need an accessible name on the button, while their nested icon normally stays decorative.

## Migrating from MDI

Remove `@mdi/font`, its global stylesheet import, and any generated `balsa-icons.css`. Replace class strings with individually imported components and bind them:

```vue
<script setup lang="ts">
import { Plus } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
</script>

<template>
  <Button :prefix-icon="Plus">Create project</Button>
  <Button shape="fab" :prefix-icon="Plus" aria-label="Create project" />
</template>
```

Data contracts also hold components: `{ id: "create", label: "Create", icon: Plus }`. There is intentionally no string compatibility adapter or complete dynamic Lucide map.
