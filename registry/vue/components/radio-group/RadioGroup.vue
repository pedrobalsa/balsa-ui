<script setup lang="ts">
import { LoaderCircle } from "@lucide/vue";
import { computed, useAttrs } from "vue";
import { mergeClasses } from "./classes";
import {
  fieldHintClasses,
  fieldStatusMessages,
  getFieldStateColorClass,
  getFieldStatusIcon,
  roundedClasses,
  type FieldSize,
  type FieldStatus,
  type Rounded,
} from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import type { SemanticColor } from "./types";
import Icon from "./Icon.vue";

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type RadioGroupLayout = "column" | "row" | "cards";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    options: readonly RadioGroupOption[];
    name?: string;
    layout?: RadioGroupLayout;
    color?: SemanticColor;
    size?: FieldSize;
    rounded?: Rounded;
    hint?: string;
    disabled?: boolean;
    loading?: boolean;
    status?: FieldStatus;
    statusMessage?: string;
    required?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    layout: "column",
    color: "primary",
    disabled: false,
    loading: false,
    status: "default",
    required: false,
  },
);

const model = defineModel<string>({ default: "" });
const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "radio-group",
  "fields",
  rawProps,
  { size: "md", rounded: "lg" } as const,
);
const isDisabled = computed(() => props.disabled || props.loading);
const hintId = computed(() => props.hint ? `${props.id}-hint` : undefined);
const statusId = computed(() =>
  props.status === "unvalidated" ? `${props.id}-status` : undefined,
);
const describedBy = computed(() =>
  [hintId.value, statusId.value].filter(Boolean).join(" ") || undefined,
);
const effectiveStatusMessage = computed(() =>
  props.status === "unvalidated"
    ? props.statusMessage ?? fieldStatusMessages.unvalidated
    : undefined,
);
const stateIcon = computed(() =>
  props.loading ? LoaderCircle : getFieldStatusIcon(props.status),
);
const rootClasses = computed(() => mergeClasses("min-w-0", attrs.class));
const optionsClasses = computed(() => [
  props.layout === "row"
    ? "flex flex-wrap items-start gap-x-balsa-2xl gap-y-balsa-md"
    : props.layout === "cards"
      ? "grid grid-cols-1 gap-balsa-md"
      : "flex flex-col gap-balsa-md",
]);
const optionBaseClasses = computed(() => [
  "group relative flex min-w-0 cursor-pointer items-start gap-balsa-md transition-[border-color,background-color,box-shadow,opacity]",
  props.layout === "cards"
    ? "border-balsa-input-border bg-balsa-input p-balsa-lg hover:border-balsa-border-strong"
    : "gap-balsa-md",
  props.layout === "cards" ? roundedClasses[props.rounded] : "",
  props.size === "sm" ? "text-sm" : "text-base",
]);
const radioColorClasses: Readonly<Record<SemanticColor, {
  indicator: string;
  selectedCard: string;
  selectedDescription: string;
}>> = {
  primary: {
    indicator: "after:bg-balsa-primary-foreground peer-checked:border-balsa-primary peer-checked:bg-balsa-primary",
    selectedCard: "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground hover:border-balsa-primary hover:bg-balsa-primary active:bg-balsa-primary",
    selectedDescription: "text-balsa-primary-foreground/80",
  },
  secondary: {
    indicator: "after:bg-balsa-secondary-foreground peer-checked:border-balsa-secondary peer-checked:bg-balsa-secondary",
    selectedCard: "border-balsa-secondary bg-balsa-secondary text-balsa-secondary-foreground hover:border-balsa-secondary hover:bg-balsa-secondary active:bg-balsa-secondary",
    selectedDescription: "text-balsa-secondary-foreground/80",
  },
  accent: {
    indicator: "after:bg-balsa-accent-foreground peer-checked:border-balsa-accent peer-checked:bg-balsa-accent",
    selectedCard: "border-balsa-accent bg-balsa-accent text-balsa-accent-foreground hover:border-balsa-accent hover:bg-balsa-accent active:bg-balsa-accent",
    selectedDescription: "text-balsa-accent-foreground/80",
  },
  destructive: {
    indicator: "after:bg-balsa-destructive-foreground peer-checked:border-balsa-destructive peer-checked:bg-balsa-destructive",
    selectedCard: "border-balsa-destructive bg-balsa-destructive text-balsa-destructive-foreground hover:border-balsa-destructive hover:bg-balsa-destructive active:bg-balsa-destructive",
    selectedDescription: "text-balsa-destructive-foreground/80",
  },
  success: {
    indicator: "after:bg-balsa-success-foreground peer-checked:border-balsa-success peer-checked:bg-balsa-success",
    selectedCard: "border-balsa-success bg-balsa-success text-balsa-success-foreground hover:border-balsa-success hover:bg-balsa-success active:bg-balsa-success",
    selectedDescription: "text-balsa-success-foreground/80",
  },
  warning: {
    indicator: "after:bg-balsa-warning-foreground peer-checked:border-balsa-warning peer-checked:bg-balsa-warning",
    selectedCard: "border-balsa-warning bg-balsa-warning text-balsa-warning-foreground hover:border-balsa-warning hover:bg-balsa-warning active:bg-balsa-warning",
    selectedDescription: "text-balsa-warning-foreground/80",
  },
  info: {
    indicator: "after:bg-balsa-info-foreground peer-checked:border-balsa-info peer-checked:bg-balsa-info",
    selectedCard: "border-balsa-info bg-balsa-info text-balsa-info-foreground hover:border-balsa-info hover:bg-balsa-info active:bg-balsa-info",
    selectedDescription: "text-balsa-info-foreground/80",
  },
};
const choiceClasses = computed(() => [
  "pointer-events-none mt-balsa-4xs grid shrink-0 place-items-center rounded-full bg-balsa-input transition-[border-color,background-color,box-shadow] after:size-1.5 after:rounded-full after:opacity-0 after:content-[''] peer-checked:after:opacity-100",
  props.size === "sm" ? "size-4" : "size-5",
  props.status === "unvalidated"
    ? "border-balsa-destructive peer-focus-visible:ring-balsa-destructive/30"
    : "border-balsa-input-border peer-focus-visible:border-balsa-focus-ring peer-focus-visible:ring-balsa-focus-ring/30",
  "peer-focus-visible:ring-2",
  radioColorClasses[props.color].indicator,
  "peer-disabled:border-balsa-border peer-disabled:bg-balsa-disabled",
]);
const stateIconClasses = computed(() => [
  props.loading ? "animate-spin text-balsa-info" : getFieldStateColorClass(props.status),
]);

