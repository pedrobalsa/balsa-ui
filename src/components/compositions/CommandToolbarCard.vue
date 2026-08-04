<script setup lang="ts">
import { Copy, Plus, RefreshCw, Share2 } from "@lucide/vue";
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
  title: "Quick actions", description: "Start common workspace tasks from one place.", actions: () => [
    { id: "copy", label: "Copy selection", description: "Duplicate the active content.", icon: Copy, shortcut: ["Ctrl", "C"] },
    { id: "share", label: "Share workspace", description: "Invite people to collaborate.", icon: Share2, shortcut: ["S"] },
    { id: "refresh", label: "Refresh data", description: "Sync the latest workspace state.", icon: RefreshCw, shortcut: ["R"] },
    { id: "add", label: "Create resource", description: "Start a new workspace item.", icon: Plus, shortcut: ["Ctrl", "K"] },
  ],
});
const emit = defineEmits<{ action: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="command-toolbar">
    <ul class="grid gap-2" role="list">
      <li v-for="action in props.actions" :key="action.id" class="min-w-0">
        <Button
          variant="soft"
          color="secondary"
          class="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
          :disabled="action.disabled"
          @click="emit('action', action.id)"
        >
          <span class="grid size-9 shrink-0 place-items-center rounded-balsa-control bg-balsa-muted text-balsa-foreground" aria-hidden="true">
            <Icon :icon="action.icon" size="md" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block truncate text-sm font-medium">{{ action.label }}</strong>
            <span v-if="action.description" class="mt-0.5 block truncate text-xs font-normal text-balsa-muted-foreground">{{ action.description }}</span>
          </span>
          <Kbd v-if="action.shortcut" :keys="action.shortcut" size="sm" />
        </Button>
      </li>
    </ul>
  </CompositionRoot>
</template>
