<script setup lang="ts">
import { LoaderCircle } from "@lucide/vue";
import { computed, nextTick, ref, useAttrs, watch } from "vue";
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
  type FieldVariant,
  type Rounded,
} from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import type { SemanticColor } from "./types";
import Icon from "./Icon.vue";

export type InputOTPMode = "numeric" | "alphanumeric";
export type InputOTPVariant = FieldVariant | "solid";

defineOptions({ inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    length?: number;
    mode?: InputOTPMode;
    /** Share the available width between cells instead of fixing their size. */
    fluid?: boolean;
    mask?: boolean;
    grouped?: boolean;
    separatorEvery?: number;
    separator?: string;
    size?: FieldSize;
    variant?: InputOTPVariant;
    color?: SemanticColor;
    rounded?: Rounded;
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
    length: 6,
    mode: "numeric",
    mask: false,
    grouped: false,
    separatorEvery: 0,
    separator: "–",
    color: "primary",
    disabled: false,
    loading: false,
    status: "default",
    required: false,
    autocomplete: "one-time-code",
  },
);

const emit = defineEmits<{
  complete: [value: string];
}>();
const model = defineModel<string>({ default: "" });
const attrs = useAttrs();
const { props, theme } = useResolvedThemeProps(
  "input-otp",
  "fields",
  rawProps,
  { size: "md", variant: "surface", rounded: "lg" } as const,
);
const inputElement = ref<HTMLInputElement | null>(null);
const focused = ref(false);
const caret = ref(0);

const safeLength = computed(() =>
  Number.isFinite(props.length)
    ? Math.max(4, Math.min(10, Math.floor(props.length)))
    : 6,
);
const safeSeparatorEvery = computed(() =>
  Number.isFinite(props.separatorEvery)
    ? Math.max(0, Math.floor(props.separatorEvery))
    : 0,
);
const effectiveSeparatorEvery = computed(() =>
  safeSeparatorEvery.value > 0
    ? safeSeparatorEvery.value
    : props.grouped ? 3 : 0,
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
const cells = computed(() =>
  Array.from({ length: safeLength.value }, (_, index) => ({
    index,
    value: model.value[index] ?? "",
    separatorAfter:
      effectiveSeparatorEvery.value > 0
      && (index + 1) % effectiveSeparatorEvery.value === 0
      && index < safeLength.value - 1,
  })),
);
const controlAttrs = computed(() => {
  const attributes = withoutClassAttribute(attrs);
  return Object.fromEntries(
    Object.entries(attributes).filter(([key]) => key !== "data-palette"),
  );
});
const dataPalette = computed(() =>
  typeof attrs["data-palette"] === "string" ? attrs["data-palette"] : undefined,
);
const groupClasses = computed(() =>
  mergeClasses(
    "relative flex max-w-full items-center gap-balsa-xs p-balsa-3xs",
    props.fluid ? "w-full" : "overflow-x-auto",
    isDisabled.value
      ? props.loading ? "cursor-progress" : "cursor-not-allowed"
      : "cursor-text",
    attrs.class,
  ),
);
const cellVariantClasses: Readonly<Record<InputOTPVariant, string>> = {
  outline: "bg-balsa-background",
  surface: "bg-balsa-input",
  soft: "",
  solid: "",
  glass: "backdrop-blur-md",
};
const cellColorClasses: Readonly<Record<SemanticColor, Record<InputOTPVariant, string>>> = {
  primary: {
    outline: "border-balsa-primary text-balsa-primary",
    surface: "border-balsa-primary/30",
    soft: "border-transparent bg-balsa-primary/15 text-balsa-primary",
    solid: "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground",
    glass: "border-balsa-primary/40 bg-balsa-primary/10 text-balsa-primary",
  },
  secondary: {
    outline: "border-balsa-secondary text-balsa-secondary",
    surface: "border-balsa-secondary/30",
    soft: "border-transparent bg-balsa-secondary/15 text-balsa-secondary",
    solid: "border-balsa-secondary bg-balsa-secondary text-balsa-secondary-foreground",
    glass: "border-balsa-secondary/40 bg-balsa-secondary/10 text-balsa-secondary",
  },
  accent: {
    outline: "border-balsa-accent text-balsa-accent",
    surface: "border-balsa-accent/30",
    soft: "border-transparent bg-balsa-accent/15 text-balsa-accent",
    solid: "border-balsa-accent bg-balsa-accent text-balsa-accent-foreground",
    glass: "border-balsa-accent/40 bg-balsa-accent/10 text-balsa-accent",
  },
  destructive: {
    outline: "border-balsa-destructive text-balsa-destructive",
    surface: "border-balsa-destructive/30",
    soft: "border-transparent bg-balsa-destructive/15 text-balsa-destructive",
    solid: "border-balsa-destructive bg-balsa-destructive text-balsa-destructive-foreground",
    glass: "border-balsa-destructive/40 bg-balsa-destructive/10 text-balsa-destructive",
  },
  success: {
    outline: "border-balsa-success text-balsa-success",
    surface: "border-balsa-success/30",
    soft: "border-transparent bg-balsa-success/15 text-balsa-success",
    solid: "border-balsa-success bg-balsa-success text-balsa-success-foreground",
    glass: "border-balsa-success/40 bg-balsa-success/10 text-balsa-success",
  },
  warning: {
    outline: "border-balsa-warning text-balsa-warning",
    surface: "border-balsa-warning/30",
    soft: "border-transparent bg-balsa-warning/15 text-balsa-warning",
    solid: "border-balsa-warning bg-balsa-warning text-balsa-warning-foreground",
    glass: "border-balsa-warning/40 bg-balsa-warning/10 text-balsa-warning",
  },
  info: {
    outline: "border-balsa-info text-balsa-info",
    surface: "border-balsa-info/30",
    soft: "border-transparent bg-balsa-info/15 text-balsa-info",
    solid: "border-balsa-info bg-balsa-info text-balsa-info-foreground",
    glass: "border-balsa-info/40 bg-balsa-info/10 text-balsa-info",
  },
};
const cellClasses = computed(() => [
  "flex items-center justify-center font-balsa-body font-semibold tabular-nums transition-[border-color,box-shadow,opacity]",
  props.fluid ? "aspect-square min-w-0 flex-1" : "shrink-0",
  cellVariantClasses[props.variant],
  cellColorClasses[props.color][props.variant],
  props.fluid
    ? props.size === "sm" ? "text-base" : "text-lg"
    : props.size === "sm" ? "size-10 text-base" : "size-12 text-lg",
  roundedClasses[props.rounded],
  props.status === "validated"
    ? "border-balsa-success"
    : props.status === "unvalidated"
      ? "border-balsa-destructive"
      : "",
  isDisabled.value ? "bg-balsa-disabled text-balsa-disabled-foreground" : "",
]);
const activeCellClasses = computed(() =>
  props.status === "unvalidated"
    ? "border-balsa-destructive ring-2 ring-balsa-destructive/30"
    : props.status === "validated"
      ? "border-balsa-success ring-2 ring-balsa-success/30"
      : "border-balsa-focus-ring ring-2 ring-balsa-focus-ring/30",
);
const stateIconClasses = computed(() => [
  "shrink-0",
  props.loading ? "animate-spin text-balsa-info" : getFieldStateColorClass(props.status),
]);

function normalize(value: string): string {
  const filtered = props.mode === "numeric"
    ? value.replace(/\D/g, "")
    : value.replace(/[^a-z0-9]/gi, "");
  return filtered.slice(0, safeLength.value);
}

function updateCaret(): void {
  caret.value = inputElement.value?.selectionStart ?? model.value.length;
}

function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const next = normalize(input.value);
  model.value = next;
  input.value = next;
  nextTick(updateCaret);
  if (next.length === safeLength.value) emit("complete", next);
}

