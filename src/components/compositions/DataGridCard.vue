<script setup lang="ts">
import DataTable, { type DataTableColumn } from "../ui/DataTable.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

// The index signature satisfies DataTable's row constraint while the named
// fields keep the data contract typed for whoever supplies the rows.
export interface DeploymentRow {
  [column: string]: string;
  id: string;
  service: string;
  environment: string;
  version: string;
  duration: string;
  started: string;
}

/**
 * A table earns a wide tile and asks for nothing beyond it. Five columns and a
 * page of rows is the smallest honest demonstration — a three-column, three-row
 * table says nothing about how the component behaves with real data in it —
 * while a taller tile would only add empty surface under the pager.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  rows?: readonly DeploymentRow[];
}>(), {
  title: "Deployment history",
  description: "Every build that reached an environment, newest first.",
  rows: () => [
    { id: "d-108", service: "Atlas", environment: "Production", version: "4.12.0", duration: "1m 48s", started: "2 minutes ago" },
    { id: "d-107", service: "Relay", environment: "Preview", version: "2.7.3", duration: "52s", started: "18 minutes ago" },
    { id: "d-106", service: "Atlas", environment: "Preview", version: "4.12.0-rc.2", duration: "1m 31s", started: "1 hour ago" },
    { id: "d-105", service: "Harbor", environment: "Production", version: "1.9.8", duration: "3m 04s", started: "3 hours ago" },
    { id: "d-104", service: "Nova", environment: "Development", version: "0.4.1", duration: "41s", started: "5 hours ago" },
    { id: "d-103", service: "Relay", environment: "Production", version: "2.7.2", duration: "58s", started: "Yesterday" },
    { id: "d-102", service: "Quill", environment: "Preview", version: "3.0.0-beta.4", duration: "2m 12s", started: "Yesterday" },
    { id: "d-101", service: "Atlas", environment: "Production", version: "4.11.6", duration: "1m 44s", started: "2 days ago" },
    { id: "d-100", service: "Harbor", environment: "Development", version: "1.9.7", duration: "37s", started: "2 days ago" },
  ],
});
const emit = defineEmits<{ inspect: [id: string] }>();

const columns: readonly DataTableColumn<DeploymentRow>[] = [
  { id: "service", label: "Service", key: "service", sortable: true },
  { id: "environment", label: "Environment", key: "environment", sortable: true, filterable: true },
  { id: "version", label: "Version", key: "version" },
  { id: "duration", label: "Duration", key: "duration", align: "right", sortable: true },
  { id: "started", label: "Started", key: "started", align: "right" },
];
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="data-grid">
    <DataTable
      id="deployment-history"
      caption="Deployment history"
      :columns="columns"
      :data="props.rows"
      row-key="id"
      selection="multiple"
      :page-size="4"
      striped
      class="flex min-h-0 flex-1 flex-col [&>[data-balsa=table]]:min-h-0 [&>[data-balsa=table]]:flex-1 [&_table]:h-full"
      @row-select="(row: DeploymentRow) => emit('inspect', row.id)"
    />
  </CompositionRoot>
</template>
