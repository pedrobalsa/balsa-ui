import { LoaderCircle } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from "react";
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
import { Icon } from "./Icon";
import { mergeClasses } from "./classes";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onChange"> {
  id: string;
  label: string;
  size?: FieldSize;
  variant?: FieldVariant;
  rounded?: Rounded;
  autoExpand?: boolean;
  maxHeight?: number;
  resizable?: TextareaResize;
  hint?: string;
  loading?: boolean;
  status?: FieldStatus;
  statusMessage?: string;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Textarea(rawProps: TextareaProps) {
  const { props, theme } = useResolvedThemeProps("textarea", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "lg",
  } as const);
  const {
    id,
    label,
    size,
    variant,
    rounded,
    rows = 4,
    autoExpand = false,
    maxHeight,
    resizable = "vertical",
    placeholder,
    hint,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage,
    required = false,
    name,
    autoComplete,
    maxLength,
    minLength,
    readOnly = false,
    theme: _themeInput,
    value,
    defaultValue = "",
    onValueChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hintId = hint ? `${id}-hint` : undefined;
  const statusId = status === "unvalidated" ? `${id}-status` : undefined;
  const describedBy = [hintId, statusId].filter(Boolean).join(" ") || undefined;
  const isDisabled = disabled || loading;
  const stateIcon = loading ? LoaderCircle : getFieldStatusIcon(status);
  const effectiveStatusMessage = status === "unvalidated"
    ? statusMessage ?? fieldStatusMessages[status]
    : undefined;

  function resizeToContent(): void {
    const element = textareaRef.current;
    if (!element) return;
    if (!autoExpand) {
      element.style.height = "";
      element.style.overflowY = "";
      return;
    }
    element.style.height = "auto";
    const contentHeight = element.scrollHeight;
    const height = maxHeight ? Math.min(contentHeight, maxHeight) : contentHeight;
    element.style.height = `${height}px`;
    element.style.overflowY = maxHeight && contentHeight > maxHeight ? "auto" : "hidden";
  }

  useLayoutEffect(() => {
    resizeToContent();
  }, [current, autoExpand, maxHeight, rows]);

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        data-balsa="textarea"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-rounded={rounded}
        data-variant={variant}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        <label htmlFor={id} className={fieldLabelClasses}>
          {label}
          {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
        </label>
        <div className="relative">
          <textarea
            {...domProps}
            ref={textareaRef}
            id={id}
            value={current}
            name={name}
            rows={rows}
            placeholder={placeholder}
            disabled={isDisabled}
            readOnly={readOnly}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            autoComplete={autoComplete}
            aria-busy={loading ? true : undefined}
            aria-invalid={status === "unvalidated" ? true : undefined}
            aria-describedby={describedBy}
            data-balsa-control=""
            className={mergeClasses(
              getTextareaControlClasses(
                status,
                disabled,
                loading,
                size,
                rounded,
                resizable,
                Boolean(stateIcon),
                variant,
              ),
              className,
            )}
            style={style}
            onChange={(event) => {
              setValue(event.currentTarget.value);
            }}
          />
          {stateIcon ? (
            <Icon
              icon={stateIcon}
              size="md"
              className={mergeClasses(
                "pointer-events-none absolute right-4 top-4",
                loading ? "animate-spin text-balsa-info" : getFieldStateColorClass(status),
              )}
            />
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
