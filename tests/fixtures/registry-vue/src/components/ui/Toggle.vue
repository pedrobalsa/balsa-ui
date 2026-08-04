<script setup lang="ts">
import { Bell, Bookmark, Flag, Heart, Pin, Star } from "@lucide/vue";
import { computed, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { type Shadow, type ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import { actionColorClasses, type ActionColor } from "./types";
import Icon, { type IconComponent, type IconSize } from "./Icon.vue";

export type ToggleVariant = "surface" | "solid" | "outline" | "glass";
export type ToggleSize = "sm" | "md" | "lg" | "xl";
export type ToggleType = "button" | "submit" | "reset" | "icon";
export type ToggleIcon = "bookmark" | "heart" | "star" | "pin" | "bell" | "flag";

const toggleIcons: Readonly<Record<ToggleIcon, IconComponent>> = {
  bookmark: Bookmark,
  heart: Heart,
  star: Star,
  pin: Pin,
  bell: Bell,
  flag: Flag,
};

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    variant?: ToggleVariant;
    color?: ActionColor;
    size?: ToggleSize;
    rounded?: Rounded;
    prefixIcon?: IconComponent;
    suffixIcon?: IconComponent;
    icon?: ToggleIcon;
    disabled?: boolean;
    type?: ToggleType;
    shadow?: Shadow;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    icon: "bookmark",
    disabled: false,
    type: "button",
  },
);
const { props, theme } = useResolvedThemeProps(
  "toggle",
  "controls",
  rawProps,
  { variant: "surface", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();

const sizeClasses: Readonly<Record<ToggleSize, string[]>> = {
  sm: ["h-8", "gap-1.5", "px-3", "text-sm"],
  md: ["h-9", "gap-2", "px-4", "text-sm"],
  lg: ["h-10", "gap-2", "px-5", "text-sm"],
  xl: ["h-12", "gap-2.5", "px-6", "text-base"],
};

const iconSizes: Readonly<Record<ToggleSize, IconSize>> = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const iconButtonSizeClasses: Readonly<Record<ToggleSize, string[]>> = {
  sm: ["h-8", "w-8"],
  md: ["h-9", "w-9"],
  lg: ["h-10", "w-10"],
  xl: ["h-12", "w-12"],
};

const surfaceIdleClasses = [
  "border-balsa-border-strong",
  "bg-balsa-surface",
  "text-balsa-foreground",
  "hover:bg-balsa-muted",
  "active:bg-balsa-selected",
];

const idleColorClasses: Readonly<
  Record<ActionColor, Record<Exclude<ToggleVariant, "surface">, string[]>>
> = {
  neutral: {
    solid: ["border-transparent", "bg-balsa-muted", "text-balsa-foreground", "hover:bg-balsa-muted/80", "active:bg-balsa-muted/70"],
    outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground", "hover:bg-balsa-muted", "active:bg-balsa-muted/80"],
    glass: ["border-balsa-border", "bg-balsa-surface/60", "text-balsa-foreground", "hover:bg-balsa-surface/70", "active:bg-balsa-surface/80"],
  },
  primary: {
    solid: ["border-transparent", "bg-balsa-primary/15", "text-balsa-primary", "hover:bg-balsa-primary/20", "active:bg-balsa-primary/25"],
    outline: ["border-balsa-primary", "bg-transparent", "text-balsa-primary", "hover:bg-balsa-primary/15", "active:bg-balsa-primary/25"],
    glass: ["border-balsa-primary/40", "bg-balsa-primary/10", "text-balsa-primary", "hover:bg-balsa-primary/15", "active:bg-balsa-primary/25"],
  },
  secondary: {
    solid: ["border-transparent", "bg-balsa-secondary/15", "text-balsa-secondary", "hover:bg-balsa-secondary/20", "active:bg-balsa-secondary/25"],
    outline: ["border-balsa-secondary", "bg-transparent", "text-balsa-secondary", "hover:bg-balsa-secondary/15", "active:bg-balsa-secondary/25"],
    glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10", "text-balsa-secondary", "hover:bg-balsa-secondary/15", "active:bg-balsa-secondary/25"],
  },
  accent: {
    solid: ["border-transparent", "bg-balsa-accent/15", "text-balsa-accent", "hover:bg-balsa-accent/20", "active:bg-balsa-accent/25"],
    outline: ["border-balsa-accent", "bg-transparent", "text-balsa-accent", "hover:bg-balsa-accent/15", "active:bg-balsa-accent/25"],
    glass: ["border-balsa-accent/40", "bg-balsa-accent/10", "text-balsa-accent", "hover:bg-balsa-accent/15", "active:bg-balsa-accent/25"],
  },
  destructive: {
    solid: ["border-transparent", "bg-balsa-destructive/15", "text-balsa-destructive", "hover:bg-balsa-destructive/20", "active:bg-balsa-destructive/25"],
    outline: ["border-balsa-destructive", "bg-transparent", "text-balsa-destructive", "hover:bg-balsa-destructive/15", "active:bg-balsa-destructive/25"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "hover:bg-balsa-destructive/15", "active:bg-balsa-destructive/25"],
  },
};

const pressedClasses = computed(() => actionColorClasses[props.color].solid);
const idleClasses = computed(() =>
  props.variant === "surface"
    ? surfaceIdleClasses
    : idleColorClasses[props.color][props.variant],
);
const iconIdleClasses = [
  "border-transparent",
  "bg-transparent",
  "text-balsa-muted-foreground",
  "hover:bg-balsa-muted",
  "hover:text-balsa-foreground",
  "active:bg-balsa-selected",
];
const iconPressedClasses: Readonly<Record<ActionColor, string[]>> = {
  neutral: ["border-transparent", "bg-transparent", "text-balsa-foreground", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  primary: ["border-transparent", "bg-transparent", "text-balsa-primary", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  secondary: ["border-transparent", "bg-transparent", "text-balsa-secondary", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  accent: ["border-transparent", "bg-transparent", "text-balsa-accent", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  destructive: ["border-transparent", "bg-transparent", "text-balsa-destructive", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
};
const isIconType = computed(() => props.type === "icon");
const nativeType = computed<"button" | "submit" | "reset">(() =>
  props.type === "icon" ? "button" : props.type,
);
const activeIcon = computed(() => toggleIcons[props.icon]);
const toggleFillClasses = { on: "fill-current", off: "fill-none" } as const;
const activeFillClass = computed(() => model.value ? toggleFillClasses.on : toggleFillClasses.off);
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const classes = computed(() =>
  mergeClasses(
    "inline-flex w-fit shrink-0 cursor-pointer items-center justify-center border font-balsa-body transition-[border-color,background-color,color,box-shadow,transform] duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:border-balsa-disabled disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    isIconType.value ? iconButtonSizeClasses[props.size] : sizeClasses[props.size],
    roundedClasses[props.rounded],
    isIconType.value
      ? model.value ? iconPressedClasses[props.color] : iconIdleClasses
      : model.value ? pressedClasses.value : idleClasses.value,
    attrs.class,
  ),
);

function toggle(): void {
  if (!props.disabled) model.value = !model.value;
}
</script>

<template>
  <button
    v-bind="rootAttrs"
    data-balsa="toggle"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-state="model ? 'on' : 'off'"
    :data-variant="props.variant"
    :data-color="props.color"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    :type="nativeType"
    :disabled="props.disabled"
    :aria-pressed="model"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    @click="toggle"
  >
    <Icon
      v-if="isIconType"
      :icon="activeIcon"
      :size="iconSizes[props.size]"
      :class="activeFillClass"
    />
    <Icon
      v-else-if="props.prefixIcon"
      :icon="props.prefixIcon"
      :size="iconSizes[props.size]"
    />
    <slot v-if="!isIconType" />
    <Icon
      v-if="!isIconType && props.suffixIcon"
      :icon="props.suffixIcon"
      :size="iconSizes[props.size]"
    />
  </button>
</template>
