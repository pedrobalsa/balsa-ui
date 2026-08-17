import { LoaderCircle } from "lucide-react";
import {
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";
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
import { Icon } from "./Icon";
import { mergeClasses } from "./classes";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type InputType =
  | "text"
  | "password"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "monetary"
  | "percentage";

export type InputValue = string | number;

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size" | "type"> {
  id: string;
  label: string;
  type?: InputType;
  size?: FieldSize;
  variant?: FieldVariant;
  hint?: string;
  loading?: boolean;
  status?: FieldStatus;
  statusMessage?: string;
  mask?: string;
  currency?: string;
  locale?: string;
  rounded?: Rounded;
  theme?: ThemeInput;
  value?: InputValue;
  defaultValue?: InputValue;
  onValueChange?: (value: InputValue) => void;
}

const phoneMask = "(##) #####-####";

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

function formatMonetaryValue(
  value: string | number,
  locale: string,
  currency: string,
): string {
  if (value === "" || value === null || value === undefined) return "";
  const amount = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

function formatMonetaryInput(
  value: string,
  locale: string,
  currency: string,
): { amount: number | ""; display: string } {
  const digits = value.replace(/\D/g, "");
  if (!digits) return { amount: "", display: "" };
  const amount = Number(digits) / 100;
  return { amount, display: formatMonetaryValue(amount, locale, currency) };
}

function formatPercentageValue(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const amount = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(amount)) return "";
  return String(Math.min(Math.max(amount, 0), 100));
}

function formatPercentageInput(value: string): { amount: number | ""; display: string } {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const decimalIndex = normalized.indexOf(".");
  const whole = decimalIndex === -1 ? normalized : normalized.slice(0, decimalIndex);
  const fraction = decimalIndex === -1
    ? undefined
    : normalized.slice(decimalIndex + 1).replaceAll(".", "").slice(0, 2);
  const display = fraction === undefined ? whole : `${whole || "0"}.${fraction}`;
  if (!display || display === ".") return { amount: "", display: "" };
  const amount = Number(display);
  if (!Number.isFinite(amount)) return { amount: "", display: "" };
  const clamped = Math.min(Math.max(amount, 0), 100);
  return { amount: clamped, display: clamped === amount ? display : String(clamped) };
}

export function Input(rawProps: InputProps) {
  const { props, theme } = useResolvedThemeProps("input", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "lg",
  } as const);
  const {
    id,
    label,
    type = "text",
    size,
    variant,
    placeholder,
    hint,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage,
    required = false,
    min,
    max,
    step,
    autoComplete,
    mask,
    currency = "USD",
    locale = "en-US",
    rounded,
    theme: _themeInput,
    value,
    defaultValue = "",
    onValueChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState<InputValue>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [percentageDraft, setPercentageDraft] = useState<string | undefined>();

  const hintId = hint ? `${id}-hint` : undefined;
  const statusId = status === "unvalidated" ? `${id}-status` : undefined;
  const describedBy = [hintId, statusId].filter(Boolean).join(" ") || undefined;
  const isDisabled = disabled || loading;
  const resolvedMask = mask ?? (type === "phone" ? phoneMask : undefined);
  const isMonetary = type === "monetary";
  const isPercentage = type === "percentage";
  const nativeType = resolvedMask || isMonetary || isPercentage ? "text" : type;
  const inputMode = type === "phone" ? "tel" : isMonetary || isPercentage ? "decimal" : undefined;
  const displayedValue = isMonetary
    ? formatMonetaryValue(current, locale, currency)
    : resolvedMask
      ? formatMask(String(current), resolvedMask)
      : isPercentage
        ? percentageDraft ?? formatPercentageValue(current)
        : current;
  const stateIcon = loading ? LoaderCircle : getFieldStatusIcon(status);
  const effectiveStatusMessage = status === "unvalidated"
    ? statusMessage ?? fieldStatusMessages[status]
    : undefined;

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    const input = event.currentTarget;
    if (isMonetary) {
      const next = formatMonetaryInput(input.value, locale, currency);
      setValue(next.amount);
      input.value = next.display;
      return;
    }
    if (resolvedMask) {
      const next = formatMask(input.value, resolvedMask);
      setValue(next);
      input.value = next;
      return;
    }
    if (isPercentage) {
      const next = formatPercentageInput(input.value);
      setPercentageDraft(next.display);
      setValue(next.amount);
      input.value = next.display;
      return;
    }
    setValue(type === "number" && input.value !== "" ? input.valueAsNumber : input.value);
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        data-balsa="input"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-rounded={rounded}
        data-variant={variant}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        <label htmlFor={id} className={fieldLabelClasses}>
          {label}
          {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
        </label>
        <div className="relative">
          <input
            {...domProps}
            id={id}
            type={nativeType}
            value={displayedValue === "" || displayedValue == null ? "" : String(displayedValue)}
            inputMode={inputMode}
            placeholder={placeholder}
            disabled={isDisabled}
            required={required}
            min={min}
            max={max}
            step={step}
            autoComplete={autoComplete}
            aria-busy={loading ? true : undefined}
            aria-invalid={status === "unvalidated" ? true : undefined}
            aria-describedby={describedBy}
            data-balsa-control=""
            className={mergeClasses(
              getTextControlClasses(
                status,
                Boolean(stateIcon) || isPercentage,
                disabled,
                loading,
                size,
                rounded,
                variant,
              ),
              isPercentage && stateIcon ? (size === "sm" ? "pr-16" : "pr-20") : [],
              className,
            )}
            style={style}
            onChange={handleInput}
            onBlur={() => {
              if (isPercentage) setPercentageDraft(undefined);
            }}
          />
          {stateIcon ? (
            <Icon
              icon={stateIcon}
              size="md"
              className={mergeClasses(
                "pointer-events-none absolute top-1/2 -translate-y-1/2",
                size === "sm" ? "right-3 text-base" : "right-4 text-lg",
                loading ? "text-balsa-info" : getFieldStateColorClass(status),
                loading ? "animate-spin" : "",
              )}
            />
          ) : null}
          {isPercentage ? (
            <span
              className={mergeClasses(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-balsa-muted-foreground",
                stateIcon
                  ? size === "sm" ? "right-9 text-sm" : "right-11 text-base"
                  : size === "sm" ? "right-3 text-sm" : "right-4 text-base",
              )}
              aria-hidden="true"
            >
              %
            </span>
          ) : null}
        </div>
        {hint ? (
          <span id={hintId} className={fieldHintClasses}>{hint}</span>
        ) : null}
        {effectiveStatusMessage ? (
          <span
            id={statusId}
            role="alert"
            className="mt-balsa-xs block text-sm font-medium text-balsa-destructive"
          >
            {effectiveStatusMessage}
          </span>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
