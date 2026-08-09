<script setup lang="ts">
import Avatar from "../ui/Avatar.vue";
import Badge from "../ui/Badge.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface MemberAccess { id: string; name: string; email: string; role: string; initials: string; status?: CompositionPaletteColor }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; members?: readonly MemberAccess[] }>(), {
  // A roster is the reason this composition takes a tall tile: three rows would
  // fit anywhere, and would not show how the list reads at working length.
  title: "Member access", description: "People who can use this workspace.", members: () => [
    { id: "ada", name: "Ada Lovelace", email: "ada@example.com", role: "Owner", initials: "AL", status: "accent" },
    { id: "grace", name: "Grace Hopper", email: "grace@example.com", role: "Editor", initials: "GH" },
    { id: "margaret", name: "Margaret Hamilton", email: "margaret@example.com", role: "Viewer", initials: "MH" },
    { id: "barbara", name: "Barbara Liskov", email: "barbara@example.com", role: "Editor", initials: "BL" },
    { id: "katherine", name: "Katherine Johnson", email: "katherine@example.com", role: "Editor", initials: "KJ" },
    { id: "radia", name: "Radia Perlman", email: "radia@example.com", role: "Viewer", initials: "RP" },
    { id: "jean", name: "Jean Bartik", email: "jean@example.com", role: "Viewer", initials: "JB" },
    { id: "alan", name: "Alan Turing", email: "alan@example.com", role: "Viewer", initials: "AT" },
    { id: "annie", name: "Annie Easley", email: "annie@example.com", role: "Viewer", initials: "AE" },
  ],
});
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="member-access">
    <ul class="flex flex-1 flex-col justify-between divide-y divide-balsa-border" role="list">
      <li v-for="member in props.members" :key="member.id">
        <button type="button" class="flex w-full items-center gap-balsa-md py-balsa-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring" @click="emit('select', member.id)">
          <Avatar :label="member.name" :fallback="member.initials" size="sm" />
          <span class="min-w-0 flex-1"><strong class="block truncate text-sm font-medium">{{ member.name }}</strong><span class="block truncate text-xs text-balsa-muted-foreground">{{ member.email }}</span></span>
          <Badge :color="member.status" variant="soft">{{ member.role }}</Badge>
        </button>
      </li>
    </ul>
  </CompositionRoot>
</template>
