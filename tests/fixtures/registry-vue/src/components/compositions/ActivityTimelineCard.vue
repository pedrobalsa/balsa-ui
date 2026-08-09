<script setup lang="ts">
import Avatar from "../ui/Avatar.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ActivityEvent { id: string; actor: string; initials: string; action: string; target: string; time: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; events?: readonly ActivityEvent[] }>(), {
  // A timeline earns a tall tile by showing a run of events: the connecting
  // rule between them is the point, and two entries do not make a run.
  title: "Recent activity", description: "Changes across this workspace.", events: () => [
    { id: "1", actor: "Ada Lovelace", initials: "AL", action: "deployed", target: "Atlas to production", time: "8 minutes ago" },
    { id: "2", actor: "Grace Hopper", initials: "GH", action: "updated", target: "environment variables", time: "42 minutes ago" },
    { id: "3", actor: "Barbara Liskov", initials: "BL", action: "promoted", target: "Relay to preview", time: "2 hours ago" },
    { id: "4", actor: "Margaret Hamilton", initials: "MH", action: "invited", target: "two collaborators", time: "Yesterday" },
    { id: "5", actor: "Katherine Johnson", initials: "KJ", action: "archived", target: "the Nova sandbox", time: "Yesterday" },
    { id: "6", actor: "Radia Perlman", initials: "RP", action: "rotated", target: "the deploy key", time: "2 days ago" },
    { id: "7", actor: "Jean Bartik", initials: "JB", action: "connected", target: "a preview domain", time: "3 days ago" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="activity-timeline">
    <ol class="relative grid flex-1 content-between gap-balsa-xl before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-balsa-border">
      <li v-for="event in props.events" :key="event.id" class="relative flex gap-balsa-md"><Avatar :label="event.actor" :fallback="event.initials" size="sm" class="z-10" /><p class="min-w-0 pt-balsa-3xs text-sm"><strong class="font-medium">{{ event.actor }}</strong> {{ event.action }} <span class="font-medium">{{ event.target }}</span><span class="mt-balsa-3xs block text-xs text-balsa-muted-foreground">{{ event.time }}</span></p></li>
    </ol>
  </CompositionRoot>
</template>
