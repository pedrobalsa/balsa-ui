<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type SkeletonShape = "text" | "rect" | "circle";
export type SkeletonVariant = "muted" | "soft" | "glass";
export type SkeletonSize = "sm" | "md" | "lg";
export type SkeletonAnimation = "pulse" | "wave" | "none";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    shape?: SkeletonShape;
    variant?: SkeletonVariant;
    size?: SkeletonSize;
    rounded?: Rounded;
    animation?: SkeletonAnimation;
    lines?: number;
    theme?: ThemeInput;
  }>(),
  {
    animation: "pulse",
    lines: 1,
  },
);
const { props, theme } = useResolvedThemeProps(
  "skeleton",
  "surfaces",
  rawProps,
  { shape: "rect", variant: "muted", size: "md", rounded: "lg" } as const,
);

const attrs = useAttrs();
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const lineCount = computed(() =>
  props.shape === "text"
    ? Math.min(12, Math.max(1, Math.trunc(props.lines)))
    : 1,
);

const variantClasses: Readonly<Record<SkeletonVariant, string[]>> = {
  muted: ["bg-balsa-muted"],
  soft: ["bg-balsa-primary/15"],
  glass: ["border", "border-balsa-border/50", "bg-balsa-surface/45", "backdrop-blur-sm"],
};
const animationClasses: Readonly<Record<SkeletonAnimation, string[]>> = {
  pulse: ["animate-pulse", "motion-reduce:animate-none"],
  wave: [],
  none: [],
};
const textHeightClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "h-3",
  md: "h-4",
  lg: "h-5",
};
const rectHeightClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "h-16",
  md: "h-24",
  lg: "h-32",
};
const circleSizeClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "size-8",
  md: "size-12",
  lg: "size-16",
};
const lineGapClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "gap-2",
  md: "gap-2.5",
  lg: "gap-3",
};

const pieceClasses = computed(() =>
  mergeClasses(
    "relative overflow-hidden",
    variantClasses[props.variant],
    animationClasses[props.animation],
  ),
);
const classes = computed(() =>
  mergeClasses(
    props.shape === "text"
      ? ["flex w-full flex-col", lineGapClasses[props.size]]
      : [
          "block shrink-0",
          pieceClasses.value,
          props.shape === "circle"
            ? [circleSizeClasses[props.size], "rounded-full"]
            : [rectHeightClasses[props.size], "w-full", roundedClasses[props.rounded]],
        ],
    attrs.class,
  ),
);

function lineClasses(index: number): string {
  return mergeClasses(
    pieceClasses.value,
    textHeightClasses[props.size],
    roundedClasses[props.rounded],
    index === lineCount.value - 1 && lineCount.value > 1 ? "w-3/4" : "w-full",
  );
}
</script>

<template>
  <span
    v-bind="rootAttrs"
    data-balsa="skeleton"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-shape="props.shape"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-animation="props.animation"
    aria-hidden="true"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <template v-if="props.shape === 'text'">
      <span
        v-for="index in lineCount"
        :key="index"
        data-balsa="skeleton-piece"
        :data-animation="props.animation"
        :class="lineClasses(index - 1)"
      ></span>
    </template>
  </span>
</template>
