<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { semanticColorClasses, type SemanticColor } from "./types";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";

type BadgeVariant = "solid" | "soft" | "outline" | "glass";
type BadgeSize = "sm" | "md" | "lg";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
    color?: SemanticColor;
    size?: BadgeSize;
    rounded?: Rounded;
    theme?: ThemeInput;
  }>(),
  {
    color: "accent",
  },
);

const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "badge",
  "controls",
  rawProps,
  { variant: "solid", size: "md", rounded: "full" } as const,
);

const rootAttrs = computed(() => withoutClassAttribute(attrs));

const sizeClasses: Readonly<Record<BadgeSize, string>> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

const classes = computed(() =>
  mergeClasses(
    "inline-flex font-bold",
    roundedClasses[props.rounded],
    sizeClasses[props.size],
    semanticColorClasses[props.color][props.variant],
    props.variant === "outline" ? ["border", "bg-transparent"] : [],
    props.variant === "glass" ? "border" : [],
    attrs.class,
  ),
);
</script>

<template>
  <span
    v-bind="rootAttrs"
    data-balsa="badge"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="classes"
  >
    <slot />
  </span>
</template>
