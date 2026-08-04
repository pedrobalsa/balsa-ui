<script setup lang="ts">
import { computed } from "vue";
import Charts, { type ChartSeries } from "../ui/Charts.vue";
import Progress from "../ui/Progress.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionMetric, CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; values?: readonly number[]; metrics?: readonly CompositionMetric[]; progress?: number }>(), {
  title: "Power usage", description: "Whole home", values: () => [24, 62, 70, 52, 78, 66, 88, 72], progress: 85,
  metrics: () => [{ label: "Currently using", value: "3.4 kW" }, { label: "Solar generation", value: "+1.2 kW" }],
});
const chartLabels = computed(() => props.values.map((_, index) => `${6 + index * 2}${index < 3 ? "a" : "p"}`));
const chartSeries = computed<readonly ChartSeries[]>(() => [{ label: "Power usage", data: props.values, color: "primary" }]);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="usage-summary">
    <Charts title="Usage by time" type="bar" :labels="chartLabels" :series="chartSeries" :height="160" :show-legend="false" :show-y-axis="false" />
    <dl class="mt-4 grid grid-cols-2 gap-4">
      <div v-for="metric in props.metrics" :key="metric.label"><dt class="text-sm text-balsa-muted-foreground">{{ metric.label }}</dt><dd class="mt-1 text-xl font-semibold tabular-nums">{{ metric.value }}</dd></div>
    </dl>
    <Progress class="mt-5" label="Battery level" :value="props.progress" color="primary" show-value />
  </CompositionRoot>
</template>
