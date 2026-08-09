<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import Table from "../ui/Table.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface ResourceRow { id: string; name: string; status: string; statusColor?: CompositionPaletteColor; detail: string; updated: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; rows?: readonly ResourceRow[] }>(), {
  title: "Projects", description: "Search, review, and manage shared resources.", rows: () => [
    { id: "atlas", name: "Atlas", status: "Ready", statusColor: "primary", detail: "Production", updated: "2m ago" },
    { id: "relay", name: "Relay", status: "Review", statusColor: "secondary", detail: "Preview", updated: "1h ago" },
    { id: "nova", name: "Nova", status: "Paused", detail: "Development", updated: "Yesterday" },
    { id: "quill", name: "Quill", status: "Ready", statusColor: "primary", detail: "Production", updated: "Yesterday" },
    { id: "harbor", name: "Harbor", status: "Review", statusColor: "secondary", detail: "Preview", updated: "3 days ago" },
    { id: "beacon", name: "Beacon", status: "Ready", statusColor: "primary", detail: "Production", updated: "3 days ago" },
    { id: "ferry", name: "Ferry", status: "Paused", detail: "Development", updated: "Last week" },
    { id: "kite", name: "Kite", status: "Review", statusColor: "secondary", detail: "Preview", updated: "Last week" },
  ],
});
const emit = defineEmits<{ create: []; select: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="resource-table">
    <template #action><Button size="sm" @click="emit('create')">New project</Button></template>
    <Table caption="Projects" hover rounded="none" class="w-full flex-1 [&_table]:h-full">
      <template #header><thead><tr><th scope="col">Project</th><th scope="col">Status</th><th scope="col">Environment</th><th scope="col">Updated</th></tr></thead></template>
      <tbody><tr v-for="row in props.rows" :key="row.id" class="cursor-pointer" @click="emit('select', row.id)"><th scope="row">{{ row.name }}</th><td><Badge :color="row.statusColor" variant="soft">{{ row.status }}</Badge></td><td>{{ row.detail }}</td><td class="text-balsa-muted-foreground">{{ row.updated }}</td></tr></tbody>
    </Table>
  </CompositionRoot>
</template>
