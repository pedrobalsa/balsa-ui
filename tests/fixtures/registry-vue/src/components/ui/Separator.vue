<script setup lang="ts">
import { computed, useAttrs, useSlots } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorVariant = "solid" | "dashed" | "dotted";
export type SeparatorSize = "sm" | "md" | "lg";
export type SeparatorAlign = "start" | "center" | "end";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    orientation?: SeparatorOrientation;
    variant?: SeparatorVariant;
    size?: SeparatorSize;
    align?: SeparatorAlign;
    decorative?: boolean;
    label?: string;
    accessibleLabel?: string;
    theme?: ThemeInput;
  }>(),
  {
    orientation: "horizontal",
    align: "center",
    decorative: true,
  },
);
const { props, theme } = useResolvedThemeProps(
  "separator",
  "surfaces",
  rawProps,
  { variant: "solid", size: "sm" } as const,
);

const attrs = useAttrs();
const slots = useSlots();
const hasLabel = computed(
  () => props.orientation === "horizontal" && Boolean(props.label || slots.default),
);
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const semanticRole = computed(() => (props.decorative ? "none" : "separator"));
const ariaOrientation = computed(() =>
  props.decorative ? undefined : props.orientation,
);

const borderVariantClasses: Readonly<Record<SeparatorVariant, string>> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};
const horizontalSizeClasses: Readonly<Record<SeparatorSize, string>> = {
  sm: "border-t",
  md: "border-t-2",
  lg: "border-t-4",
};
const verticalSizeClasses: Readonly<Record<SeparatorSize, string>> = {
  sm: "border-l",
  md: "border-l-2",
  lg: "border-l-4",
};
const segmentClassesByAlign: Readonly<
  Record<SeparatorAlign, { before: string; after: string }>
> = {
  start: { before: "w-8 shrink-0", after: "min-w-0 flex-1" },
  center: { before: "min-w-0 flex-1", after: "min-w-0 flex-1" },
  end: { before: "min-w-0 flex-1", after: "w-8 shrink-0" },
};

const classes = computed(() =>
  mergeClasses(
    "border-balsa-border",
    props.orientation === "horizontal"
      ? hasLabel.value
        ? "flex w-full items-center gap-3"
        : [
            "block w-full",
            horizontalSizeClasses[props.size],
            borderVariantClasses[props.variant],
          ]
      : [
          "block h-full min-h-4 w-0 shrink-0",
          verticalSizeClasses[props.size],
          borderVariantClasses[props.variant],
        ],
    attrs.class,
  ),
);
const lineClasses = computed(() =>
  mergeClasses(
    "border-balsa-border",
    horizontalSizeClasses[props.size],
    borderVariantClasses[props.variant],
  ),
);
const beforeLineClasses = computed(() =>
  mergeClasses(lineClasses.value, segmentClassesByAlign[props.align].before),
);
const afterLineClasses = computed(() =>
  mergeClasses(lineClasses.value, segmentClassesByAlign[props.align].after),
);
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="separator"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-orientation="props.orientation"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-align="props.align"
    :data-decorative="props.decorative"
    :role="semanticRole"
    :aria-orientation="ariaOrientation"
    :aria-label="props.decorative ? undefined : props.accessibleLabel"
    :aria-hidden="props.decorative ? true : undefined"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <template v-if="hasLabel">
      <span aria-hidden="true" :class="beforeLineClasses"></span>
      <span class="shrink-0 font-balsa-body text-sm font-bold text-balsa-muted-foreground">
        <slot>{{ props.label }}</slot>
      </span>
      <span aria-hidden="true" :class="afterLineClasses"></span>
    </template>
  </div>
</template>
