<script setup lang="ts">
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionMetric, CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; metrics?: readonly CompositionMetric[] }>(), {
  title: "Workspace metrics", description: "Current operational snapshot.", metrics: () => [
    { label: "Deployments", value: "128", detail: "+12 this week" }, { label: "Uptime", value: "99.99%", detail: "30 day window" },
    { label: "Members", value: "24", detail: "3 online" }, { label: "Regions", value: "6", detail: "Global coverage" },
    { label: "Build time", value: "42s", detail: "median" }, { label: "Error rate", value: "0.04%", detail: "last 24 hours" },
    { label: "Requests", value: "8.1M", detail: "this week" }, { label: "Rollbacks", value: "2", detail: "this quarter" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="metric-grid">
    <dl class="grid flex-1 grid-cols-2 gap-px sm:grid-cols-4 overflow-hidden rounded-balsa-control bg-balsa-border">
      <div v-for="metric in props.metrics" :key="metric.label" class="bg-balsa-surface p-balsa-lg">
        <dt class="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">{{ metric.label }}</dt>
        <dd class="mt-balsa-xs text-2xl font-semibold tabular-nums">{{ metric.value }}</dd>
        <p v-if="metric.detail" class="mt-balsa-3xs text-xs text-balsa-muted-foreground">{{ metric.detail }}</p>
      </div>
    </dl>
  </CompositionRoot>
</template>
