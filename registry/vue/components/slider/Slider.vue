<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import { mergeClasses } from "./classes";
import { fieldHintClasses, roundedClasses, type Rounded } from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type SliderModelValue = number | [number, number];
export type SliderOrientation = "horizontal" | "vertical";
export type SliderSize = "sm" | "md" | "lg";

defineOptions({ name: "BalsaSlider", inheritAttrs: false });

const rawProps = withDefaults(
  defineProps<{
    id: string;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    minStepsBetweenThumbs?: number;
    orientation?: SliderOrientation;
    size?: SliderSize;
    rounded?: Rounded;
    disabled?: boolean;
    required?: boolean;
    showValue?: boolean;
    name?: string;
    hint?: string;
    formatValue?: (value: number) => string;
    theme?: ThemeInput;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    minStepsBetweenThumbs: 0,
    orientation: "horizontal",
    disabled: false,
    required: false,
    showValue: true,
  },
);
const { props, theme } = useResolvedThemeProps(
  "slider",
  "fields",
  rawProps,
  { size: "md", rounded: "full" } as const,
);

const model = defineModel<SliderModelValue>({ default: 0 });
const attrs = useAttrs();
const controlElement = ref<HTMLElement | null>(null);
const draggingPointerId = ref<number | null>(null);
const isRange = computed(() => Array.isArray(model.value));
const safeMin = computed(() => Math.min(props.min, props.max));
const safeMax = computed(() => Math.max(props.min, props.max));
const safeStep = computed(() => props.step > 0 ? props.step : 1);
const minimumGap = computed(() =>
  Math.max(0, props.minStepsBetweenThumbs) * safeStep.value,
);
const values = computed<[number, number]>(() => {
  if (Array.isArray(model.value)) {
    const lower = clamp(Math.min(model.value[0], model.value[1]));
    const upper = clamp(Math.max(model.value[0], model.value[1]));
    return [lower, upper];
  }
  return [safeMin.value, clamp(model.value)];
});
const percentages = computed<[number, number]>(() => [
  percentage(values.value[0]),
  percentage(values.value[1]),
]);
const hintId = computed(() => props.hint ? `${props.id}-hint` : undefined);
const rootClasses = computed(() =>
  mergeClasses(
    props.orientation === "vertical" ? "inline-flex min-h-64 flex-col" : "w-full",
    attrs.class,
  ),
);
const controlClasses = computed(() => [
  "relative isolate focus-within:outline-none",
  props.orientation === "vertical"
    ? "min-h-48 w-10 flex-1 self-center"
    : "h-10 w-full",
]);
const trackClasses = computed(() => [
  "absolute bg-balsa-muted",
  roundedClasses[props.rounded],
  props.orientation === "vertical"
    ? "bottom-0 left-1/2 top-0 -translate-x-1/2"
    : "left-0 right-0 top-1/2 -translate-y-1/2",
  props.size === "sm"
    ? props.orientation === "vertical" ? "w-1" : "h-1"
    : props.size === "lg"
      ? props.orientation === "vertical" ? "w-2" : "h-2"
      : props.orientation === "vertical" ? "w-1.5" : "h-1.5",
]);
const fillClasses = computed(() => [
  "absolute bg-balsa-primary",
  roundedClasses[props.rounded],
  props.orientation === "vertical"
    ? "bottom-0 left-1/2 -translate-x-1/2"
    : "top-1/2 -translate-y-1/2",
  props.size === "sm"
    ? props.orientation === "vertical" ? "w-1" : "h-1"
    : props.size === "lg"
      ? props.orientation === "vertical" ? "w-2" : "h-2"
      : props.orientation === "vertical" ? "w-1.5" : "h-1.5",
]);
const fillStyle = computed(() => {
  const start = isRange.value ? percentages.value[0] : 0;
  const end = percentages.value[1];
  return props.orientation === "vertical"
    ? { bottom: `${start}%`, height: `${Math.max(0, end - start)}%` }
    : { left: `${start}%`, width: `${Math.max(0, end - start)}%` };
});
const thumbClasses = computed(() => [
  "absolute z-30 rounded-full border-2 border-balsa-primary bg-balsa-input shadow-balsa-detail transition-[box-shadow,opacity] group-focus-within:ring-2 group-focus-within:ring-balsa-focus-ring/30",
  props.disabled ? "pointer-events-none bg-balsa-disabled opacity-60" : "cursor-grab touch-none active:cursor-grabbing",
  props.size === "sm" ? "size-4" : props.size === "lg" ? "size-6" : "size-5",
]);
const nativeClasses = computed(() => [
  "absolute inset-0 z-20 m-0 size-full appearance-none bg-transparent opacity-0 outline-none",
  props.orientation === "vertical" ? "[writing-mode:vertical-lr] [direction:rtl]" : "",
  props.disabled ? "cursor-not-allowed" : "cursor-pointer",
]);
const firstThumbStyle = computed(() => thumbStyle(
  isRange.value ? percentages.value[0] : percentages.value[1],
));
const secondThumbStyle = computed(() => thumbStyle(percentages.value[1]));
const displayValue = computed(() =>
  isRange.value
    ? `${format(values.value[0])} – ${format(values.value[1])}`
    : format(values.value[1]),
);

function clamp(value: number): number {
  return Math.min(safeMax.value, Math.max(safeMin.value, value));
}

function percentage(value: number): number {
  const span = safeMax.value - safeMin.value;
  return span === 0 ? 0 : ((value - safeMin.value) / span) * 100;
}

