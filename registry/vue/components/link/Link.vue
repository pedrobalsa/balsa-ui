<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { actionColorClasses, type ActionColor } from "./types";
import type { Shadow, ThemeInput } from "./theme";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { useResolvedThemeProps } from "./theme-context";

type LinkVariant = "text" | "solid" | "outline";
type LinkSize = "sm" | "md" | "lg";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    href: string;
    variant?: LinkVariant;
    color?: ActionColor;
    size?: LinkSize;
    prefixIcon?: string;
    suffixIcon?: string;
    external?: boolean;
    label?: string;
    rounded?: Rounded;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    color: "accent",
    external: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "link",
  "controls",
  rawProps,
  { variant: "text", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const attrs = useAttrs();

const sizeClasses: Record<LinkSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-10 gap-2 px-6 text-sm",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

const rootAttrs = computed(() => withoutClassAttribute(attrs));

const classes = computed(() =>
  mergeClasses(
    "inline-flex w-fit items-center justify-center font-balsa-body font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
    roundedClasses[props.rounded],
    actionColorClasses[props.color][props.variant],
    props.variant === "text"
      ? ["underline", "underline-offset-4", "hover:decoration-2"]
      : ["no-underline"],
    props.variant === "outline" ? ["border", "bg-transparent"] : [],
    sizeClasses[props.size],
    attrs.class,
  ),
);

const target = computed(() => (props.external ? "_blank" : undefined));
const rel = computed(() => (props.external ? "noreferrer" : undefined));
const iconClasses = computed(() => ["mdi", "text-lg"]);
</script>

<template>
  <a
    v-bind="rootAttrs"
    data-balsa="link"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    :href="props.href"
    :target="target"
    :rel="rel"
    :aria-label="props.label"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <i
      v-if="props.prefixIcon"
      :class="[...iconClasses, props.prefixIcon]"
      aria-hidden="true"
    ></i>
    <slot />
    <i
      v-if="props.suffixIcon"
      :class="[...iconClasses, props.suffixIcon]"
      aria-hidden="true"
    ></i>
  </a>
</template>