function handleKeydown(event: KeyboardEvent): void {
  const input = inputElement.value;
  if (!input) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const next = Math.max(0, Math.min(model.value.length, caret.value + direction));
    input.setSelectionRange(next, next);
    caret.value = next;
  }
}

function focusInput(): void {
  inputElement.value?.focus();
}

function getCellClasses(index: number): (string | string[])[] {
  return [
    cellClasses.value,
    focused.value && index === Math.min(caret.value, safeLength.value - 1)
      ? activeCellClasses.value
      : "",
  ];
}

watch(
  [model, safeLength, () => props.mode],
  () => {
    const normalized = normalize(model.value);
    if (normalized !== model.value) model.value = normalized;
    caret.value = Math.min(caret.value, normalized.length);
  },
  { immediate: true },
);
</script>

<template>
  <div
    data-balsa="input-otp"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-palette="dataPalette"
    :data-size="props.size"
    :data-variant="props.variant"
    :data-color="props.color"
    :style="theme.explicitPresentation.value?.style"
    :data-grouped="effectiveSeparatorEvery > 0 || undefined"
    :data-rounded="props.rounded"
    :data-status="props.status"
  >
    <label :for="props.id" :class="fieldLabelClasses">
      {{ props.label }}
      <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
    </label>
    <div :class="groupClasses" @click="focusInput">
      <input
        ref="inputElement"
        v-bind="controlAttrs"
        :id="props.id"
        data-balsa-control
        class="absolute inset-0 z-10 size-full cursor-inherit opacity-0"
        :name="props.name"
        :value="model"
        :maxlength="safeLength"
        :inputmode="props.mode === 'numeric' ? 'numeric' : 'text'"
        :pattern="props.mode === 'numeric' ? '[0-9]*' : undefined"
        :autocomplete="props.autocomplete"
        :disabled="isDisabled"
        :required="props.required"
        :aria-busy="props.loading || undefined"
        :aria-invalid="props.status === 'unvalidated' || undefined"
        :aria-describedby="describedBy"
        @input="handleInput"
        @keydown="handleKeydown"
        @select="updateCaret"
        @focus="focused = true; updateCaret()"
        @blur="focused = false"
      />
      <template v-for="cell in cells" :key="cell.index">
        <span
          data-balsa="input-otp-cell"
          :data-active="focused && cell.index === Math.min(caret, safeLength - 1)"
          :class="getCellClasses(cell.index)"
          aria-hidden="true"
        >
          <slot
            name="cell"
            :index="cell.index"
            :value="cell.value"
            :active="focused && cell.index === Math.min(caret, safeLength - 1)"
          >
            {{ props.mask && cell.value ? "•" : cell.value }}
          </slot>
        </span>
        <span
          v-if="cell.separatorAfter"
          class="shrink-0 text-balsa-muted-foreground"
          aria-hidden="true"
        >
          {{ props.separator }}
        </span>
      </template>
      <Icon v-if="stateIcon" :icon="stateIcon" size="md" :class="stateIconClasses" />
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
  </div>
</template>
