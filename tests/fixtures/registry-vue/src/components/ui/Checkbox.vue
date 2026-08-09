<script setup lang="ts">
defineOptions({ name: "BalsaCheckbox" });

import { Check } from "@lucide/vue";
import { computed } from "vue";
import {
  fieldHintClasses,
  getChoiceInputClasses,
  type FieldVariant,
  type Rounded,
} from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import Icon from "./Icon.vue";

type CheckboxSize = "sm" | "md" | "lg";
const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    size?: CheckboxSize;
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
  "checkbox",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "md" } as const,
);

const model = defineModel<boolean>({ default: false });

const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined));
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const controlClasses = computed(() => {
  const sizeClasses: Readonly<Record<CheckboxSize, string>> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return [
    getChoiceInputClasses(props.variant),
    sizeClasses[props.size],
    roundedClasses[props.rounded],
    "peer checked:border-balsa-primary checked:bg-balsa-primary",
  ];
});
const iconClasses = computed(() => [
  "pointer-events-none absolute text-balsa-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100",
]);
const controlWrapClasses = computed(() => [
  "relative mt-balsa-4xs flex shrink-0 items-center justify-center",
  props.size === "sm" ? "h-4 w-4" : props.size === "lg" ? "h-6 w-6" : "h-5 w-5",
]);
</script>

<template>
  <label
    :for="props.id"
    data-balsa="checkbox"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
    class="flex items-start gap-balsa-md"
  >
    <span :class="controlWrapClasses">
      <input
        :id="props.id"
        v-model="model"
        type="checkbox"
        :disabled="props.disabled"
        :required="props.required"
        :aria-describedby="hintId"
        :class="controlClasses"
        data-balsa="checkbox-control"
      />
      <Icon
        :icon="Check"
        :size="props.size === 'sm' ? 'xs' : props.size === 'lg' ? 'md' : 'sm'"
        :class="iconClasses"
      />
    </span>
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