function thumbStyle(position: number): Record<string, string> {
  return props.orientation === "vertical"
    ? { bottom: `${position}%`, left: "50%", transform: "translate(-50%, 50%)" }
    : { left: `${position}%`, top: "50%", transform: "translate(-50%, -50%)" };
}

function format(value: number): string {
  return props.formatValue ? props.formatValue(value) : String(value);
}

function updateValue(index: 0 | 1, event: Event): void {
  updateModel(index, (event.target as HTMLInputElement).valueAsNumber);
}

function updateModel(index: 0 | 1, value: number): void {
  const next = clamp(value);
  if (!isRange.value) {
    model.value = next;
    return;
  }

  const [lower, upper] = values.value;
  model.value = index === 0
    ? [Math.min(next, upper - minimumGap.value), upper]
    : [lower, Math.max(next, lower + minimumGap.value)];
}

function valueFromPointer(event: PointerEvent): number | undefined {
  const bounds = controlElement.value?.getBoundingClientRect();
  if (!bounds || bounds.width === 0 || bounds.height === 0) return undefined;
  const position = props.orientation === "vertical"
    ? (bounds.bottom - event.clientY) / bounds.height
    : (event.clientX - bounds.left) / bounds.width;
  const raw = safeMin.value + Math.max(0, Math.min(1, position)) * (safeMax.value - safeMin.value);
  return safeMin.value + Math.round((raw - safeMin.value) / safeStep.value) * safeStep.value;
}

function updateFromPointer(index: 0 | 1, event: PointerEvent): void {
  const value = valueFromPointer(event);
  if (value !== undefined) updateModel(index, value);
}

function handleThumbPointerDown(index: 0 | 1, event: PointerEvent): void {
  if (props.disabled) return;
  event.preventDefault();
  draggingPointerId.value = event.pointerId;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  controlElement.value?.querySelectorAll<HTMLInputElement>('[data-balsa="slider-native"]')[index]?.focus();
  updateFromPointer(index, event);
}

function handleThumbPointerMove(index: 0 | 1, event: PointerEvent): void {
  if (draggingPointerId.value === event.pointerId) updateFromPointer(index, event);
}

function handleThumbPointerEnd(event: PointerEvent): void {
  if (draggingPointerId.value === event.pointerId) draggingPointerId.value = null;
}
</script>

<template>
  <div
    data-balsa="slider"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :style="[attrs.style, theme.explicitPresentation.value?.style]"
    :data-palette="typeof attrs['data-palette'] === 'string' ? attrs['data-palette'] : undefined"
    :data-orientation="props.orientation"
    :data-size="props.size"
    :data-rounded="props.rounded"
    :class="rootClasses"
  >
    <div class="mb-balsa-xs flex items-center justify-between gap-balsa-lg">
      <label :id="`${props.id}-label`" :for="`${props.id}-0`" class="text-sm font-medium text-balsa-foreground">
        {{ props.label }}
        <span v-if="props.required" class="text-balsa-primary" aria-hidden="true">*</span>
      </label>
      <output v-if="props.showValue" class="text-sm tabular-nums text-balsa-muted-foreground">
        {{ displayValue }}
      </output>
    </div>

    <div ref="controlElement" class="group" :class="controlClasses">
      <span :class="trackClasses" aria-hidden="true"></span>
      <span :class="fillClasses" :style="fillStyle" aria-hidden="true"></span>
      <span
        data-balsa="slider-thumb"
        :data-index="isRange ? 0 : 1"
        :class="thumbClasses"
        :style="firstThumbStyle"
        aria-hidden="true"
        @pointerdown="handleThumbPointerDown(isRange ? 0 : 1, $event)"
        @pointermove="handleThumbPointerMove(isRange ? 0 : 1, $event)"
        @pointerup="handleThumbPointerEnd"
        @pointercancel="handleThumbPointerEnd"
      ></span>
      <span
        v-if="isRange"
        data-balsa="slider-thumb"
        data-index="1"
        :class="thumbClasses"
        :style="secondThumbStyle"
        aria-hidden="true"
        @pointerdown="handleThumbPointerDown(1, $event)"
        @pointermove="handleThumbPointerMove(1, $event)"
        @pointerup="handleThumbPointerEnd"
        @pointercancel="handleThumbPointerEnd"
      ></span>

      <input
        :id="`${props.id}-0`"
        data-balsa="slider-native"
        type="range"
        :min="safeMin"
        :max="isRange ? values[1] - minimumGap : safeMax"
        :step="safeStep"
        :value="isRange ? values[0] : values[1]"
        :name="isRange && props.name ? `${props.name}[]` : props.name"
        :disabled="props.disabled"
        :required="props.required"
        :aria-labelledby="isRange ? undefined : `${props.id}-label`"
        :aria-describedby="hintId"
        :aria-label="isRange ? `${props.label} minimum` : undefined"
        :aria-valuetext="format(isRange ? values[0] : values[1])"
        :class="nativeClasses"
        @input="updateValue(isRange ? 0 : 1, $event)"
      />
      <input
        v-if="isRange"
        :id="`${props.id}-1`"
        data-balsa="slider-native"
        type="range"
        :min="values[0] + minimumGap"
        :max="safeMax"
        :step="safeStep"
        :value="values[1]"
        :name="props.name ? `${props.name}[]` : undefined"
        :disabled="props.disabled"
        :required="props.required"
        :aria-describedby="hintId"
        :aria-label="`${props.label} maximum`"
        :aria-valuetext="format(values[1])"
        :class="nativeClasses"
        @input="updateValue(1, $event)"
      />
    </div>

    <span v-if="props.hint" :id="hintId" :class="fieldHintClasses">
      {{ props.hint }}
    </span>
  </div>
</template>
