<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { actionColorClasses, type ActionColor } from "./types";
import { type Shadow, type ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";

type ButtonVariant = "solid" | "outline" | "glass";
type ButtonSize = "sm" | "md" | "lg" | "xl";
type ButtonShape = "rounded" | "pill" | "fab";
type ButtonIconPlacement = "none" | "prefix" | "suffix" | "both";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    color?: ActionColor;
    size?: ButtonSize | null;
    shape?: ButtonShape;
    prefixIcon?: string;
    suffixIcon?: string;
    disabled?: boolean;
    loading?: boolean;
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
  sm: ["h-9", "gap-1.5", "text-sm"],
  md: ["h-11", "gap-2", "text-base"],
  lg: ["h-12", "gap-2.5", "text-lg"],
  xl: ["h-14", "gap-3", "text-xl"],
};

const paddingClasses: Record<
  ButtonSize,
  Record<ButtonIconPlacement, string>
> = {
  sm: {
    none: "px-4",
    prefix: "pl-3 pr-4",
    suffix: "pl-4 pr-3",
    both: "px-3",
  },
  md: {
    none: "px-5",
    prefix: "pl-4 pr-5",
    suffix: "pl-5 pr-4",
    both: "px-4",
  },
  lg: {
    none: "px-6",
    prefix: "pl-5 pr-6",
    suffix: "pl-6 pr-5",
    both: "px-5",
  },
  xl: {
    none: "px-7",
    prefix: "pl-6 pr-7",
    suffix: "pl-7 pr-6",
    both: "px-6",
  },
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

const shapeClasses: Record<ButtonShape, string[]> = {
  rounded: ["rounded-balsa-control"],
  pill: ["rounded-full"],
  fab: ["rounded-full", "p-0"],
};

const fabSizeClasses: Record<ButtonSize, string[]> = {
  sm: ["h-10", "w-10"],
  md: ["h-14", "w-14"],
  lg: ["h-18", "w-18"],
  xl: ["h-24", "w-24"],
};

const fabIconSizeClasses: Record<ButtonSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

const leadingIcon = computed(() =>
  props.loading ? "mdi-loading" : props.prefixIcon,
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
    "inline-flex w-fit items-center justify-center font-balsa-body font-bold transition-colors duration-200 ease-in-out hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:border-balsa-disabled disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    actionColorClasses[props.color][resolvedVariant.value],
    resolvedVariant.value === "outline" ? ["border", "bg-transparent"] : [],
    resolvedVariant.value === "glass" ? ["border"] : [],
    resolvedSize.value ? sizeClasses[resolvedSize.value] : [],
    resolvedSize.value ? paddingClasses[resolvedSize.value][iconPlacement.value] : [],
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

const iconClasses = computed(() => [
  "mdi",
  resolvedSize.value
    ? resolvedShape.value === "fab"
      ? fabIconSizeClasses[resolvedSize.value]
      : iconSizeClasses[resolvedSize.value]
    : "text-inherit",
]);

const leadingIconClasses = computed(() => [
  ...iconClasses.value,
  leadingIcon.value,
  ...(props.loading ? ["animate-spin"] : []),
]);

const trailingIconClasses = computed(() => [
  ...iconClasses.value,
  trailingIcon.value,
]);
</script>

<template>
  <button
    v-bind="rootAttrs"
    data-balsa="button"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="resolvedVariant"
    :data-shape="resolvedShape"
    :data-color="props.color"
    :data-shadow="resolvedShadow"
    :type="props.type"
    :disabled="isDisabled"
    :aria-busy="ariaBusy"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="classes"
  >
    <i
      v-if="leadingIcon"
      :class="leadingIconClasses"
      aria-hidden="true"
    ></i>
    <slot />
    <i
      v-if="trailingIcon"
      :class="trailingIconClasses"
      aria-hidden="true"
    ></i>
  </button>
</template>
