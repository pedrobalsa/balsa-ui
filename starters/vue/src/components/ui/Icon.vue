<script setup lang="ts">
defineOptions({ name: "BalsaIcon" });

import { computed } from "vue";
import type { LucideIcon } from "@lucide/vue";

export type IconComponent = LucideIcon;
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconStrokeWidth = 1.5 | 2 | 2.5;

const props = withDefaults(defineProps<{
  icon: IconComponent;
  size?: IconSize;
  strokeWidth?: IconStrokeWidth;
  label?: string;
}>(), {
  size: "md",
  strokeWidth: 2,
});

const sizes: Readonly<Record<IconSize, number>> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const pixels = computed(() => sizes[props.size]);
</script>

<template>
  <component
    :is="props.icon"
    data-balsa="icon"
    :size="pixels"
    :stroke-width="props.strokeWidth"
    absolute-stroke-width
    color="currentColor"
    :aria-hidden="props.label ? undefined : 'true'"
    :aria-label="props.label"
    :role="props.label ? 'img' : undefined"
    focusable="false"
  />
</template>
