<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import type { ThemeInput } from "./theme";
import type { SemanticColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerSpeed = "slow" | "normal" | "fast";
export type SpinnerLabelPosition = "hidden" | "right" | "bottom";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    label?: string;
    labelPosition?: SpinnerLabelPosition;
    color?: SemanticColor;
    size?: SpinnerSize;
    speed?: SpinnerSpeed;
    theme?: ThemeInput;
  }>(),
  {
    label: "Loading",
    labelPosition: "hidden",
    color: "info",
    speed: "normal",
  },
);
const { props, theme } = useResolvedThemeProps(
  "spinner",
  "controls",
  rawProps,
  { size: "md" } as const,
);

const attrs = useAttrs();
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const visibleLabel = computed(() => props.labelPosition !== "hidden");

const colorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "text-balsa-primary",
  secondary: "text-balsa-secondary",
  accent: "text-balsa-accent",
  destructive: "text-balsa-destructive",
  success: "text-balsa-success",
  warning: "text-balsa-warning",
  info: "text-balsa-info",
};
const sizeClasses: Readonly<
  Record<SpinnerSize, { ring: string[]; border: string; label: string }>
> = {
  xs: { ring: ["size-3.5"], border: "border-2", label: "text-xs" },
  sm: { ring: ["size-5"], border: "border-2", label: "text-sm" },
  md: { ring: ["size-7"], border: "border-[3px]", label: "text-sm" },
  lg: { ring: ["size-10"], border: "border-4", label: "text-base" },
  xl: { ring: ["size-14"], border: "border-[5px]", label: "text-lg" },
};
const speedClasses: Readonly<Record<SpinnerSpeed, string>> = {
  slow: "[animation-duration:1.4s]",
  normal: "[animation-duration:0.9s]",
  fast: "[animation-duration:0.55s]",
};

const classes = computed(() =>
  mergeClasses(
    "inline-flex w-fit items-center font-balsa-body",
    props.labelPosition === "bottom" ? "flex-col gap-2" : "flex-row gap-2.5",
    colorClasses[props.color],
    attrs.class,
  ),
);
const ringClasses = computed(() =>
  mergeClasses(
    "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent motion-reduce:animate-none",
    sizeClasses[props.size].ring,
    sizeClasses[props.size].border,
    speedClasses[props.speed],
  ),
);
const labelClasses = computed(() => [
  "font-bold text-balsa-foreground",
  sizeClasses[props.size].label,
]);
</script>

<template>
  <span
    v-bind="rootAttrs"
    data-balsa="spinner"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-color="props.color"
    :data-size="props.size"
    :data-speed="props.speed"
    :data-label-position="props.labelPosition"
    role="status"
    aria-live="polite"
    :aria-label="props.label"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <span data-balsa="spinner-ring" :class="ringClasses" aria-hidden="true"></span>
    <span v-if="visibleLabel" :class="labelClasses" aria-hidden="true">
      {{ props.label }}
    </span>
  </span>
</template>
