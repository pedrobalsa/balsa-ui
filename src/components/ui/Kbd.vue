<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type KbdVariant = "raised" | "outline" | "soft";
export type KbdSize = "sm" | "md" | "lg";

defineOptions({ name: "BalsaKbd", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    keys?: readonly string[];
    separator?: string;
    variant?: KbdVariant;
    size?: KbdSize;
    rounded?: Rounded;
    shadow?: Shadow;
    accessibleLabel?: string;
    theme?: ThemeInput;
  }>(),
  {
    keys: () => [],
    separator: "+",
  },
);
const { props, theme } = useResolvedThemeProps(
  "kbd",
  "controls",
  rawProps,
  { variant: "soft", size: "md", rounded: "md", shadow: "auto" } as const,
);

const attrs = useAttrs();
const hasKeys = computed(() => props.keys.length > 0);
const rootAttrs = computed(() => withoutClassAttribute(attrs));

const variantClasses: Readonly<Record<KbdVariant, string[]>> = {
  raised: [
    "border-balsa-border-strong",
    "bg-balsa-surface-elevated",
    "text-balsa-surface-elevated-foreground",
  ],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-transparent", "bg-balsa-muted", "text-balsa-muted-foreground"],
};
const sizeClasses: Readonly<Record<KbdSize, string[]>> = {
  sm: ["min-h-5", "min-w-5", "px-balsa-2xs", "text-[0.6875rem]"],
  md: ["min-h-6", "min-w-6", "px-balsa-xs", "text-xs"],
  lg: ["min-h-8", "min-w-8", "px-balsa-sm", "text-sm"],
};
const groupGapClasses: Readonly<Record<KbdSize, string>> = {
  sm: "gap-balsa-3xs",
  md: "gap-balsa-2xs",
  lg: "gap-balsa-xs",
};

/*
 * No bare `border` here. Tailwind compiles it to a literal 1px, which beats the
 * `border-width: var(--balsa-border-width)` the stylesheet sets on this same
 * element -- so a key cap kept a 1px edge at every border setting while every
 * other control moved. The width and style come from the tokens; the variant
 * classes still supply the colour.
 *
 * `font-mono` stays. A key cap is monospace by convention, and that is why the
 * typography control does not move it.
 */
const capClasses = computed(() =>
  mergeClasses(
    "inline-flex shrink-0 select-none items-center justify-center font-mono font-medium leading-none whitespace-nowrap",
    variantClasses[props.variant],
    sizeClasses[props.size],
    roundedClasses[props.rounded],
  ),
);
const classes = computed(() =>
  mergeClasses(
    "align-middle font-mono",
    hasKeys.value
      ? ["inline-flex items-center whitespace-nowrap", groupGapClasses[props.size]]
      : capClasses.value,
    attrs.class,
  ),
);
</script>

<template>
  <kbd
    v-bind="rootAttrs"
    data-balsa="kbd"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-shadow="props.shadow"
    :data-group="hasKeys"
    :aria-label="props.accessibleLabel"
    :class="classes"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
  >
    <template v-if="hasKeys">
      <template v-for="(key, index) in props.keys" :key="`${key}-${index}`">
        <span data-balsa="kbd-key" :class="capClasses">{{ key }}</span>
        <span
          v-if="index < props.keys.length - 1"
          data-balsa="kbd-separator"
          class="text-balsa-muted-foreground"
          aria-hidden="true"
        >
          {{ props.separator }}
        </span>
      </template>
    </template>
    <slot v-else />
  </kbd>
</template>
