import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type CalendarMode = "single" | "multiple" | "range";
export interface CalendarRange {
  start?: Date;
  end?: Date;
}
export type CalendarModelValue = Date | readonly Date[] | CalendarRange | null;

export interface CalendarProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "onSelect" | "onChange" | "defaultValue"
> {
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
  value?: CalendarModelValue;
  defaultValue?: CalendarModelValue;
  onValueChange?: (value: CalendarModelValue) => void;
  onMonthChange?: (month: Date) => void;
  onSelect?: (value: CalendarModelValue) => void;
}

type DateBounds = {
  disabled: boolean;
  min?: Date;
  max?: Date;
  disabledDates?: (date: Date) => boolean;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addCalendarMonths(date: Date, amount: number): Date {
  const destination = new Date(date.getFullYear(), date.getMonth() + amount + 1, 0);
  return new Date(
    destination.getFullYear(),
    destination.getMonth(),
    Math.min(date.getDate(), destination.getDate()),
  );
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDay(a?: Date, b?: Date): boolean {
  return Boolean(a && b && dateKey(a) === dateKey(b));
}

function isCalendarRange(value: CalendarModelValue): value is CalendarRange {
  return Boolean(value)
    && typeof value === "object"
    && !(value instanceof Date)
    && !Array.isArray(value);
}

function selectedAnchor(value: CalendarModelValue): Date | undefined {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value[0];
  if (isCalendarRange(value)) return value.start;
  return undefined;
}

function rangeValue(value: CalendarModelValue): CalendarRange {
  return isCalendarRange(value) ? value : {};
}

function isDateDisabled(date: Date, bounds: DateBounds): boolean {
  const day = startOfDay(date);
  return bounds.disabled || Boolean(
    (bounds.min && day < startOfDay(bounds.min))
    || (bounds.max && day > startOfDay(bounds.max))
    || bounds.disabledDates?.(day),
  );
}

function firstEnabledDate(month: Date, bounds: DateBounds): Date | undefined {
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= total; day += 1) {
    const candidate = new Date(month.getFullYear(), month.getMonth(), day);
    if (!isDateDisabled(candidate, bounds)) return candidate;
  }
  return undefined;
}

function enabledDateFrom(date: Date, direction: 1 | -1, bounds: DateBounds): Date | undefined {
  let candidate = date;
  for (let attempt = 0; attempt < 366; attempt += 1) {
    if (!isDateDisabled(candidate, bounds)) return candidate;
    candidate = addDays(candidate, direction);
  }
  return undefined;
}

function monthGrid(month: Date, weekStartsOn: number, fixedWeeks: boolean): readonly Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  const days = fixedWeeks
    ? 42
    : Math.ceil((offset + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: days }, (_, index) => addDays(start, index));
}

function initialMonth(month: Date | undefined, value: CalendarModelValue): Date {
  return startOfMonth(month ?? selectedAnchor(value) ?? new Date());
}

function initialFocusKey(month: Date | undefined, value: CalendarModelValue, bounds: DateBounds): string {
  const initialMonthDate = month ?? selectedAnchor(value) ?? new Date();
  const initialFocusDate = isDateDisabled(initialMonthDate, bounds)
    ? firstEnabledDate(startOfMonth(initialMonthDate), bounds) ?? initialMonthDate
    : initialMonthDate;
  return dateKey(initialFocusDate);
}

