<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { ActionColor } from "./types";
import { type Shadow, type ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";

type CardVariant = "surface" | "elevated" | "muted" | "outline" | "soft" | "glass";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardSize = Exclude<CardPadding, "none">;
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: CardVariant;
    color?: ActionColor;
    padding?: CardPadding;
    size?: CardSize;
    rounded?: Rounded;
    shadow?: Shadow | boolean;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    shadow: undefined,
  },
);

const attrs = useAttrs();
const theme = useComponentTheme("card", "surfaces", () => props.theme);
const resolvedVariant = computed<CardVariant>(() =>
  theme.resolve("variant", props.variant, "surface")
);
const resolvedSize = computed<CardSize>(() =>
  theme.resolve("size", props.size, "md")
);
const resolvedRounded = computed<Rounded>(() =>
  theme.resolve("rounded", props.rounded, "2xl")
);
const resolvedShadow = computed<Shadow>(() => {
  const shadow = theme.resolve<Shadow | boolean>("shadow", props.shadow, "auto");
  if (shadow === true) return "auto";
  if (shadow === false) return "none";
  return shadow;
});

const variantClasses: Record<CardVariant, string[]> = {
  surface: [
    "border",
    "border-balsa-border",
    "bg-balsa-surface",
    "text-balsa-surface-foreground",
  ],
  elevated: [
    "border",
    "border-balsa-border",
    "bg-balsa-surface-elevated",
    "text-balsa-surface-elevated-foreground",
  ],
  muted: ["border", "bg-balsa-muted", "text-balsa-muted-foreground"],
  outline: ["border", "bg-transparent", "text-balsa-foreground"],
  soft: ["border", "text-balsa-foreground"],
  glass: ["border", "text-balsa-foreground", "backdrop-blur-md"],
};
const colorClasses: Readonly<Record<ActionColor, Record<CardVariant, string[]>>> = {
  primary: {
    surface: ["border-balsa-primary/30"], elevated: ["border-balsa-primary/40"], muted: ["border-balsa-primary/25"],
    outline: ["border-balsa-primary"], soft: ["border-balsa-primary/25", "bg-balsa-primary/15"], glass: ["border-balsa-primary/40"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], elevated: ["border-balsa-secondary/40"], muted: ["border-balsa-secondary/25"],
    outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/25", "bg-balsa-secondary/15"], glass: ["border-balsa-secondary/40"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], elevated: ["border-balsa-accent/40"], muted: ["border-balsa-accent/25"],
    outline: ["border-balsa-accent"], soft: ["border-balsa-accent/25", "bg-balsa-accent/15"], glass: ["border-balsa-accent/40"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], elevated: ["border-balsa-destructive/40"], muted: ["border-balsa-destructive/25"],
    outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15"], glass: ["border-balsa-destructive/40"],
  },
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-7 sm:p-8",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

const rootAttrs = computed(() => withoutClassAttribute(attrs));
const resolvedPadding = computed<CardPadding>(() =>
  props.padding
    ?? theme.defaults.value.padding as CardPadding | undefined
    ?? resolvedSize.value,
);

const classes = computed(() =>
  mergeClasses(
    "min-w-0",
    roundedClasses[resolvedRounded.value],
    variantClasses[resolvedVariant.value],
    colorClasses[props.color][resolvedVariant.value],
    paddingClasses[resolvedPadding.value],
    attrs.class,
  ),
);
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="card"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="resolvedVariant"
    :data-color="props.color"
    :data-size="resolvedSize"
    :data-rounded="resolvedRounded"
    :data-shadow="resolvedShadow"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="classes"
  >
    <slot />
  </div>
</template>
