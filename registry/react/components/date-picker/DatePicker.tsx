import { CalendarDays } from "lucide-react";
import {
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { Button } from "./Button";
import {
  Calendar,
  type CalendarMode,
  type CalendarModelValue,
  type CalendarRange,
} from "./Calendar";
import { mergeClasses } from "./classes";
import type { Rounded } from "./form";
import { Icon } from "./Icon";
import { Popup } from "./Popup";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type DatePickerStatus = "default" | "unvalidated";

export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "id" | "onChange"
> {
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
  value?: CalendarModelValue;
  defaultValue?: CalendarModelValue;
  onValueChange?: (value: CalendarModelValue) => void;
  "data-balsa"?: string;
  "data-palette"?: string;
}

function isCalendarRange(value: CalendarModelValue): value is CalendarRange {
  return Boolean(value)
    && typeof value === "object"
    && !(value instanceof Date)
    && !Array.isArray(value);
}

function dateValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function DatePicker(rawProps: DatePickerProps) {
  const { props, theme } = useResolvedThemeProps("date-picker", "fields", rawProps, {
    rounded: "lg",
  } as const);
  const {
    id,
    label,
    name,
    mode = "single",
    locale = "en-US",
    placeholder = "Choose a date",
    required = false,
    disabled = false,
    status = "default",
    statusMessage = "Choose a valid date.",
    min,
    max,
    disabledDates,
    clearable = true,
    rounded,
    theme: themeInput,
    value,
    defaultValue = null,
    onValueChange,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    className,
    style,
    ...domProps
  } = props;
  void _dataBalsa;

  const [current, setValue] = useControllableState<CalendarModelValue>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [open, setOpen] = useState(false);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  let displayValue = placeholder;
  if (current instanceof Date) {
    displayValue = format.format(current);
  } else if (isCalendarRange(current)) {
    if (current.start && current.end) {
      displayValue = `${format.format(current.start)} \u2013 ${format.format(current.end)}`;
    } else if (current.start) {
      displayValue = `${format.format(current.start)} \u2013 \u2026`;
    }
  }

  let formValue = "";
  if (current instanceof Date) {
    formValue = dateValue(current);
  } else if (isCalendarRange(current)) {
    formValue = [
      current.start ? dateValue(current.start) : "",
      current.end ? dateValue(current.end) : "",
    ].join("/");
  }

  const describedBy = status === "unvalidated" ? `${id}-error` : undefined;
  const rootClasses = mergeClasses(
    "w-full [&_[data-balsa=popup]]:w-full [&_[data-balsa=popup]>button]:w-full [&_[data-balsa=popup]>button]:justify-between",
    status === "unvalidated"
      && "[&_[data-balsa=popup]>button]:border-balsa-destructive [&_[data-balsa=popup]>button]:ring-balsa-destructive",
    className,
  );

  function handleSelect(next: CalendarModelValue, close: () => void): void {
    if (mode === "single" || (isCalendarRange(next) && next.end)) close();
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="date-picker"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-status={status}
        className={rootClasses}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <label
          id={`${id}-label`}
          htmlFor={`${id}-popup-trigger`}
          className="mb-balsa-xs block text-sm font-medium text-balsa-foreground"
        >
          {label}{required ? (
            <>
              {" "}<span className="text-balsa-destructive" aria-hidden="true">*</span>
            </>
          ) : null}
        </label>
        <Popup
          id={`${id}-popup`}
          label={label}
          size="lg"
          align="start"
          rounded={rounded}
          disabled={disabled}
          triggerAriaLabelledby={`${id}-label`}
          triggerAriaDescribedby={describedBy}
          triggerAriaInvalid={status === "unvalidated"}
          triggerAriaRequired={required}
          theme={themeInput}
          data-palette={dataPalette}
          open={open}
          onOpenChange={setOpen}
          trigger={(
            <>
              <span className={current ? "text-balsa-foreground" : "text-balsa-muted-foreground"}>
                {displayValue}
              </span>
              <Icon icon={CalendarDays} size="md" className="text-balsa-primary" />
            </>
          )}
        >
          {(close) => (
            <>
              <Calendar
                id={`${id}-calendar`}
                label={label}
                mode={mode}
                locale={locale}
                min={min}
                max={max}
                disabledDates={disabledDates}
                rounded={rounded}
                theme={themeInput}
                value={current}
                onValueChange={setValue}
                onSelect={(next) => handleSelect(next, close)}
                className="border-0 p-0"
              />
              {clearable && current ? (
                <div className="mt-balsa-md flex justify-end border-t border-balsa-border pt-balsa-md">
                  <Button
                    variant="outline"
                    color="secondary"
                    size="sm"
                    onClick={() => setValue(null)}
                  >
                    Clear date
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </Popup>
        <input name={name ?? id} type="hidden" value={formValue} />
        {status === "unvalidated" ? (
          <p
            id={`${id}-error`}
            className="mt-balsa-xs text-sm font-medium text-balsa-destructive"
            role="alert"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
