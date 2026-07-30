<script setup lang="ts">
import { computed, useAttrs, useSlots } from "vue";
import { mergeClasses, withoutClassAttribute } from "./classes";
import {
  fieldHintClasses,
  fieldLabelClasses,
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

export type InputGroupLayout = "inline" | "stacked";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    type?: "text" | "email" | "url" | "search";
    layout?: InputGroupLayout;
    startText?: string;
    endText?: string;
    startIcon?: string;
    endIcon?: string;
    size?: FieldSize;
    rounded?: Rounded;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    loading?: boolean;
    status?: FieldStatus;
    statusMessage?: string;
    required?: boolean;
    name?: string;
    autocomplete?: string;
    theme?: ThemeInput;
  }>(),
  {
    type: "text",
    layout: "inline",
    disabled: false,
    loading: false,
    status: "default",
    required: false,
  },
);

const model = defineModel<string>({ default: "" });
const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "input-group",
  "fields",
  rawProps,
  { size: "md", rounded: "lg" } as const,
);
const slots = useSlots();
const controlAttrs = computed(() => {
  const attributes = withoutClassAttribute(attrs);
  return Object.fromEntries(
    Object.entries(attributes).filter(([key]) => key !== "data-palette"),
  );
});
const dataPalette = computed(() =>
  typeof attrs["data-palette"] === "string" ? attrs["data-palette"] : undefined,
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
  props.loading ? "mdi-loading" : getFieldStatusIcon(props.status),
);
const hasStart = computed(() =>
  Boolean(props.startText || props.startIcon || slots.start),
);
const hasEnd = computed(() =>
  Boolean(props.endText || props.endIcon || slots.end),
);

const groupClasses = computed(() => [
  "relative isolate flex w-full border bg-balsa-input text-balsa-input-foreground transition-[border-color,box-shadow,opacity] focus-within:border-balsa-focus-ring focus-within:ring-2 focus-within:ring-balsa-focus-ring/30",
  props.layout === "stacked" ? "flex-col" : "items-stretch",
  roundedClasses[props.rounded],
  props.status === "validated"
    ? "border-balsa-success focus-within:border-balsa-success focus-within:ring-balsa-success/30"
    : props.status === "unvalidated"
      ? "border-balsa-destructive focus-within:border-balsa-destructive focus-within:ring-balsa-destructive/30"
      : "border-balsa-input-border",
  isDisabled.value ? "bg-balsa-disabled text-balsa-disabled-foreground" : "",
]);
const controlClasses = computed(() =>
  mergeClasses(
    "peer min-w-0 flex-1 border-0 bg-transparent font-balsa-body text-balsa-input-foreground outline-none placeholder:text-balsa-muted-foreground disabled:text-balsa-disabled-foreground",
    props.size === "sm" ? "h-8 px-3 text-sm" : "h-9 px-3 text-sm",
    props.layout === "stacked" ? "w-full" : "",
    isDisabled.value
      ? props.loading
        ? "cursor-progress"
        : "cursor-not-allowed"
      : "cursor-text",
    stateIcon.value && !hasEnd.value
      ? "pr-10"
      : "",
    attrs.class,
  ),
);
const addonBaseClasses = computed(() => [
  "flex shrink-0 items-center gap-2 bg-balsa-muted px-3 text-balsa-muted-foreground",
  props.size === "sm" ? "min-h-8 text-sm" : "min-h-9 text-sm",
]);
const startClasses = computed(() => [
  addonBaseClasses.value,
  "order-first",
  props.layout === "stacked"
    ? "w-full border-b border-balsa-input-border"
    : "border-r border-balsa-input-border",
]);
const endClasses = computed(() => [
  addonBaseClasses.value,
  props.layout === "stacked"
    ? "w-full border-t border-balsa-input-border"
    : "border-l border-balsa-input-border",
]);
const stateIconClasses = computed(() => [
  "mdi pointer-events-none absolute z-10",
  stateIcon.value,
  props.layout === "inline"
    ? props.size === "sm"
      ? "right-3 top-1/2 -translate-y-1/2 text-base"
      : "right-4 top-1/2 -translate-y-1/2 text-lg"
    : "right-3 top-1/2 -translate-y-1/2 text-lg",
  props.loading ? "animate-spin text-balsa-info" : getFieldStateColorClass(props.status),
]);

function handleInput(event: Event): void {
  model.value = (event.target as HTMLInputElement).value;
}
</script>

<template>
  <div
    data-balsa="input-group"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="dataPalette"
    :data-layout="props.layout"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-status="props.status"
    :style="theme.explicitPresentation.value?.style"
  >
    <label :for="props.id" :class="fieldLabelClasses">
      {{ props.label }}
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
    </label>
    <div :class="groupClasses">
      <input
        v-bind="controlAttrs"
        :id="props.id"
        data-balsa-control
        :type="props.type"
        :name="props.name"
        :value="model"
        :placeholder="props.placeholder"
        :autocomplete="props.autocomplete"
        :disabled="isDisabled"
        :required="props.required"
        :aria-busy="props.loading || undefined"
        :aria-invalid="props.status === 'unvalidated' || undefined"
        :aria-describedby="describedBy"
        :class="controlClasses"
        @input="handleInput"
      />

      <div v-if="hasStart" data-balsa="input-group-start" :class="startClasses">
        <slot name="start">
          <i v-if="props.startIcon" :class="['mdi', props.startIcon]" aria-hidden="true"></i>
          <span v-if="props.startText">{{ props.startText }}</span>
        </slot>
      </div>
      <div v-if="hasEnd" data-balsa="input-group-end" :class="endClasses">
        <slot name="end">
          <span v-if="props.endText">{{ props.endText }}</span>
          <i v-if="props.endIcon" :class="['mdi', props.endIcon]" aria-hidden="true"></i>
        </slot>
      </div>
      <i
        v-if="stateIcon && !hasEnd"
        :class="stateIconClasses"
        aria-hidden="true"
      ></i>
    </div>
    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
    <span
      v-if="effectiveStatusMessage"
      :id="statusId"
      role="alert"
      class="mt-2 block text-sm font-bold text-balsa-destructive"
    >
      {{ effectiveStatusMessage }}
    </span>
  </div>
</template>
