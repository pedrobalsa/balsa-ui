<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "./Button.vue";
import Calendar, {
  type CalendarMode,
  type CalendarModelValue,
  type CalendarRange,
} from "./Calendar.vue";
import { mergeClasses } from "./classes";
import type { Rounded } from "./form";
import Popup from "./Popup.vue";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type DatePickerStatus = "default" | "unvalidated";
const rawProps = withDefaults(defineProps<{
  id: string;
  label: string;
  name?: string;
  mode?: Extract<CalendarMode, "single" | "range">;
  locale?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  status?: DatePickerStatus;
  statusMessage?: string;
  min?: Date;
  max?: Date;
  disabledDates?: (date: Date) => boolean;
  clearable?: boolean;
  rounded?: Rounded;
  theme?: ThemeInput;
}>(), {
  mode: "single",
  locale: "en-US",
  placeholder: "Choose a date",
  required: false,
  disabled: false,
  status: "default",
  statusMessage: "Choose a valid date.",
  clearable: true,
});
const { props, theme } = useResolvedThemeProps(
  "date-picker",
  "fields",
  rawProps,
  { rounded: "lg" } as const,
);
const model = defineModel<CalendarModelValue>({ default: null });
const open = ref(false);
const format = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: "medium" }));
const displayValue = computed(() => {
  if (model.value instanceof Date) return format.value.format(model.value);
  if (model.value && !Array.isArray(model.value)) {
    const range = model.value as CalendarRange;
    if (range.start && range.end) return `${format.value.format(range.start)} – ${format.value.format(range.end)}`;
    if (range.start) return `${format.value.format(range.start)} – …`;
  }
  return props.placeholder;
});
const rootClasses = computed(() => mergeClasses(
  "w-full [&_[data-balsa=popup]]:w-full [&_[data-balsa=popup]>button]:w-full [&_[data-balsa=popup]>button]:justify-between",
  props.status === "unvalidated" && "[&_[data-balsa=popup]>button]:border-balsa-destructive [&_[data-balsa=popup]>button]:ring-balsa-destructive",
));
const valueClasses = computed(() => model.value ? "text-balsa-foreground" : "text-balsa-muted-foreground");
const describedBy = computed(() =>
  props.status === "unvalidated" ? `${props.id}-error` : undefined,
);
const effectiveName = computed(() => props.name ?? props.id);
function dateValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
const formValue = computed(() => {
  if (model.value instanceof Date) return dateValue(model.value);
  if (model.value && !Array.isArray(model.value)) {
    const range = model.value as CalendarRange;
    return [
      range.start ? dateValue(range.start) : "",
      range.end ? dateValue(range.end) : "",
    ].join("/");
  }
  return "";
});
function handleSelect(value: CalendarModelValue, close: () => void): void {
  if (props.mode === "single" || (value && !Array.isArray(value) && !(value instanceof Date) && (value as CalendarRange).end)) close();
}
function clear(): void { model.value = null; }
</script>

<template>
  <div
    data-balsa="date-picker"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-status="props.status"
    :class="rootClasses"
    :style="theme.explicitPresentation.value?.style"
  >
    <label :id="`${props.id}-label`" :for="`${props.id}-popup-trigger`" class="mb-2 block text-sm font-bold text-balsa-foreground">
      {{ props.label }} <span v-if="props.required" class="text-balsa-destructive" aria-hidden="true">*</span>
    </label>
    <Popup
      :id="`${props.id}-popup`"
      v-model="open"
      :label="props.label"
      size="lg"
      align="start"
      :rounded="props.rounded"
      :disabled="props.disabled"
      :trigger-aria-labelledby="`${props.id}-label`"
      :trigger-aria-describedby="describedBy"
      :trigger-aria-invalid="props.status === 'unvalidated'"
      :trigger-aria-required="props.required"
      :theme="props.theme"
    >
      <template #trigger>
        <span :class="valueClasses">{{ displayValue }}</span>
        <i class="mdi mdi-calendar-month-outline text-lg text-balsa-primary" aria-hidden="true"></i>
      </template>
      <template #default="{ close }">
        <Calendar
          :id="`${props.id}-calendar`"
          v-model="model"
          :label="props.label"
          :mode="props.mode"
          :locale="props.locale"
          :min="props.min"
          :max="props.max"
          :disabled-dates="props.disabledDates"
          :rounded="props.rounded"
          :theme="props.theme"
          class="border-0 p-0"
          @select="handleSelect($event, close)"
        />
        <div v-if="props.clearable && model" class="mt-3 flex justify-end border-t border-balsa-border pt-3">
          <Button variant="outline" color="secondary" size="sm" @click="clear">Clear date</Button>
        </div>
      </template>
    </Popup>
    <input :name="effectiveName" type="hidden" :value="formValue" />
    <p v-if="props.status === 'unvalidated'" :id="`${props.id}-error`" class="mt-2 text-sm font-bold text-balsa-destructive" role="alert">{{ props.statusMessage }}</p>
  </div>
</template>
