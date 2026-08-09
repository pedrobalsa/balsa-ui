<script setup lang="ts">
import { Boxes, GitBranch, Rocket, ScrollText } from "@lucide/vue";
import CommandList from "../ui/CommandList.vue";
import type { CommandGroup, CommandItem } from "../ui/command";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * The palette shown open and in place rather than behind a shortcut, because a
 * gallery tile cannot demonstrate a keystroke. Grouped results need the height:
 * the whole argument for a palette is that it reaches everything at once.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  groups?: readonly CommandGroup[];
  recents?: readonly { id: string; label: string; detail: string }[];
}>(), {
  recents: () => [
    { id: "atlas-logs", label: "Atlas production logs", detail: "8 minutes ago" },
    { id: "relay-preview", label: "Relay preview branch", detail: "1 hour ago" },
    { id: "members", label: "Members and roles", detail: "Yesterday" },
  ],
  title: "Jump to anything",
  description: "One search across projects, people and settings.",
  groups: () => [
    {
      id: "projects", label: "Projects", items: [
        { id: "atlas", label: "Atlas", icon: Boxes, shortcut: "1" },
        { id: "relay", label: "Relay", icon: Boxes, shortcut: "2" },
        { id: "harbor", label: "Harbor", icon: Boxes, shortcut: "3" },
      ],
    },
    {
      id: "actions", label: "Actions", items: [
        { id: "deploy", label: "Deploy the current commit", icon: Rocket },
        { id: "branch", label: "Open a preview branch", icon: GitBranch },
        { id: "logs", label: "Stream production logs", icon: ScrollText },
      ],
    },
  ],
});
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="command-palette">
    <CommandList
      id="workspace-palette"
      label="Search the workspace"
      placeholder="Search projects, actions and people"
      :groups="props.groups"
      @select="(item: CommandItem) => emit('select', item.id)"
    />
    <!--
      The palette caps its own result list, so the tile is finished with what a
      palette is actually for: getting back to where you just were. Recents sit
      outside the search rather than inside it, because they are not results.
    -->
    <section class="mt-balsa-lg flex flex-1 flex-col justify-end">
      <p class="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">Recent</p>
      <ul class="mt-balsa-xs divide-y divide-balsa-border" role="list">
        <li v-for="entry in props.recents" :key="entry.id">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-balsa-md py-balsa-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring"
            @click="emit('select', entry.id)"
          >
            <span class="min-w-0 truncate text-sm">{{ entry.label }}</span>
            <span class="shrink-0 text-xs text-balsa-muted-foreground">{{ entry.detail }}</span>
          </button>
        </li>
      </ul>
    </section>
  </CompositionRoot>
</template>
