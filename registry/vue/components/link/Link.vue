<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { actionColorClasses, type ActionColor } from "./types";
import type { Shadow, ThemeInput } from "./theme";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { useResolvedThemeProps } from "./theme-context";
import Icon, { type IconComponent } from "./Icon.vue";

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
    prefixIcon?: IconComponent;
    suffixIcon?: IconComponent;
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
    "inline-flex w-fit items-center justify-center font-balsa-body transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
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
    <Icon
      v-if="props.prefixIcon"
      :icon="props.prefixIcon"
      size="md"
    />
    <slot />
    <Icon
      v-if="props.suffixIcon"
      :icon="props.suffixIcon"
      size="md"
    />
  </a>
</template>
