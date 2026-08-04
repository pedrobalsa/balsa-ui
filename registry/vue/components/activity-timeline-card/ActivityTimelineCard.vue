<script setup lang="ts">
import Avatar from "../ui/Avatar.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ActivityEvent { id: string; actor: string; initials: string; action: string; target: string; time: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; events?: readonly ActivityEvent[] }>(), {
  title: "Recent activity", description: "Changes across this workspace.", events: () => [
    { id: "1", actor: "Ada Lovelace", initials: "AL", action: "deployed", target: "Atlas to production", time: "8 minutes ago" },
    { id: "2", actor: "Grace Hopper", initials: "GH", action: "updated", target: "environment variables", time: "42 minutes ago" },
    { id: "3", actor: "Margaret Hamilton", initials: "MH", action: "invited", target: "two collaborators", time: "Yesterday" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="activity-timeline">
    <ol class="relative grid gap-5 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-balsa-border">
      <li v-for="event in props.events" :key="event.id" class="relative flex gap-3"><Avatar :label="event.actor" :fallback="event.initials" size="sm" class="z-10" /><p class="min-w-0 pt-1 text-sm"><strong class="font-medium">{{ event.actor }}</strong> {{ event.action }} <span class="font-medium">{{ event.target }}</span><span class="mt-1 block text-xs text-balsa-muted-foreground">{{ event.time }}</span></p></li>
    </ol>
  </CompositionRoot>
</template>

