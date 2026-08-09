<script setup lang="ts">
import { Download, KeyRound, Layers, Rocket, ScrollText, Search, Undo2, UserPlus } from "@lucide/vue";
import Button from "../ui/Button.vue";
import Kbd from "../ui/Kbd.vue";
import Icon, { type IconComponent } from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ToolbarAction {
  id: string;
  label: string;
  description?: string;
  icon: IconComponent;
  shortcut?: readonly string[];
  disabled?: boolean;
}
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; actions?: readonly ToolbarAction[] }>(), {
  title: "Workspace commands", description: "Everything you can trigger without leaving this view.", actions: () => [
    { id: "deploy", label: "Deploy Atlas", description: "Ship the current commit to production.", icon: Rocket, shortcut: ["Ctrl", "D"] },
    { id: "logs", label: "Open logs", description: "Stream the last hour of output.", icon: ScrollText, shortcut: ["L"] },
    { id: "rollback", label: "Roll back", description: "Return production to the previous build.", icon: Undo2, shortcut: ["Ctrl", "Z"] },
    { id: "environment", label: "New environment", description: "Branch a preview from production.", icon: Layers, shortcut: ["E"] },
    { id: "invite", label: "Invite collaborator", description: "Send an invitation by email.", icon: UserPlus, shortcut: ["I"] },
    { id: "key", label: "Rotate deploy key", description: "Replace the key every runner uses.", icon: KeyRound, shortcut: ["Ctrl", "R"] },
    { id: "search", label: "Search everything", description: "Projects, members, and settings.", icon: Search, shortcut: ["Ctrl", "K"] },
    { id: "export", label: "Export audit log", description: "Download the last 90 days as CSV.", icon: Download, shortcut: ["Ctrl", "E"] },
  ],
});
const emit = defineEmits<{ action: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="command-toolbar">
    <ul class="grid flex-1 content-between gap-balsa-xs" role="list">
      <li v-for="action in props.actions" :key="action.id" class="min-w-0">
        <Button
          variant="soft"
          color="secondary"
          class="h-auto w-full justify-start gap-balsa-md px-balsa-md py-balsa-md text-left"
          :disabled="action.disabled"
          @click="emit('action', action.id)"
        >
          <span class="grid size-9 shrink-0 place-items-center rounded-balsa-control bg-balsa-muted text-balsa-foreground" aria-hidden="true">
            <Icon :icon="action.icon" size="md" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block truncate text-sm font-medium">{{ action.label }}</strong>
            <span v-if="action.description" class="mt-balsa-4xs block truncate text-xs font-normal text-balsa-muted-foreground">{{ action.description }}</span>
          </span>
          <Kbd v-if="action.shortcut" :keys="action.shortcut" size="sm" />
        </Button>
      </li>
    </ul>
  </CompositionRoot>
</template>
