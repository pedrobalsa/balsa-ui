<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import Button from "./Button.vue";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

export type CalendarMode = "single" | "multiple" | "range";
export interface CalendarRange { start?: Date; end?: Date }
export type CalendarModelValue = Date | readonly Date[] | CalendarRange | null;

const rawProps = withDefaults(defineProps<{
  id: string;
  label: string;
  mode?: CalendarMode;
  locale?: string;
  weekStartsOn?: number;
  month?: Date;
  min?: Date;
  max?: Date;
  disabledDates?: (date: Date) => boolean;
  outsideDays?: boolean;
  fixedWeeks?: boolean;
  months?: 1 | 2;
  disabled?: boolean;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
}>(), {
  mode: "single",
  locale: "en-US",
  weekStartsOn: 0,
  outsideDays: true,
  fixedWeeks: true,
  months: 1,
  disabled: false,
});
const { props, theme } = useResolvedThemeProps(
  "calendar",
  "surfaces",
  rawProps,
  { rounded: "lg", shadow: "auto" } as const,
);
const model = defineModel<CalendarModelValue>({ default: null });
const emit = defineEmits<{ "update:month": [month: Date]; select: [value: CalendarModelValue] }>();
const initialMonthDate = props.month ?? selectedAnchor() ?? new Date();
const initialFocusDate = isDisabled(initialMonthDate)
  ? firstEnabledDate(startOfMonth(initialMonthDate)) ?? initialMonthDate
  : initialMonthDate;
const visibleMonth = ref(startOfMonth(initialMonthDate));
const focusedKey = ref(dateKey(initialFocusDate));

function startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function startOfMonth(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addDays(date: Date, amount: number): Date { const next = new Date(date); next.setDate(next.getDate() + amount); return startOfDay(next); }
function addMonths(date: Date, amount: number): Date { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function addCalendarMonths(date: Date, amount: number): Date {
  const destination = new Date(date.getFullYear(), date.getMonth() + amount + 1, 0);
  return new Date(destination.getFullYear(), destination.getMonth(), Math.min(date.getDate(), destination.getDate()));
}
function dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function sameDay(a?: Date, b?: Date): boolean { return Boolean(a && b && dateKey(a) === dateKey(b)); }
function selectedAnchor(): Date | undefined {
  const value = model.value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value[0];
  if (value && typeof value === "object") return (value as CalendarRange).start;
  return undefined;
}
function rangeValue(): CalendarRange {
  const value = model.value;
  return value && !Array.isArray(value) && !(value instanceof Date) ? value as CalendarRange : {};
}
function isDisabled(date: Date): boolean {
  const day = startOfDay(date);
  return props.disabled || Boolean(
    (props.min && day < startOfDay(props.min)) ||
    (props.max && day > startOfDay(props.max)) ||
    props.disabledDates?.(day),
  );
}
function isSelected(date: Date): boolean {
  if (model.value instanceof Date) return sameDay(model.value, date);
  if (Array.isArray(model.value)) return model.value.some((item) => sameDay(item, date));
  const range = rangeValue();
  return sameDay(range.start, date) || sameDay(range.end, date);
}
function isInRange(date: Date): boolean {
  const { start, end } = rangeValue();
  return Boolean(start && end && date > startOfDay(start) && date < startOfDay(end));
}
function selectDate(date: Date): void {
  if (isDisabled(date)) return;
  const day = startOfDay(date);
  if (props.mode === "single") model.value = day;
  else if (props.mode === "multiple") {
    const values = Array.isArray(model.value) ? [...model.value] : [];
    model.value = values.some((item) => sameDay(item, day))
      ? values.filter((item) => !sameDay(item, day))
      : [...values, day];
  } else {
    const range = rangeValue();
    model.value = !range.start || range.end || day < startOfDay(range.start)
      ? { start: day }
      : { start: range.start, end: day };
  }
  focusedKey.value = dateKey(day);
  emit("select", model.value);
}
function monthGrid(month: Date): readonly Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - normalizedWeekStart.value + 7) % 7;
  const start = addDays(first, -offset);
  const days = props.fixedWeeks ? 42 : Math.ceil((offset + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: days }, (_, index) => addDays(start, index));
}
const displayedMonths = computed(() => Array.from({ length: props.months }, (_, index) => addMonths(visibleMonth.value, index)));
const normalizedWeekStart = computed(() => Math.max(0, Math.min(6, Math.trunc(props.weekStartsOn))));
const weekdays = computed(() => {
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) => addDays(sunday, (index + normalizedWeekStart.value) % 7));
});
const monthFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { month: "long", year: "numeric" }));
const weekdayFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { weekday: "short" }));
const dayFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { day: "numeric" }));
const fullFormatter = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: "full" }));
const classes = computed(() => mergeClasses("border border-balsa-border bg-balsa-surface p-4 text-balsa-foreground", roundedClasses[props.rounded]));
const monthsClasses = computed(() => props.months === 2 ? "grid gap-6 lg:grid-cols-2" : "grid");
function dayClasses(date: Date, month: Date): string {
  return mergeClasses(
    "grid size-10 place-items-center rounded-balsa-control text-sm font-bold transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:opacity-35",
    date.getMonth() !== month.getMonth() && "text-balsa-muted-foreground",
    isInRange(date) && "bg-balsa-selected text-balsa-selected-foreground",
    isSelected(date) && "bg-balsa-primary text-balsa-primary-foreground hover:bg-balsa-primary-hover",
  );
}
function changeMonth(amount: number): void {
  const nextMonth = addMonths(visibleMonth.value, amount);
  if (!canChangeMonth(amount)) return;
  visibleMonth.value = nextMonth;
  focusedKey.value = dateKey(firstEnabledDate(nextMonth) ?? nextMonth);
  emit("update:month", visibleMonth.value);
}
function canChangeMonth(amount: number): boolean {
  const nextMonth = addMonths(visibleMonth.value, amount);
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
  if (amount < 0 && props.min && lastDay < startOfDay(props.min)) return false;
  if (amount > 0 && props.max && nextMonth > startOfDay(props.max)) return false;
  return true;
}
function firstEnabledDate(month: Date): Date | undefined {
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= total; day += 1) {
    const candidate = new Date(month.getFullYear(), month.getMonth(), day);
    if (!isDisabled(candidate)) return candidate;
  }
  return undefined;
}
function enabledDateFrom(date: Date, direction: 1 | -1): Date | undefined {
  let candidate = date;
  for (let attempt = 0; attempt < 366; attempt += 1) {
    if (!isDisabled(candidate)) return candidate;
    candidate = addDays(candidate, direction);
  }
  return undefined;
}
async function focusDate(date: Date): Promise<void> {
  focusedKey.value = dateKey(date);
  if (date.getMonth() !== visibleMonth.value.getMonth() || date.getFullYear() !== visibleMonth.value.getFullYear()) {
    visibleMonth.value = startOfMonth(date);
    emit("update:month", visibleMonth.value);
  }
  await nextTick();
  document.getElementById(`${props.id}-day-${dateKey(date)}`)?.focus();
}
function handleDayKeydown(event: KeyboardEvent, date: Date): void {
  let next: Date | undefined;
  if (event.key === "ArrowLeft") next = addDays(date, -1);
  else if (event.key === "ArrowRight") next = addDays(date, 1);
  else if (event.key === "ArrowUp") next = addDays(date, -7);
  else if (event.key === "ArrowDown") next = addDays(date, 7);
  else if (event.key === "Home") next = addDays(date, -((date.getDay() - normalizedWeekStart.value + 7) % 7));
  else if (event.key === "End") next = addDays(date, 6 - ((date.getDay() - normalizedWeekStart.value + 7) % 7));
  else if (event.key === "PageUp") next = addCalendarMonths(date, event.shiftKey ? -12 : -1);
  else if (event.key === "PageDown") next = addCalendarMonths(date, event.shiftKey ? 12 : 1);
  else return;
  event.preventDefault();
  const direction = event.key === "ArrowLeft"
    || event.key === "ArrowUp"
    || event.key === "Home"
    || event.key === "PageUp"
    ? -1
    : 1;
  const enabledDate = enabledDateFrom(next, direction);
  if (enabledDate) void focusDate(enabledDate);
}
watch(() => props.month, (month) => {
  if (!month) return;
  visibleMonth.value = startOfMonth(month);
  focusedKey.value = dateKey(firstEnabledDate(visibleMonth.value) ?? visibleMonth.value);
});
</script>

