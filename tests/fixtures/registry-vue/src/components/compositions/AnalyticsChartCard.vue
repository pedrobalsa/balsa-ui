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
  title: "Request latency", description: "p95 across every region", delta: "-18%",
  labels: () => ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"],
  series: () => [
    { label: "p95", data: [268, 251, 244, 226, 231, 209, 198, 186], color: "primary" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="analytics-chart">
    <template #action><Badge color="accent" variant="soft">{{ props.delta }}</Badge></template>
    <p class="flex items-baseline gap-balsa-xs">
      <strong class="text-2xl font-semibold tabular-nums">186 ms</strong>
      <span class="text-xs text-balsa-muted-foreground">p95, down from 268 ms</span>
    </p>
    <div class="min-h-0">
      <Charts
        title="Milliseconds per request"
        :labels="props.labels"
        :series="props.series"
        type="area"
        :show-legend="false"
        :show-x-axis="false"
        :show-y-axis="false"
        :show-grid="false"
        :show-caption="false"
        :height="196"
      />
    </div>
  </CompositionRoot>
</template>
