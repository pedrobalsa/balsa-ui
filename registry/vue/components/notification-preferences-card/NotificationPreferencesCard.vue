<script setup lang="ts">
import { reactive } from "vue";
import Switch from "../ui/Switch.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface NotificationPreference { id: string; label: string; description: string; enabled: boolean }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly NotificationPreference[] }>(), {
  title: "Notification preferences", description: "Choose which updates should reach you.", items: () => [
    { id: "reports", label: "Monthly reports", description: "Balance and performance summaries.", enabled: true },
    { id: "security", label: "Security alerts", description: "New devices and sensitive account changes.", enabled: true },
    { id: "product", label: "Product updates", description: "Occasional feature announcements.", enabled: false },
  ],
});
const emit = defineEmits<{ change: [id: string, enabled: boolean] }>();
const values = reactive(Object.fromEntries(props.items.map((item) => [item.id, item.enabled])) as Record<string, boolean>);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="notification-preferences">
    <div class="divide-y divide-balsa-border">
      <div v-for="item in props.items" :key="item.id" class="py-4 first:pt-0 last:pb-0">
        <Switch :id="`notification-${item.id}`" v-model="values[item.id]" :label="item.label" :hint="item.description" @update:model-value="emit('change', item.id, $event)" />
      </div>
    </div>
  </CompositionRoot>
</template>
