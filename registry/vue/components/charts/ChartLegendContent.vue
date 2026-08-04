<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";
import { useChart } from "./chart";

const props = withDefaults(defineProps<{ items?: readonly string[] }>(), { items: undefined });
const chart = useChart();
const keys = computed(() => props.items ?? Object.keys(chart.config));
</script>

<template>
  <ul data-balsa="chart-legend" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-balsa-chart-axis">
    <li v-for="(key, index) in keys" :key="key" class="flex items-center gap-1.5">
      <Icon v-if="chart.config[key]?.icon" :icon="chart.config[key]!.icon!" size="xs" />
      <span v-else class="h-2.5 w-2.5 rounded-[var(--balsa-chart-marker-radius)] border border-current" :style="{ backgroundColor: chart.colors.value[key], borderStyle: index % 3 === 1 ? 'dashed' : 'solid' }" aria-hidden="true" />
      <span>{{ chart.config[key]?.label ?? key }}</span>
    </li>
  </ul>
</template>
