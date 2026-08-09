<script setup lang="ts">
import { computed, useAttrs } from "vue";
import Button from "./Button.vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { type Shadow, type ThemeInput } from "./theme";
import { useComponentTheme } from "./theme-context";
import type { ActionColor } from "./types";
import type { IconComponent } from "./Icon.vue";

export interface ButtonGroupOption {
  id: string;
  label: string;
  icon?: IconComponent;
}

type ButtonSize = "sm" | "md" | "lg" | "xl";
type ButtonVariant = "solid" | "outline" | "glass";
type ButtonGroupVariant = "surface" | "solid" | "outline" | "glass" | "code";
type ButtonGroupShape = "rounded" | "pill";

const solidColorClasses: Readonly<Record<ActionColor, string[]>> = {
  neutral: ["border-balsa-inverse", "bg-balsa-inverse", "text-balsa-inverse-foreground"],
  primary: ["border-balsa-primary", "bg-balsa-primary", "text-balsa-primary-foreground"],
  secondary: ["border-balsa-secondary", "bg-balsa-secondary", "text-balsa-secondary-foreground"],
  accent: ["border-balsa-accent", "bg-balsa-accent", "text-balsa-accent-foreground"],
  destructive: ["border-balsa-destructive", "bg-balsa-destructive", "text-balsa-destructive-foreground"],
};

const solidOptionClasses: Readonly<Record<ActionColor, { selected: string[]; idle: string[] }>> = {
  neutral: {
    selected: ["bg-balsa-inverse-foreground/20", "text-balsa-inverse-foreground", "hover:bg-balsa-inverse-foreground/20", "active:bg-balsa-inverse-foreground/30"],
    idle: ["text-balsa-inverse-foreground/75", "hover:bg-balsa-inverse-foreground/10", "active:bg-balsa-inverse-foreground/20"],
  },
  primary: {
    selected: ["bg-balsa-primary-foreground/20", "text-balsa-primary-foreground", "hover:bg-balsa-primary-foreground/20", "active:bg-balsa-primary-foreground/30"],
    idle: ["text-balsa-primary-foreground/75", "hover:bg-balsa-primary-foreground/10", "active:bg-balsa-primary-foreground/20"],
  },
  secondary: {
    selected: ["bg-balsa-secondary-foreground/20", "text-balsa-secondary-foreground", "hover:bg-balsa-secondary-foreground/20", "active:bg-balsa-secondary-foreground/30"],
    idle: ["text-balsa-secondary-foreground/75", "hover:bg-balsa-secondary-foreground/10", "active:bg-balsa-secondary-foreground/20"],
  },
  accent: {
    selected: ["bg-balsa-accent-foreground/20", "text-balsa-accent-foreground", "hover:bg-balsa-accent-foreground/20", "active:bg-balsa-accent-foreground/30"],
    idle: ["text-balsa-accent-foreground/75", "hover:bg-balsa-accent-foreground/10", "active:bg-balsa-accent-foreground/20"],
  },
  destructive: {
    selected: ["bg-balsa-destructive-foreground/20", "text-balsa-destructive-foreground", "hover:bg-balsa-destructive-foreground/20", "active:bg-balsa-destructive-foreground/30"],
    idle: ["text-balsa-destructive-foreground/75", "hover:bg-balsa-destructive-foreground/10", "active:bg-balsa-destructive-foreground/20"],
  },
};

const codeRootSizeClasses: Readonly<Record<ButtonSize, string>> = {
  sm: "h-7",
  md: "h-9",
  lg: "h-10",
  xl: "h-11",
};

const codeOptionSizeClasses: Readonly<Record<ButtonSize, string[]>> = {
  sm: ["gap-balsa-2xs", "px-balsa-sm", "text-xs"],
  md: ["gap-balsa-xs", "px-balsa-md", "text-sm"],
  lg: ["gap-balsa-sm", "px-3.5", "text-base"],
  xl: ["gap-balsa-md", "px-balsa-lg", "text-lg"],
};

const shapeClasses: Readonly<Record<ButtonGroupShape, string>> = {
  rounded: "rounded-balsa-control",
  pill: "rounded-balsa-pill",
};

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options: readonly ButtonGroupOption[];
    label: string;
    color?: ActionColor;
    size?: ButtonSize;
    variant?: ButtonGroupVariant;
    shape?: ButtonGroupShape;
    shadow?: Shadow;
    collapseLabels?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    color: "primary",
    collapseLabels: false,
  },
);

const attrs = useAttrs();
const model = defineModel<string>({ required: true });
const theme = useComponentTheme("button-group", "controls", () => props.theme);
const resolvedSize = computed<ButtonSize>(() =>
  theme.resolve("size", props.size, "sm")
);
const resolvedVariant = computed<ButtonGroupVariant>(() =>
  theme.resolve(
    "variant",
    props.variant,
    theme.resolved.value.base === "glassmorphism" ? "glass" : "surface",
  )
);
const resolvedShape = computed<ButtonGroupShape>(() =>
  theme.resolve("shape", props.shape, "rounded")
);
const resolvedShadow = computed<Shadow>(() =>
  theme.resolve("shadow", props.shadow, "auto")
);

