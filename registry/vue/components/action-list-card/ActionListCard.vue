<script setup lang="ts">
import { ArrowLeftRight, CalendarDays, ChevronRight, Circle, Gauge } from "@lucide/vue";
import Icon, { type IconComponent } from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ActionListItem { id: string; label: string; description?: string; icon?: IconComponent; meta?: string; disabled?: boolean }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly ActionListItem[] }>(), {
  title: "Payments", description: "Manage recurring money movement.", items: () => [
    { id: "limit", label: "Change transfer limit", description: "Adjust how much you can send.", icon: Gauge, meta: "Daily" },
    { id: "scheduled", label: "Scheduled transfers", description: "Set up a transfer for a later date.", icon: CalendarDays },
    { id: "debits", label: "Direct debits", description: "Review authorized merchants.", icon: ArrowLeftRight },
  ],
});
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="action-list">
    <nav :aria-label="props.title" class="grid gap-2">
      <button v-for="item in props.items" :key="item.id" type="button" :disabled="item.disabled" class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-balsa-control bg-balsa-muted p-3 text-left disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring" @click="emit('select', item.id)">
        <Icon :icon="item.icon || Circle" size="md" />
        <span class="min-w-0"><strong class="block text-sm font-medium">{{ item.label }}</strong><span v-if="item.description" class="mt-0.5 block text-sm text-balsa-muted-foreground">{{ item.description }}</span></span>
        <span class="flex items-center gap-2 text-xs text-balsa-muted-foreground"><span v-if="item.meta">{{ item.meta }}</span><Icon :icon="ChevronRight" size="sm" /></span>
      </button>
    </nav>
  </CompositionRoot>
</template>
