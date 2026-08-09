<script setup lang="ts">
import { reactive } from "vue";
import Avatar from "../ui/Avatar.vue";
import Switch from "../ui/Switch.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface Integration { id: string; name: string; detail: string; initials: string; enabled: boolean }

/**
 * Connected services, each with the one control that matters. A unit and a half
 * tall: five rows is more than a unit holds and less than two, and padding it
 * either way would be a layout decision pretending to be a design one.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  integrations?: readonly Integration[];
}>(), {
  title: "Connected services",
  description: "What this workspace is allowed to talk to.",
  integrations: () => [
    { id: "vcs", name: "Source control", detail: "Pushes trigger a preview build", initials: "SC", enabled: true },
    { id: "chat", name: "Team chat", detail: "Deploy results to #atlas-deploys", initials: "TC", enabled: true },
    { id: "pager", name: "On-call paging", detail: "Production failures only", initials: "OC", enabled: true },
    { id: "issues", name: "Issue tracker", detail: "Link deploys to the work they close", initials: "IT", enabled: false },
    { id: "warehouse", name: "Data warehouse", detail: "Nightly export of usage records", initials: "DW", enabled: false },
    { id: "status", name: "Status page", detail: "Publishes incidents automatically", initials: "SP", enabled: true },
  ],
});
const emit = defineEmits<{ toggle: [id: string, enabled: boolean] }>();
const values = reactive(
  Object.fromEntries(props.integrations.map((item) => [item.id, item.enabled])) as Record<string, boolean>,
);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="integration-list">
    <ul class="flex-1 divide-y divide-balsa-border" role="list">
      <li v-for="integration in props.integrations" :key="integration.id" class="flex items-center gap-balsa-md py-balsa-md first:pt-0 last:pb-0">
        <Avatar :label="integration.name" :fallback="integration.initials" size="sm" />
        <Switch
          :id="`integration-${integration.id}`"
          v-model="values[integration.id]"
          :label="integration.name"
          :hint="integration.detail"
          class="min-w-0 flex-1"
          @update:model-value="emit('toggle', integration.id, $event)"
        />
      </li>
    </ul>
  </CompositionRoot>
</template>
