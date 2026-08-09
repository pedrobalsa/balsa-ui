<script setup lang="ts">
import Icon from "./Icon.vue";
import { useChart } from "./chart";

export interface ChartTooltipItem { key: string; value: string }
defineProps<{ label?: string; items: readonly ChartTooltipItem[] }>();
const chart = useChart();
</script>

<template>
  <div data-balsa="chart-tooltip-content" class="min-w-36 rounded-balsa-control border bg-balsa-chart-tooltip p-balsa-sm text-xs text-balsa-chart-tooltip-foreground shadow-balsa-overlay">
    <p v-if="label" class="mb-balsa-xs font-medium text-balsa-muted-foreground">{{ label }}</p>
    <div v-for="item in items" :key="item.key" class="flex items-center gap-balsa-xs py-balsa-4xs">
      <Icon v-if="chart.config[item.key]?.icon" :icon="chart.config[item.key]!.icon!" size="xs" />
      <span v-else class="h-2 w-2 rounded-full" :style="{ backgroundColor: chart.colors.value[item.key] }" aria-hidden="true" />
      <span class="text-balsa-muted-foreground">{{ chart.config[item.key]?.label ?? item.key }}</span>
      <span class="ml-auto font-mono font-semibold tabular-nums">{{ item.value }}</span>
    </div>
  </div>
</template>