const buttonVariants = computed(() =>
  Object.fromEntries(
    props.options.map((item) => {
      const selected = item.id === model.value;
      const variant =
        resolvedVariant.value === "code" || resolvedVariant.value === "solid"
          ? "outline"
          : selected
            ? "solid"
            : resolvedVariant.value === "glass"
              ? "glass"
              : "outline";

      return [item.id, variant];
    }),
  ) as Record<string, ButtonVariant>,
);

const labelClasses = computed(() =>
  Object.fromEntries(
    props.options.map((item) => [
      item.id,
      props.collapseLabels && item.icon ? ["hidden"] : [],
    ]),
  ) as Record<string, string[]>,
);

const rootAttrs = computed(() => withoutClassAttribute(attrs));

const rootClasses = computed(() => {
  const variantClasses: Readonly<Record<ButtonGroupVariant, string[]>> = {
    surface: ["border-balsa-border-strong", "bg-balsa-surface"],
    solid: solidColorClasses[props.color],
    outline: ["border-balsa-border-strong", "bg-transparent"],
    glass: ["border-balsa-border", "bg-balsa-surface-elevated/70"],
    code: [codeRootSizeClasses[resolvedSize.value], "border-balsa-code-foreground/20", "bg-transparent"],
  };

  return mergeClasses(
    "inline-flex w-fit max-w-full shrink-0 overflow-x-auto border",
    shapeClasses[resolvedShape.value],
    variantClasses[resolvedVariant.value],
    attrs.class,
  );
});

const buttonSizes = computed(() =>
  Object.fromEntries(
    props.options.map((item) => [
      item.id,
      resolvedVariant.value === "code" ? null : resolvedSize.value,
    ]),
  ) as Record<string, ButtonSize | null>,
);

/**
 * Neutral containers keep unselected options neutral and spend `color` on the
 * selected option only, matching Tabs and the code variant. Letting the action
 * color tint every idle label makes a surface group read as a colored control
 * beside otherwise neutral chrome.
 */
const neutralIdleClasses: Readonly<Record<"surface" | "outline" | "glass", string[]>> = {
  surface: [
    "text-balsa-muted-foreground",
    "hover:bg-balsa-muted",
    "hover:text-balsa-foreground",
    "active:bg-balsa-muted",
  ],
  outline: [
    "text-balsa-muted-foreground",
    "hover:bg-balsa-muted",
    "hover:text-balsa-foreground",
    "active:bg-balsa-muted",
  ],
  glass: [
    "text-balsa-muted-foreground",
    "hover:bg-balsa-surface/55",
    "hover:text-balsa-foreground",
    "active:bg-balsa-surface/70",
  ],
};

const buttonClasses = computed(() =>
  Object.fromEntries(
    props.options.map((item) => {
      const selected = item.id === model.value;
      const variantClasses: string[] =
        resolvedVariant.value === "code"
          ? [
              "h-full border-balsa-code-foreground/20 bg-transparent text-balsa-code-foreground/65 shadow-none transform-none",
              ...codeOptionSizeClasses[resolvedSize.value],
              ...(selected
                ? ["bg-balsa-code-foreground/10", "text-balsa-code-foreground", "hover:bg-balsa-code-foreground/10", "active:bg-balsa-code-foreground/10"]
                : ["hover:bg-balsa-code-foreground/5", "active:bg-balsa-code-foreground/10"]),
            ]
          : resolvedVariant.value === "solid"
            ? ["border-transparent", "shadow-none", "transform-none", ...(selected ? solidOptionClasses[props.color].selected : solidOptionClasses[props.color].idle)]
            : selected
              ? []
              : neutralIdleClasses[resolvedVariant.value];

      return [
        item.id,
        mergeClasses(
          "shrink-0 rounded-none border-y-0 border-r-0 border-l border-balsa-border-strong first:border-l-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-offset-[-2px]",
          variantClasses,
        ),
      ];
    }),
  ) as Record<string, string>,
);
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="button-group"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="resolvedVariant"
    :data-shape="resolvedShape"
    :data-shadow="resolvedShadow"
    role="group"
    :aria-label="props.label"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :class="rootClasses"
  >
    <Button
      v-for="item in props.options"
      :key="item.id"
      :variant="buttonVariants[item.id]"
      :color="props.color"
      :size="buttonSizes[item.id]"
      :prefix-icon="item.icon"
      :aria-label="item.label"
      :aria-pressed="item.id === model"
      :theme="props.theme"
      :class="buttonClasses[item.id]"
      @click="model = item.id"
    >
      <span :class="labelClasses[item.id]">{{ item.label }}</span>
    </Button>
  </div>
</template>
