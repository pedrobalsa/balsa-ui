<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import Charts from "../ui/Charts.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface CompositionChartSeries {
  label: string;
  data: readonly number[];
  color?: CompositionPaletteColor;
}

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; delta?: string; labels?: readonly string[]; series?: readonly CompositionChartSeries[] }>(), {
  title: "Analytics", description: "418.2K visitors", delta: "+10%", labels: () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  series: () => [{ label: "Visitors", data: [42, 68, 54, 81, 65, 88], color: "primary" }],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="analytics-chart">
    <template #action><Badge color="accent" variant="soft">{{ props.delta }}</Badge></template>
    <Charts title="Visitor trend" :labels="props.labels" :series="props.series" type="line" :height="220" />
  </CompositionRoot>
</template>
