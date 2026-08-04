<script setup lang="ts">
import Avatar from "../ui/Avatar.vue";
import Badge from "../ui/Badge.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface MemberAccess { id: string; name: string; email: string; role: string; initials: string; status?: CompositionPaletteColor }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; members?: readonly MemberAccess[] }>(), {
  title: "Member access", description: "People who can use this workspace.", members: () => [
    { id: "ada", name: "Ada Lovelace", email: "ada@example.com", role: "Owner", initials: "AL", status: "accent" },
    { id: "grace", name: "Grace Hopper", email: "grace@example.com", role: "Editor", initials: "GH" },
    { id: "margaret", name: "Margaret Hamilton", email: "margaret@example.com", role: "Viewer", initials: "MH" },
  ],
});
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="member-access">
    <ul class="divide-y divide-balsa-border" role="list">
      <li v-for="member in props.members" :key="member.id">
        <button type="button" class="flex w-full items-center gap-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring" @click="emit('select', member.id)">
          <Avatar :label="member.name" :fallback="member.initials" size="sm" />
          <span class="min-w-0 flex-1"><strong class="block truncate text-sm font-medium">{{ member.name }}</strong><span class="block truncate text-xs text-balsa-muted-foreground">{{ member.email }}</span></span>
          <Badge :color="member.status" variant="soft">{{ member.role }}</Badge>
        </button>
      </li>
    </ul>
  </CompositionRoot>
</template>
