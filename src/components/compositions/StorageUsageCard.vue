<script setup lang="ts">
import Progress from "../ui/Progress.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * A single figure and the bar that puts it in context. Half a unit tall is the
 * honest size for one measurement: there is no second thing to say about it.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  used?: string;
  included?: string;
  percent?: number;
}>(), {
  title: "Object storage",
  used: "612 GB",
  included: "of 1 TB included",
  percent: 61,
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="storage-usage">
    <p class="flex items-baseline gap-balsa-xs">
      <strong class="text-2xl font-semibold tabular-nums">{{ props.used }}</strong>
      <span class="text-xs text-balsa-muted-foreground">{{ props.included }}</span>
    </p>
    <Progress class="mt-balsa-md" label="Storage used" :value="props.percent" color="primary" />
  </CompositionRoot>
</template>
