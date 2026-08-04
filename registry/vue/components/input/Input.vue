<script setup lang="ts">
import { LoaderCircle } from "@lucide/vue";
import { computed, ref, useAttrs } from "vue";
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getFieldStateColorClass,
  getFieldStatusIcon,
  getTextControlClasses,
  type FieldSize,
  type FieldStatus,
  type FieldVariant,
  type Rounded,
} from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import { mergeClasses, withoutClassAttribute } from "./classes";
import Icon from "./Icon.vue";

type InputType = "text" | "password" | "number" | "date" | "email" | "phone" | "monetary" | "percentage";

const phoneMask = "(##) #####-####";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    type?: InputType;
    size?: FieldSize;
    variant?: FieldVariant;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
    loading?: boolean;
    status?: FieldStatus;
    statusMessage?: string;
    required?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    autocomplete?: string;
    mask?: string;
    currency?: string;
    locale?: string;
    rounded?: Rounded;
    theme?: ThemeInput;
  }>(),
  {
    type: "text",
    disabled: false,
    loading: false,
    status: "default",
    required: false,
    currency: "USD",
    locale: "en-US",
  },
);

const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "input",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "lg" } as const,
);
const model = defineModel<string | number>({ default: "" });
const percentageDraft = ref<string | undefined>();

