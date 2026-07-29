<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { ThemeInput } from "./theme";
import type { SemanticColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";

export type ProgressVariant = "solid" | "soft" | "striped";
export type ProgressSize = "sm" | "md" | "lg";
export type ProgressState = "loading" | "complete" | "indeterminate";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    label: string;
    value?: number | null;
    max?: number;
    showValue?: boolean;
    formatValue?: (value: number, max: number) => string;
    indeterminateLabel?: string;
    variant?: ProgressVariant;
    color?: SemanticColor;
    size?: ProgressSize;
    rounded?: Rounded;
    theme?: ThemeInput;
  }>(),
  {
    value: null,
    max: 100,
    showValue: true,
    indeterminateLabel: "In progress",
    color: "info",
  },
);
const { props, theme } = useResolvedThemeProps(
  "progress",
  "controls",
  rawProps,
  { variant: "solid", size: "md", rounded: "full" } as const,
);

const attrs = useAttrs();
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const safeMax = computed(() =>
  Number.isFinite(props.max) && props.max > 0 ? props.max : 100,
);
const determinate = computed(
  () => props.value !== null && Number.isFinite(props.value),
);
const normalizedValue = computed(() =>
  determinate.value
    ? Math.min(safeMax.value, Math.max(0, Number(props.value)))
    : null,
);
const percentage = computed(() =>
  normalizedValue.value === null
    ? 0
    : (normalizedValue.value / safeMax.value) * 100,
);
const state = computed<ProgressState>(() => {
  if (!determinate.value) return "indeterminate";
  return percentage.value >= 100 ? "complete" : "loading";
});
const valueText = computed(() => {
  if (normalizedValue.value === null) return props.indeterminateLabel;
  return props.formatValue
    ? props.formatValue(normalizedValue.value, safeMax.value)
    : `${Math.round(percentage.value)}%`;
});
const indicatorStyle = computed<Record<string, string>>(() => ({
  width: state.value === "indeterminate" ? "40%" : `${percentage.value}%`,
}));

const trackColorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "bg-balsa-primary/15",
  secondary: "bg-balsa-secondary/15",
  accent: "bg-balsa-accent/15",
  destructive: "bg-balsa-destructive/15",
  success: "bg-balsa-success/15",
  warning: "bg-balsa-warning/15",
  info: "bg-balsa-info/15",
};
const indicatorColorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "bg-balsa-primary",
  secondary: "bg-balsa-secondary",
  accent: "bg-balsa-accent",
  destructive: "bg-balsa-destructive",
  success: "bg-balsa-success",
  warning: "bg-balsa-warning",
  info: "bg-balsa-info",
};
const sizeClasses: Readonly<Record<ProgressSize, string>> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};
const labelSizeClasses: Readonly<Record<ProgressSize, string>> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};
const indicatorVariantClasses: Readonly<Record<ProgressVariant, string[]>> = {
  solid: [],
  soft: ["opacity-75"],
  striped: [],
};

const classes = computed(() =>
  mergeClasses("min-w-0 font-balsa-body", attrs.class),
);
const trackClasses = computed(() =>
  mergeClasses(
    "relative w-full overflow-hidden",
    sizeClasses[props.size],
    roundedClasses[props.rounded],
    trackColorClasses[props.color],
  ),
);
const indicatorClasses = computed(() =>
  mergeClasses(
    "relative h-full overflow-hidden transition-[width,transform] duration-300 ease-out motion-reduce:transition-none",
    roundedClasses[props.rounded],
    indicatorColorClasses[props.color],
    indicatorVariantClasses[props.variant],
  ),
);
const labelClasses = computed(() => [
  "mb-2 flex min-w-0 items-baseline justify-between gap-4",
  labelSizeClasses[props.size],
]);
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="progress"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-state="state"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <div :class="labelClasses">
      <span class="min-w-0 font-bold text-balsa-foreground">{{ props.label }}</span>
      <span
        v-if="props.showValue"
        class="shrink-0 tabular-nums text-balsa-muted-foreground"
        aria-hidden="true"
      >
        {{ valueText }}
      </span>
    </div>
    <div
      data-balsa="progress-track"
      role="progressbar"
      :aria-label="props.label"
      aria-valuemin="0"
      :aria-valuemax="safeMax"
      :aria-valuenow="normalizedValue ?? undefined"
      :aria-valuetext="valueText"
      :class="trackClasses"
    >
      <div
        data-balsa="progress-indicator"
        :data-state="state"
        :data-variant="props.variant"
        :style="indicatorStyle"
        :class="indicatorClasses"
      ></div>
    </div>
  </div>
</template>