export function Calendar(rawProps: CalendarProps) {
  const { props, theme } = useResolvedThemeProps("calendar", "surfaces", rawProps, {
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    mode = "single",
    locale = "en-US",
    weekStartsOn = 0,
    month,
    min,
    max,
    disabledDates,
    outsideDays = true,
    fixedWeeks = true,
    months = 1,
    disabled = false,
    rounded,
    shadow,
    theme: _themeInput,
    value,
    defaultValue = null,
    onValueChange,
    onMonthChange,
    onSelect,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const bounds: DateBounds = { disabled, min, max, disabledDates };
  const [current, setValue] = useControllableState<CalendarModelValue>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [visibleMonth, setVisibleMonth] = useState(() => initialMonth(month, value ?? defaultValue));
  const [focusedKey, setFocusedKey] = useState(() => initialFocusKey(month, value ?? defaultValue, bounds));
  const monthPropKey = month ? dateKey(startOfMonth(month)) : "";
  const [seenMonthPropKey, setSeenMonthPropKey] = useState(monthPropKey);
  const pendingFocusKey = useRef<string | null>(null);

  if (month && monthPropKey !== seenMonthPropKey) {
    const nextMonth = startOfMonth(month);
    setSeenMonthPropKey(monthPropKey);
    setVisibleMonth(nextMonth);
    setFocusedKey(dateKey(firstEnabledDate(nextMonth, bounds) ?? nextMonth));
  }

  useLayoutEffect(() => {
    if (!pendingFocusKey.current) return;
    document.getElementById(`${id}-day-${pendingFocusKey.current}`)?.focus();
    pendingFocusKey.current = null;
  });

  function isSelected(date: Date): boolean {
    if (current instanceof Date) return sameDay(current, date);
    if (Array.isArray(current)) return current.some((item) => sameDay(item, date));
    const range = rangeValue(current);
    return sameDay(range.start, date) || sameDay(range.end, date);
  }

  function isInRange(date: Date): boolean {
    const { start, end } = rangeValue(current);
    return Boolean(start && end && date > startOfDay(start) && date < startOfDay(end));
  }

  function selectDate(date: Date): void {
    if (isDateDisabled(date, bounds)) return;
    const day = startOfDay(date);
    let next: CalendarModelValue = day;
    if (mode === "single") {
      next = day;
    } else if (mode === "multiple") {
      const values = Array.isArray(current) ? [...current] : [];
      next = values.some((item) => sameDay(item, day))
        ? values.filter((item) => !sameDay(item, day))
        : [...values, day];
    } else {
      const range = rangeValue(current);
      next = !range.start || range.end || day < startOfDay(range.start)
        ? { start: day }
        : { start: range.start, end: day };
    }
    setValue(next);
    setFocusedKey(dateKey(day));
    onSelect?.(next);
  }

  function canChangeMonth(amount: number): boolean {
    const nextMonth = addMonths(visibleMonth, amount);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
    if (amount < 0 && min && lastDay < startOfDay(min)) return false;
    if (amount > 0 && max && nextMonth > startOfDay(max)) return false;
    return true;
  }

  function changeMonth(amount: number): void {
    const nextMonth = addMonths(visibleMonth, amount);
    if (!canChangeMonth(amount)) return;
    setVisibleMonth(nextMonth);
    setFocusedKey(dateKey(firstEnabledDate(nextMonth, bounds) ?? nextMonth));
    onMonthChange?.(nextMonth);
  }

  function focusDate(date: Date): void {
    pendingFocusKey.current = dateKey(date);
    setFocusedKey(dateKey(date));
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      const nextMonth = startOfMonth(date);
      setVisibleMonth(nextMonth);
      onMonthChange?.(nextMonth);
    }
  }

  function handleDayKeydown(event: KeyboardEvent<HTMLButtonElement>, date: Date): void {
    const weekStart = Math.max(0, Math.min(6, Math.trunc(weekStartsOn)));
    let next: Date | undefined;
    if (event.key === "ArrowLeft") next = addDays(date, -1);
    else if (event.key === "ArrowRight") next = addDays(date, 1);
    else if (event.key === "ArrowUp") next = addDays(date, -7);
    else if (event.key === "ArrowDown") next = addDays(date, 7);
    else if (event.key === "Home") next = addDays(date, -((date.getDay() - weekStart + 7) % 7));
    else if (event.key === "End") next = addDays(date, 6 - ((date.getDay() - weekStart + 7) % 7));
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
    const enabledDate = enabledDateFrom(next, direction, bounds);
    if (enabledDate) focusDate(enabledDate);
  }

  function dayClasses(date: Date, displayedMonth: Date): string {
    return mergeClasses(
      "grid size-10 place-items-center rounded-balsa-control text-sm font-normal tabular-nums transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:opacity-35",
      date.getMonth() !== displayedMonth.getMonth() && "text-balsa-muted-foreground",
      isInRange(date) && "bg-balsa-selected text-balsa-selected-foreground",
      isSelected(date) && "bg-balsa-primary text-balsa-primary-foreground hover:bg-balsa-primary-hover",
    );
  }

  const normalizedWeekStart = Math.max(0, Math.min(6, Math.trunc(weekStartsOn)));
  const displayedMonths = Array.from({ length: months }, (_, index) => addMonths(visibleMonth, index));
  const sunday = new Date(2024, 0, 7);
  const weekdays = Array.from({ length: 7 }, (_, index) => addDays(sunday, (index + normalizedWeekStart) % 7));
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const fullFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const classes = mergeClasses(
    "border-balsa-border bg-balsa-surface p-balsa-lg text-balsa-foreground",
    roundedClasses[rounded],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <section
        {...domProps}
        id={id}
        data-balsa="calendar"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-mode={mode}
        data-shadow={shadow}
        aria-label={label}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <header className="mb-balsa-lg flex items-center justify-between gap-balsa-md">
          <Button
            shape="fab"
            size="sm"
            variant="outline"
            prefixIcon={ChevronLeft}
            aria-label="Previous month"
            disabled={disabled || !canChangeMonth(-1)}
            onClick={() => changeMonth(-1)}
          />
          <p className="text-sm font-semibold">{monthFormatter.format(visibleMonth)}</p>
          <Button
            shape="fab"
            size="sm"
            variant="outline"
            prefixIcon={ChevronRight}
            aria-label="Next month"
            disabled={disabled || !canChangeMonth(1)}
            onClick={() => changeMonth(1)}
          />
        </header>
        <div className={months === 2 ? "grid gap-balsa-2xl lg:grid-cols-2" : "grid"}>
          {displayedMonths.map((displayedMonth) => {
            const days = monthGrid(displayedMonth, normalizedWeekStart, fixedWeeks);
            const weeks: Date[][] = [];
            for (let index = 0; index < days.length; index += 7) {
              weeks.push(days.slice(index, index + 7) as Date[]);
            }
            return (
              <div key={dateKey(displayedMonth)}>
                {months === 2 ? (
                  <p className="mb-balsa-xs text-center text-sm font-semibold">
                    {monthFormatter.format(displayedMonth)}
                  </p>
                ) : null}
                <div role="grid" aria-label={monthFormatter.format(displayedMonth)}>
                  <div role="row" className="grid grid-cols-7">
                    {weekdays.map((weekday) => (
                      <span
                        key={weekday.getDay()}
                        role="columnheader"
                        className="grid size-10 place-items-center text-xs font-normal text-balsa-muted-foreground"
                      >
                        {weekdayFormatter.format(weekday)}
                      </span>
                    ))}
                  </div>
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} role="row" className="grid grid-cols-7">
                      {week.map((date) => (
                        !outsideDays && date.getMonth() !== displayedMonth.getMonth() ? (
                          <span key={dateKey(date)} className="size-10" aria-hidden="true" />
                        ) : (
                          <button
                            key={dateKey(date)}
                            id={`${id}-day-${dateKey(date)}`}
                            type="button"
                            role="gridcell"
                            className={dayClasses(date, displayedMonth)}
                            disabled={isDateDisabled(date, bounds)}
                            tabIndex={dateKey(date) === focusedKey ? 0 : -1}
                            aria-label={fullFormatter.format(date)}
                            aria-selected={isSelected(date)}
                            onClick={() => selectDate(date)}
                            onKeyDown={(event) => handleDayKeydown(event, date)}
                          >
                            {dayFormatter.format(date)}
                          </button>
                        )
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </BalsaThemeContext.Provider>
  );
}
