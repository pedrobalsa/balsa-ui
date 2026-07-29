<script setup lang="ts">
import { computed, useAttrs } from "vue";
import Button from "./Button.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import type { ActionColor, SemanticColor } from "./types";
import { useResolvedThemeProps } from "./theme-context";

export type ToastVariant = "surface" | "soft" | "outline" | "glass";
export type ToastSize = "sm" | "md" | "lg";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    title: string;
    description?: string;
    color?: SemanticColor;
    variant?: ToastVariant;
    size?: ToastSize;
    rounded?: Rounded;
    shadow?: Shadow;
    icon?: string;
    actionLabel?: string;
    dismissible?: boolean;
    closeLabel?: string;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    dismissible: true,
    closeLabel: "Dismiss notification",
  },
);
const { props, theme } = useResolvedThemeProps(
  "toast",
  "overlays",
  rawProps,
  { variant: "surface", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const emit = defineEmits<{
  action: [];
  dismiss: [];
  pause: [];
  resume: [];
}>();
const attrs = useAttrs();
const rootAttrs = computed(() => withoutClassAttribute(attrs));

const defaultIcons: Readonly<Record<SemanticColor, string>> = {
  primary: "mdi-information-outline",
  secondary: "mdi-information-outline",
  accent: "mdi-star-outline",
  destructive: "mdi-alert-circle-outline",
  success: "mdi-check-circle-outline",
  warning: "mdi-alert-outline",
  info: "mdi-information-outline",
};
const colorVariantClasses: Readonly<
  Record<SemanticColor, Record<ToastVariant, string[]>>
> = {
  primary: {
    surface: ["border-balsa-primary/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-primary/25", "bg-balsa-primary/15", "text-balsa-primary"],
    outline: ["border-balsa-primary", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-primary/40", "bg-balsa-primary/10", "text-balsa-primary", "backdrop-blur-md"],
  },
  secondary: {
    surface: ["border-balsa-secondary/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-secondary/25", "bg-balsa-secondary/15", "text-balsa-secondary"],
    outline: ["border-balsa-secondary", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10", "text-balsa-secondary", "backdrop-blur-md"],
  },
  accent: {
    surface: ["border-balsa-accent/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-accent/25", "bg-balsa-accent/15", "text-balsa-accent"],
    outline: ["border-balsa-accent", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-accent/40", "bg-balsa-accent/10", "text-balsa-accent", "backdrop-blur-md"],
  },
  destructive: {
    surface: ["border-balsa-destructive/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15", "text-balsa-destructive"],
    outline: ["border-balsa-destructive", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "backdrop-blur-md"],
  },
  success: {
    surface: ["border-balsa-success/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-success/25", "bg-balsa-success/15", "text-balsa-success"],
    outline: ["border-balsa-success", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-success/40", "bg-balsa-success/10", "text-balsa-success", "backdrop-blur-md"],
  },
  warning: {
    surface: ["border-balsa-warning/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-warning/25", "bg-balsa-warning/15", "text-balsa-warning"],
    outline: ["border-balsa-warning", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-warning/40", "bg-balsa-warning/10", "text-balsa-warning", "backdrop-blur-md"],
  },
  info: {
    surface: ["border-balsa-info/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-info/25", "bg-balsa-info/15", "text-balsa-info"],
    outline: ["border-balsa-info", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-info/40", "bg-balsa-info/10", "text-balsa-info", "backdrop-blur-md"],
  },
};
const iconColorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "text-balsa-primary",
  secondary: "text-balsa-secondary",
  accent: "text-balsa-accent",
  destructive: "text-balsa-destructive",
  success: "text-balsa-success",
  warning: "text-balsa-warning",
  info: "text-balsa-info",
};
const actionColorMap: Readonly<Record<SemanticColor, ActionColor>> = {
  primary: "primary",
  secondary: "secondary",
  accent: "accent",
  destructive: "destructive",
  success: "primary",
  warning: "accent",
  info: "primary",
};
const sizeClasses: Readonly<Record<ToastSize, string>> = {
  sm: "p-3 text-sm",
  md: "p-4 text-sm",
  lg: "p-5 text-base",
};
const contentGapClasses: Readonly<Record<ToastSize, string>> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5",
};
const iconSizeClasses: Readonly<Record<ToastSize, string>> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};
const titleSizeClasses: Readonly<Record<ToastSize, string>> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const currentIcon = computed(() => props.icon ?? defaultIcons[props.color]);
const isTintedVariant = computed(() =>
  props.variant === "soft" || props.variant === "glass",
);
const classes = computed(() =>
  mergeClasses(
    "pointer-events-auto relative w-full min-w-0 border font-balsa-body shadow-balsa-surface outline-none",
    sizeClasses[props.size],
    roundedClasses[props.rounded],
    colorVariantClasses[props.color][props.variant],
    attrs.class,
  ),
);
const contentClasses = computed(() => [
  "flex min-w-0 items-start",
  contentGapClasses[props.size],
]);
const iconClasses = computed(() => [
  "mdi shrink-0 leading-none",
  iconSizeClasses[props.size],
  isTintedVariant.value ? "text-current" : iconColorClasses[props.color],
]);
const titleClasses = computed(() => [
  "m-0 font-bold leading-tight",
  titleSizeClasses[props.size],
]);
const descriptionClasses = computed(() => [
  "mt-1 leading-relaxed",
  isTintedVariant.value ? "text-current" : "text-balsa-muted-foreground",
]);
const contentPaddingClasses = computed(() => props.dismissible ? "pr-9" : "");
const closeClasses = computed(() =>
  mergeClasses(
    "absolute right-2 top-2 size-9 min-h-0 min-w-0 border-0 bg-transparent p-0 text-xl shadow-none",
    isTintedVariant.value
      ? "text-current hover:bg-current/15 active:bg-current/25"
      : "text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground active:bg-balsa-muted",
  ),
);
</script>

<template>
  <article
    v-bind="rootAttrs"
    data-balsa="toast"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-color="props.color"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    :role="props.color === 'destructive' ? 'alert' : 'status'"
    :aria-live="props.color === 'destructive' ? 'assertive' : 'polite'"
    aria-atomic="true"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    @mouseenter="emit('pause')"
    @mouseleave="emit('resume')"
    @focusin="emit('pause')"
    @focusout="emit('resume')"
  >
    <div :class="contentClasses">
      <i :class="[currentIcon, iconClasses]" aria-hidden="true"></i>
      <div :class="['min-w-0 flex-1', contentPaddingClasses]">
        <h3 :id="`${props.id}-title`" :class="titleClasses">
          {{ props.title }}
        </h3>
        <p v-if="props.description" :class="descriptionClasses">
          {{ props.description }}
        </p>
        <slot />
      </div>
    </div>

    <Button
      v-if="props.dismissible"
      data-balsa-toast-close
      :size="null"
      shape="fab"
      variant="outline"
      color="secondary"
      prefix-icon="mdi-close"
      :theme="theme.input.value"
      :aria-label="props.closeLabel"
      :class="closeClasses"
      @click="emit('dismiss')"
    />

    <div
      v-if="props.actionLabel || $slots.action"
      data-balsa-toast-action
      class="mt-3 flex min-w-0 justify-end gap-2"
    >
      <slot name="action" :dismiss="() => emit('dismiss')">
        <Button
          variant="outline"
          :color="actionColorMap[props.color]"
          size="sm"
          :theme="theme.input.value"
          @click="emit('action')"
        >
          {{ props.actionLabel }}
        </Button>
      </slot>
    </div>
  </article>
</template>
