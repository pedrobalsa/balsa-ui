<script setup lang="ts">
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionMetric, CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; metrics?: readonly CompositionMetric[] }>(), {
  title: "Workspace metrics", description: "Current operational snapshot.", metrics: () => [
    { label: "Deployments", value: "128", detail: "+12 this week" }, { label: "Uptime", value: "99.99%", detail: "30 day window" },
    { label: "Members", value: "24", detail: "3 online" }, { label: "Regions", value: "6", detail: "Global coverage" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="metric-grid">
    <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-balsa-control bg-balsa-border">
      <div v-for="metric in props.metrics" :key="metric.label" class="bg-balsa-surface p-4">
        <dt class="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">{{ metric.label }}</dt>
        <dd class="mt-2 text-2xl font-semibold tabular-nums">{{ metric.value }}</dd>
        <p v-if="metric.detail" class="mt-1 text-xs text-balsa-muted-foreground">{{ metric.detail }}</p>
      </div>
    </dl>
  </CompositionRoot>
</template>

