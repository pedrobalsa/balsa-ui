<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import { computed, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

export type CollapsibleVariant = "underline" | "surface" | "outline" | "soft" | "glass";
export type CollapsibleSize = "sm" | "md" | "lg";
export type CollapsibleHeadingLevel = 2 | 3 | 4 | 5 | 6;

defineOptions({ name: "BalsaCollapsible", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    title: string;
    variant?: CollapsibleVariant;
    size?: CollapsibleSize;
    rounded?: Rounded;
    shadow?: Shadow;
    headingLevel?: CollapsibleHeadingLevel;
    disabled?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    headingLevel: 3,
    disabled: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "collapsible",
  "surfaces",
  rawProps,
  { variant: "underline", size: "md", rounded: "lg", shadow: "auto" } as const,
);

const model = defineModel<boolean>({ default: false });
const attrs = useAttrs();

const variantClasses: Readonly<Record<CollapsibleVariant, string[]>> = {
  underline: ["border-0", "bg-transparent", "text-balsa-foreground"],
  surface: ["border-balsa-border", "bg-balsa-surface", "text-balsa-surface-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-balsa-primary/20", "bg-balsa-primary/5", "text-balsa-foreground"],
  glass: [
    "border-balsa-border/70",
    "bg-balsa-surface/60",
    "text-balsa-foreground",
    "backdrop-balsa",
  ],
};
const sizeClasses: Readonly<
  Record<CollapsibleSize, { trigger: string[]; content: string[]; icon: string }>
> = {
  sm: {
    trigger: ["min-h-8", "gap-balsa-xs", "px-balsa-md", "py-balsa-2xs", "text-sm"],
    content: ["px-balsa-md", "py-balsa-sm", "text-sm"],
    icon: "text-base",
  },
  md: {
    trigger: ["min-h-9", "gap-balsa-sm", "px-balsa-lg", "py-balsa-xs", "text-sm"],
    content: ["px-balsa-lg", "py-balsa-md", "text-sm"],
    icon: "text-lg",
  },
  lg: {
    trigger: ["min-h-10", "gap-balsa-md", "px-balsa-xl", "py-balsa-sm", "text-sm"],
    content: ["px-balsa-xl", "py-balsa-lg", "text-sm"],
    icon: "text-lg",
  },
};

const headingTag = computed(() => `h${props.headingLevel}`);
const triggerId = computed(() => `${props.id}-trigger`);
const contentId = computed(() => `${props.id}-content`);
const state = computed(() => (model.value ? "open" : "closed"));
const rootAttrs = computed(() => withoutClassAttribute(attrs));
const rootClasses = computed(() =>
  mergeClasses(
    props.variant === "underline"
      ? "min-w-0 font-balsa-body"
      : ["min-w-0 overflow-hidden font-balsa-body", roundedClasses[props.rounded]],
    variantClasses[props.variant],
    attrs.class,
  ),
);
const triggerClasses = computed(() =>
  mergeClasses(
    "flex w-full cursor-pointer items-center justify-between text-left transition-colors duration-balsa-fast ease-balsa hover:bg-balsa-muted/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    props.variant === "underline" ? "border-b-(length:--balsa-border-width) border-balsa-border hover:border-balsa-border-strong" : "",
    sizeClasses[props.size].trigger,
  ),
);
const iconClasses = computed(() => [
  "shrink-0",
  "transition-transform",
  "duration-balsa-fast ease-balsa",
  "motion-reduce:transition-none",
  sizeClasses[props.size].icon,
  model.value ? "rotate-180" : "rotate-0",
]);
const panelClasses = computed(() => [
  "grid transition-[grid-template-rows,visibility] duration-balsa-normal ease-balsa motion-reduce:transition-none",
  model.value ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
]);
const contentClasses = computed(() => [
  "min-h-0 min-w-0 overflow-hidden text-balsa-muted-foreground",
  model.value
    ? [
        props.variant === "underline" ? "" : "border-t-(length:--balsa-border-width) border-balsa-border/80",
        sizeClasses[props.size].content,
      ]
    : "",
]);

function toggle(): void {
  if (!props.disabled) model.value = !model.value;
}
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-balsa="collapsible"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-state="state"
    :data-shadow="props.shadow"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-disabled="props.disabled || undefined"
    :class="rootClasses"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <component :is="headingTag" class="m-0">
      <button
        :id="triggerId"
        data-balsa="collapsible-trigger"
        type="button"
        :disabled="props.disabled"
        :aria-expanded="model"
        :aria-controls="contentId"
        :class="triggerClasses"
        @click="toggle"
      >
        <span class="min-w-0">
          <slot name="trigger" :open="model">
            {{ props.title }}
          </slot>
        </span>
        <Icon :icon="ChevronDown" size="md" :class="iconClasses" />
      </button>
    </component>

    <div
      data-balsa="collapsible-presence"
      :data-state="state"
      :aria-hidden="!model"
      :inert="model ? undefined : true"
      :class="panelClasses"
    >
      <div
        :id="contentId"
        data-balsa="collapsible-content"
        role="region"
        :aria-labelledby="triggerId"
        :class="contentClasses"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