<template>
  <section
    :id="props.id"
    data-balsa="calendar"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-mode="props.mode"
    :data-shadow="props.shadow"
    :aria-label="props.label"
    :class="classes"
    :style="theme.explicitPresentation.value?.style"
  >
    <header class="mb-4 flex items-center justify-between gap-3">
      <Button shape="fab" size="sm" variant="outline" prefix-icon="mdi-chevron-left" aria-label="Previous month" :disabled="props.disabled || !canChangeMonth(-1)" @click="changeMonth(-1)" />
      <p class="font-bold">{{ monthFormatter.format(visibleMonth) }}</p>
      <Button shape="fab" size="sm" variant="outline" prefix-icon="mdi-chevron-right" aria-label="Next month" :disabled="props.disabled || !canChangeMonth(1)" @click="changeMonth(1)" />
    </header>
    <div :class="monthsClasses">
      <div v-for="displayedMonth in displayedMonths" :key="dateKey(displayedMonth)">
        <p v-if="props.months === 2" class="mb-2 text-center font-bold">{{ monthFormatter.format(displayedMonth) }}</p>
        <div role="grid" :aria-label="monthFormatter.format(displayedMonth)">
          <div role="row" class="grid grid-cols-7">
            <span v-for="weekday in weekdays" :key="weekday.getDay()" role="columnheader" class="grid size-10 place-items-center text-xs font-bold text-balsa-muted-foreground">{{ weekdayFormatter.format(weekday) }}</span>
          </div>
          <div v-for="(week, weekIndex) in Math.ceil(monthGrid(displayedMonth).length / 7)" :key="weekIndex" role="row" class="grid grid-cols-7">
            <template v-for="date in monthGrid(displayedMonth).slice((week - 1) * 7, week * 7)" :key="dateKey(date)">
              <span v-if="!props.outsideDays && date.getMonth() !== displayedMonth.getMonth()" class="size-10" aria-hidden="true"></span>
              <button
                v-else
                :id="`${props.id}-day-${dateKey(date)}`"
                type="button"
                role="gridcell"
                :class="dayClasses(date, displayedMonth)"
                :disabled="isDisabled(date)"
                :tabindex="dateKey(date) === focusedKey ? 0 : -1"
                :aria-label="fullFormatter.format(date)"
                :aria-selected="isSelected(date)"
                @click="selectDate(date)"
                @keydown="handleDayKeydown($event, date)"
              >{{ dayFormatter.format(date) }}</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
