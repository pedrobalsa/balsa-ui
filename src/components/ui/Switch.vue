<script setup lang="ts">
defineOptions({ name: "BalsaSwitch" });

import { computed } from "vue";
import {
  fieldHintClasses,
  getChoiceTrackClasses,
  type FieldVariant,
  type Rounded,
} from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type SwitchSize = "sm" | "md" | "lg";
const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    hint?: string;
    name?: string;
    disabled?: boolean;
    required?: boolean;
    size?: SwitchSize;
    variant?: FieldVariant;
    rounded?: Rounded;
    theme?: ThemeInput;
  }>(),
  {
    disabled: false,
    required: false,
  },
);
const { props, theme } = useResolvedThemeProps(
  "switch",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "full" } as const,
);

const model = defineModel<boolean>({ default: false });

const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined));
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none after:rounded-none",
  sm: "rounded-sm after:rounded-sm",
  md: "rounded-md after:rounded-md",
  lg: "rounded-lg after:rounded-lg",
  xl: "rounded-xl after:rounded-xl",
  "2xl": "rounded-2xl after:rounded-2xl",
  "3xl": "rounded-3xl after:rounded-3xl",
  full: "rounded-full after:rounded-full",
};
const controlClasses = computed(() => {
  const sizeClasses: Readonly<Record<SwitchSize, string>> = {
    sm: "h-5 w-9 after:h-3 after:w-3 peer-checked:after:translate-x-4",
    md: "h-6 w-10 after:h-4 after:w-4 peer-checked:after:translate-x-4",
    lg: "h-7 w-12 after:h-5 after:w-5 peer-checked:after:translate-x-5",
  };

  return [
    "relative mt-0.5 shrink-0 cursor-pointer border transition-[border-color,background-color,box-shadow,opacity] after:absolute after:left-1 after:top-1 after:bg-balsa-muted-foreground after:transition-transform after:content-[''] peer-checked:border-balsa-primary peer-checked:bg-balsa-primary peer-checked:after:bg-balsa-primary-foreground peer-focus-visible:border-balsa-focus-ring peer-focus-visible:ring-2 peer-focus-visible:ring-balsa-focus-ring/30 peer-disabled:cursor-not-allowed peer-disabled:border-balsa-border peer-disabled:bg-balsa-disabled peer-disabled:after:bg-balsa-disabled-foreground",
    getChoiceTrackClasses(props.variant),
    sizeClasses[props.size],
    roundedClasses[props.rounded],
  ];
});
</script>

<template>
  <label
    :for="props.id"
    data-balsa="switch"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
    class="flex items-start gap-3"
  >
    <input
      :id="props.id"
      v-model="model"
      type="checkbox"
      role="switch"
      :name="props.name"
      :disabled="props.disabled"
      :required="props.required"
      :aria-describedby="hintId"
      class="peer sr-only"
    />
    <span
      data-balsa="switch-control"
      :class="controlClasses"
      aria-hidden="true"
    ></span>
    <span>
      <span class="block text-sm font-medium text-balsa-foreground">
        {{ props.label }}
        <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
      </span>
      <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
        {{ props.hint }}
      </span>
    </span>
  </label>
</template>