function optionClasses(option: RadioGroupOption): unknown[] {
  return [mergeClasses(
    ...optionBaseClasses.value,
    props.layout === "cards" && model.value === option.value
      ? radioColorClasses[props.color].selectedCard
      : "",
    isDisabled.value || option.disabled
      ? props.loading
        ? "cursor-progress opacity-60"
        : "cursor-not-allowed opacity-60"
      : "",
  )];
}

function descriptionClasses(option: RadioGroupOption): string[] {
  return [mergeClasses(
    "mt-balsa-3xs block text-sm leading-relaxed",
    props.layout === "cards" && model.value === option.value
      ? radioColorClasses[props.color].selectedDescription
      : "text-balsa-muted-foreground",
  )];
}

function selectOption(value: string): void {
  model.value = value;
}
</script>

<template>
  <fieldset
    :id="props.id"
    data-balsa="radio-group"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-layout="props.layout"
    :data-color="props.color"
    :data-size="props.size"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :data-rounded="props.rounded"
    :data-status="props.status"
    :disabled="isDisabled"
    :aria-busy="props.loading || undefined"
    :aria-describedby="describedBy"
    :class="rootClasses"
  >
    <legend class="mb-balsa-md text-sm font-medium leading-snug text-balsa-foreground">
      <span>{{ props.label }}</span>
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
      <Icon v-if="stateIcon" :icon="stateIcon" size="md" :class="stateIconClasses" />
    </legend>

    <div :class="optionsClasses">
      <label
        v-for="(option, index) in props.options"
        :key="option.value"
        :for="`${props.id}-${index}`"
        :class="optionClasses(option)"
      >
        <input
          :id="`${props.id}-${index}`"
          class="peer sr-only"
          type="radio"
          :name="props.name ?? props.id"
          :value="option.value"
          :checked="model === option.value"
          :disabled="option.disabled"
          :required="props.required"
          :aria-invalid="props.status === 'unvalidated' || undefined"
          :aria-describedby="describedBy"
          @change="selectOption(option.value)"
        />
        <span data-balsa="radio-group-indicator" :class="choiceClasses" aria-hidden="true"></span>
        <span class="min-w-0">
          <span class="block text-sm font-medium leading-snug">{{ option.label }}</span>
          <span
            v-if="option.description"
            :class="descriptionClasses(option)"
          >
            {{ option.description }}
          </span>
        </span>
      </label>
    </div>

    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
    <span
      v-if="effectiveStatusMessage"
      :id="statusId"
      role="alert"
      class="mt-balsa-xs block text-sm font-medium text-balsa-destructive"
    >
      {{ effectiveStatusMessage }}
    </span>
  </fieldset>
</template>
