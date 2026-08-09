<script setup lang="ts">
import Charts from "../ui/Charts.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface UsageSeries { label: string; data: readonly number[]; color?: CompositionPaletteColor }

/**
 * Stacked bars, because the question is where the spend went rather than how it
 * moved. Wide for the same reason the line chart is: a month per bar needs the
 * room, and squeezed into one unit the categories stop being comparable.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  labels?: readonly string[];
  series?: readonly UsageSeries[];
}>(), {
  title: "Where the spend goes",
  description: "Billed usage by category, last twelve months.",
  labels: () => ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  series: () => [
    { label: "Compute", data: [96, 104, 112, 119, 108, 121, 128, 141, 137, 162, 158, 174], color: "primary" },
    { label: "Bandwidth", data: [41, 46, 52, 63, 49, 58, 64, 71, 88, 74, 92, 96], color: "secondary" },
    { label: "Storage", data: [14, 15, 17, 18, 19, 21, 22, 24, 27, 29, 31, 35], color: "accent" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="usage-breakdown">
    <p class="flex items-baseline gap-balsa-xs">
      <strong class="text-2xl font-semibold tabular-nums">$305</strong>
      <span class="text-xs text-balsa-muted-foreground">this month, across compute, bandwidth and storage</span>
    </p>
    <div class="mt-balsa-md min-h-0">
      <Charts
        title="Monthly cost by category"
        :labels="props.labels"
        :series="props.series"
        type="bar"
        bar-mode="stacked"
        :show-legend="false"
        :show-x-axis="false"
        :show-y-axis="false"
        :show-grid="false"
        :show-caption="false"
        :height="160"
      />
    </div>
  </CompositionRoot>
</template>
