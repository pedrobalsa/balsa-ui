<script setup lang="ts">
import { LoaderCircle } from "@lucide/vue";
import { computed, nextTick, onMounted, ref, useAttrs, watch } from "vue";
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getFieldStateColorClass,
  getFieldStatusIcon,
  getTextareaControlClasses,
  type FieldSize,
  type FieldStatus,
  type FieldVariant,
  type Rounded,
  type TextareaResize,
} from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";
import Icon from "./Icon.vue";

defineOptions({ name: "BalsaTextarea", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    size?: FieldSize;
    variant?: FieldVariant;
    rounded?: Rounded;
    rows?: number;
    autoExpand?: boolean;
    maxHeight?: number;
    resizable?: TextareaResize;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    loading?: boolean;
    status?: FieldStatus;
    statusMessage?: string;
    required?: boolean;
    name?: string;
    autocomplete?: string;
    maxlength?: number;
    minlength?: number;
    readonly?: boolean;
    theme?: ThemeInput;
  }>(),
  {
    rows: 4,
    autoExpand: false,
    resizable: "vertical",
    disabled: false,
    loading: false,
    status: "default",
    required: false,
    readonly: false,
  },
);

const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "textarea",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "lg" } as const,
);
const model = defineModel<string>({ default: "" });
const textarea = ref<HTMLTextAreaElement | null>(null);

const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined));
const statusId = computed(() =>
  props.status === "unvalidated" ? `${props.id}-status` : undefined,
);
const describedBy = computed(
  () => [hintId.value, statusId.value].filter(Boolean).join(" ") || undefined,
);
const isDisabled = computed(() => props.disabled || props.loading);
const ariaBusy = computed(() => (props.loading ? "true" : undefined));
const ariaInvalid = computed(() =>
  props.status === "unvalidated" ? "true" : undefined,
);
const stateIcon = computed(() =>
  props.loading ? LoaderCircle : getFieldStatusIcon(props.status),
);
const stateIconClasses = computed(() => [
  "pointer-events-none absolute right-4 top-4",
  props.loading ? "animate-spin text-balsa-info" : "",
  props.loading ? "" : getFieldStateColorClass(props.status),
]);
const controlAttrs = computed(() => withoutClassAttribute(attrs));
const controlClasses = computed(() =>
  mergeClasses(
    getTextareaControlClasses(
      props.status,
      props.disabled,
      props.loading,
      props.size,
      props.rounded,
      props.resizable,
      Boolean(stateIcon.value),
      props.variant,
    ),
    attrs.class,
  ),
);
const effectiveStatusMessage = computed(() => {
  if (props.status !== "unvalidated") return undefined;
  return props.statusMessage ?? fieldStatusMessages[props.status];
});
const statusRole = computed(() =>
  props.status === "unvalidated" ? "alert" : undefined,
);

function resizeToContent(): void {
  const element = textarea.value;
  if (!element) return;

  if (!props.autoExpand) {
    element.style.height = "";
    element.style.overflowY = "";
    return;
  }

  element.style.height = "auto";
  const contentHeight = element.scrollHeight;
  const maxHeight = props.maxHeight;
  const height = maxHeight ? Math.min(contentHeight, maxHeight) : contentHeight;
  element.style.height = `${height}px`;
  element.style.overflowY = maxHeight && contentHeight > maxHeight ? "auto" : "hidden";
}

function handleInput(event: Event): void {
  model.value = (event.target as HTMLTextAreaElement).value;
  void nextTick(resizeToContent);
}

watch(
  [model, () => props.autoExpand, () => props.maxHeight, () => props.rows],
  () => void nextTick(resizeToContent),
);

onMounted(() => {
  resizeToContent();
});
</script>

<template>
  <div
    data-balsa="textarea"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
  >
    <label :for="props.id" :class="fieldLabelClasses">
      {{ props.label }}
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <textarea
        v-bind="controlAttrs"
        ref="textarea"
        :id="props.id"
        :value="model"
        :name="props.name"
        :rows="props.rows"
        :placeholder="props.placeholder"
        :disabled="isDisabled"
        :readonly="props.readonly"
        :required="props.required"
        :maxlength="props.maxlength"
        :minlength="props.minlength"
        :autocomplete="props.autocomplete"
        :aria-busy="ariaBusy"
        :aria-invalid="ariaInvalid"
        :aria-describedby="describedBy"
        :class="controlClasses"
        data-balsa-control
        @input="handleInput"
      ></textarea>
      <Icon v-if="stateIcon" :icon="stateIcon" size="md" :class="stateIconClasses" />
    </div>
    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
    <span
      v-if="effectiveStatusMessage"
      :id="statusId"
      :role="statusRole"
      class="mt-balsa-xs block text-sm font-medium text-balsa-destructive"
    >
      {{ effectiveStatusMessage }}
    </span>
  </div>
</template>
