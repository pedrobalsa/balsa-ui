<script setup lang="ts">
import { LoaderCircle } from "@lucide/vue";
import { computed, useAttrs } from "vue";
import { actionColorClasses, type ActionColor } from "./types";
import { type Shadow, type ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";
import Icon, { type IconComponent, type IconSize } from "./Icon.vue";

export type ButtonVariant = "solid" | "soft" | "outline" | "glass";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "2xl";
type ButtonShape = "rounded" | "pill" | "fab";
type ButtonIconPlacement = "none" | "prefix" | "suffix" | "both";

defineOptions({ name: "BalsaButton", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    color?: ActionColor;
    size?: ButtonSize | null;
    shape?: ButtonShape;
    prefixIcon?: IconComponent;
    suffixIcon?: IconComponent;
    disabled?: boolean;
    loading?: boolean;
    analyticsEvent?: string;
    type?: "button" | "submit" | "reset";
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    disabled: false,
    loading: false,
    type: "button",
  },
);

const attrs = useAttrs();
const theme = useComponentTheme("button", "controls", () => props.theme);
const resolvedVariant = computed<ButtonVariant>(() =>
  theme.resolve("variant", props.variant, "solid")
);
const resolvedSize = computed<ButtonSize | null>(() =>
  theme.resolve("size", props.size, "md")
);
const resolvedShape = computed<ButtonShape>(() =>
  theme.resolve("shape", props.shape, "rounded")
);
const resolvedShadow = computed<Shadow>(() =>
  theme.resolve("shadow", props.shadow, "auto")
);

const sizeClasses: Record<ButtonSize, string[]> = {
  sm: ["h-8", "gap-balsa-2xs", "text-sm"],
  md: ["h-9", "gap-balsa-xs", "text-sm"],
  lg: ["h-10", "gap-balsa-xs", "text-sm"],
  xl: ["h-12", "gap-balsa-sm", "text-base"],
  "2xl": ["h-18", "gap-balsa-md", "text-xl"],
};

/*
 * The inset is not here any more. It follows from the size, and from whether an
 * icon sits beside it; both are published as data for the stylesheet to key on.
 * See the icon-adjacency rule in balsa-theme.css.
 *
 * What stood here was a five-by-four table of literal padding classes in which
 * the rule was implicit -- every icon-side value happened to be one step less
 * than its text-side neighbour. Twenty numbers expressing one sentence, and the
 * only place `28px`, `36px` and `14px` entered the vocabulary at all.
 */
const iconSizes: Record<ButtonSize, IconSize> = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "md",
  "2xl": "lg",
};

const shapeClasses: Record<ButtonShape, string[]> = {
  rounded: ["rounded-balsa-control"],
  pill: ["rounded-balsa-pill"],
  fab: ["rounded-balsa-pill", "p-0"],
};

const fabSizeClasses: Record<ButtonSize, string[]> = {
  sm: ["h-8", "w-8"],
  md: ["h-9", "w-9"],
  lg: ["h-10", "w-10"],
  xl: ["h-12", "w-12"],
  "2xl": ["h-18", "w-18"],
};

const fabIconSizes: Record<ButtonSize, IconSize> = {
  sm: "sm",
  md: "md",
  lg: "md",
  xl: "lg",
  "2xl": "xl",
};

const leadingIcon = computed(() =>
  props.loading ? LoaderCircle : props.prefixIcon,
);

const trailingIcon = computed(() =>
  props.loading ? undefined : props.suffixIcon,
);

const iconPlacement = computed<ButtonIconPlacement>(() => {
  if (leadingIcon.value && trailingIcon.value) return "both";
  if (leadingIcon.value) return "prefix";
  if (trailingIcon.value) return "suffix";
  return "none";
});

const isDisabled = computed(() => props.disabled || props.loading);

const ariaBusy = computed(() => (props.loading ? "true" : undefined));

const rootAttrs = computed(() => withoutClassAttribute(attrs));

const classes = computed(() =>
  mergeClasses(
    // No `duration-200 ease-in-out`. The shared control rule already sets
    // transition duration and easing from the motion tokens, and a literal
    // utility outranks it -- so every button animated for a fixed 200ms at
    // every motion setting, including the one that asks for none.
    "inline-flex w-fit items-center justify-center font-balsa-body transition-colors hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:border-balsa-disabled disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    actionColorClasses[props.color][resolvedVariant.value],
    resolvedVariant.value === "outline" ? ["bg-transparent"] : [],
    resolvedVariant.value === "glass" ? [] : [],
    resolvedSize.value ? sizeClasses[resolvedSize.value] : [],
    shapeClasses[resolvedShape.value],
    resolvedShape.value === "fab" && resolvedSize.value
      ? fabSizeClasses[resolvedSize.value]
      : [],
    props.loading
      ? "disabled:cursor-progress"
      : "disabled:cursor-not-allowed",
    attrs.class,
  ),
);

const iconSize = computed<IconSize>(() => {
  if (!resolvedSize.value) return "md";
  return resolvedShape.value === "fab"
    ? fabIconSizes[resolvedSize.value]
    : iconSizes[resolvedSize.value];
});
</script>

<template>
  <button
    v-bind="rootAttrs"
    data-balsa="button"
    :data-balsa-track="props.analyticsEvent?.trim() || undefined"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="resolvedVariant"
    :data-shape="resolvedShape"
    :data-color="props.color"
    :data-shadow="resolvedShadow"
    :data-size="resolvedSize ?? undefined"
    :data-icon="iconPlacement"
    :type="props.type"
    :disabled="isDisabled"
    :aria-busy="ariaBusy"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="classes"
  >
    <Icon
      v-if="leadingIcon"
      :icon="leadingIcon"
      :size="iconSize"
      :class="props.loading ? 'animate-spin' : undefined"
    />
    <slot />
    <Icon
      v-if="trailingIcon"
      :icon="trailingIcon"
      :size="iconSize"
    />
  </button>
</template>