const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined));
const statusId = computed(() =>
  props.status === "unvalidated" ? `${props.id}-status` : undefined,
);
const describedBy = computed(
  () => [hintId.value, statusId.value].filter(Boolean).join(" ") || undefined,
);
const isDisabled = computed(() => props.disabled || props.loading);
const resolvedMask = computed(() =>
  props.mask ?? (props.type === "phone" ? phoneMask : undefined),
);
const isMonetary = computed(() => props.type === "monetary");
const isPercentage = computed(() => props.type === "percentage");
const nativeType = computed(() =>
  resolvedMask.value || isMonetary.value || isPercentage.value
    ? "text"
    : props.type,
);
const inputMode = computed(() =>
  props.type === "phone"
    ? "tel"
    : isMonetary.value || isPercentage.value
      ? "decimal"
      : undefined,
);
const displayedValue = computed(() => {
  if (isMonetary.value) return formatMonetaryValue(model.value);
  if (resolvedMask.value) return formatMask(String(model.value), resolvedMask.value);
  if (isPercentage.value) return percentageDraft.value ?? formatPercentageValue(model.value);
  return model.value;
});
const ariaBusy = computed(() => (props.loading ? "true" : undefined));
const ariaInvalid = computed(() =>
  props.status === "unvalidated" ? "true" : undefined,
);
const stateIcon = computed(() =>
  props.loading ? LoaderCircle : getFieldStatusIcon(props.status),
);
const stateIconClasses = computed(() => [
  "pointer-events-none absolute top-1/2 -translate-y-1/2",
  props.size === "sm" ? "right-3 text-base" : "right-4 text-lg",
  props.loading ? "text-balsa-info" : getFieldStateColorClass(props.status),
  ...(props.loading ? ["animate-spin"] : []),
]);
const percentageSuffixClasses = computed(() => [
  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-balsa-muted-foreground",
  stateIcon.value
    ? props.size === "sm"
      ? "right-9 text-sm"
      : "right-11 text-base"
    : props.size === "sm"
      ? "right-3 text-sm"
      : "right-4 text-base",
]);
const controlAttrs = computed(() => withoutClassAttribute(attrs));
const controlClasses = computed(() =>
  mergeClasses(
    getTextControlClasses(
      props.status,
      Boolean(stateIcon.value) || isPercentage.value,
      props.disabled,
      props.loading,
      props.size,
      props.rounded,
      props.variant,
    ),
    isPercentage.value && stateIcon.value
      ? props.size === "sm"
        ? "pr-16"
        : "pr-20"
      : [],
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

function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (isMonetary.value) {
    const value = formatMonetaryInput(input.value);
    model.value = value.amount;
    input.value = value.display;
    return;
  }

  if (resolvedMask.value) {
    const value = formatMask(input.value, resolvedMask.value);
    model.value = value;
    input.value = value;
    return;
  }

  if (isPercentage.value) {
    const value = formatPercentageInput(input.value);
    percentageDraft.value = value.display;
    model.value = value.amount;
    input.value = value.display;
    return;
  }

  model.value =
    props.type === "number" && input.value !== ""
      ? input.valueAsNumber
      : input.value;
}

function handleBlur(): void {
  if (!isPercentage.value) return;
  percentageDraft.value = undefined;
}

function formatMask(value: string, pattern: string): string {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let index = 0;

  for (let position = 0; position < pattern.length; position += 1) {
    const character = pattern[position];
    if (character === "#") {
      const digit = digits[index];
      if (!digit) break;
      result += digit;
      index += 1;
      continue;
    }

    if (index < digits.length) result += character;
  }

  return result;
}

function formatMonetaryValue(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";

  const amount = typeof value === "number"
    ? value
    : Number(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(amount)) return "";

  return new Intl.NumberFormat(props.locale, {
    style: "currency",
    currency: props.currency,
  }).format(amount);
}

function formatMonetaryInput(value: string): { amount: number | ""; display: string } {
  const digits = value.replace(/\D/g, "");
  if (!digits) return { amount: "", display: "" };

  const amount = Number(digits) / 100;
  return {
    amount,
    display: formatMonetaryValue(amount),
  };
}

function formatPercentageValue(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";

  const amount = typeof value === "number"
    ? value
    : Number(value.replace(",", "."));
  if (!Number.isFinite(amount)) return "";

  return String(Math.min(Math.max(amount, 0), 100));
}

function formatPercentageInput(value: string): { amount: number | ""; display: string } {
  const normalized = value
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");
  const decimalIndex = normalized.indexOf(".");
  const whole = decimalIndex === -1
    ? normalized
    : normalized.slice(0, decimalIndex);
  const fraction = decimalIndex === -1
    ? undefined
    : normalized.slice(decimalIndex + 1).replaceAll(".", "").slice(0, 2);
  const display = fraction === undefined
    ? whole
    : (whole || "0") + "." + fraction;

  if (!display || display === ".") return { amount: "", display: "" };

  const amount = Number(display);
  if (!Number.isFinite(amount)) return { amount: "", display: "" };

  const clamped = Math.min(Math.max(amount, 0), 100);
  return {
    amount: clamped,
    display: clamped === amount ? display : String(clamped),
  };
}
</script>

<template>
  <div
    data-balsa="input"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-rounded="props.rounded"
    :data-variant="props.variant"
    :style="theme.explicitPresentation.value?.style"
  >
    <label :for="props.id" :class="fieldLabelClasses">
      {{ props.label }}
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <input
        v-bind="controlAttrs"
        :id="props.id"
        :type="nativeType"
        :value="displayedValue"
        :inputmode="inputMode"
        :placeholder="props.placeholder"
        :disabled="isDisabled"
        :required="props.required"
        :min="props.min"
        :max="props.max"
        :step="props.step"
        :autocomplete="props.autocomplete"
        :aria-busy="ariaBusy"
        :aria-invalid="ariaInvalid"
        :aria-describedby="describedBy"
        :class="controlClasses"
        data-balsa-control
        @input="handleInput"
        @blur="handleBlur"
      />
      <Icon v-if="stateIcon" :icon="stateIcon" size="md" :class="stateIconClasses" />
      <span
        v-if="isPercentage"
        :class="percentageSuffixClasses"
        aria-hidden="true"
      >
        %
      </span>
    </div>
    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
    <span
      v-if="effectiveStatusMessage"
      :id="statusId"
      :role="statusRole"
      class="mt-2 block text-sm font-medium text-balsa-destructive"
    >
      {{ effectiveStatusMessage }}
    </span>
  </div>
</template>
