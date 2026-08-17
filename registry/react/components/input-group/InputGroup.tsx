import { LoaderCircle } from "lucide-react";
import {
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  fieldHintClasses,
  fieldLabelClasses,
  fieldStatusMessages,
  getFieldStateColorClass,
  getFieldStatusIcon,
  roundedClasses,
  type FieldSize,
  type FieldStatus,
  type Rounded,
} from "./form";
import { Icon, type IconComponent } from "./Icon";
import { mergeClasses } from "./classes";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type InputGroupLayout = "inline" | "stacked";
export type InputGroupType = "text" | "email" | "url" | "search";

export interface InputGroupProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "size" | "type" | "children"
  > {
  id: string;
  label: string;
  type?: InputGroupType;
  layout?: InputGroupLayout;
  startText?: string;
  endText?: string;
  startIcon?: IconComponent;
  endIcon?: IconComponent;
  start?: ReactNode;
  end?: ReactNode;
  size?: FieldSize;
  rounded?: Rounded;
  hint?: string;
  loading?: boolean;
  status?: FieldStatus;
  statusMessage?: string;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function InputGroup(rawProps: InputGroupProps) {
  const { props, theme } = useResolvedThemeProps("input-group", "fields", rawProps, {
    size: "md",
    rounded: "lg",
  } as const);
  const {
    id,
    label,
    type = "text",
    layout = "inline",
    startText,
    endText,
    startIcon,
    endIcon,
    start,
    end,
    size,
    rounded,
    placeholder,
    hint,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage,
    required = false,
    name,
    autoComplete,
    theme: _themeInput,
    value,
    defaultValue = "",
    onValueChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  const isDisabled = disabled || loading;
  const hintId = hint ? `${id}-hint` : undefined;
  const statusId = status === "unvalidated" ? `${id}-status` : undefined;
  const describedBy = [hintId, statusId].filter(Boolean).join(" ") || undefined;
  const effectiveStatusMessage = status === "unvalidated"
    ? statusMessage ?? fieldStatusMessages.unvalidated
    : undefined;
  const stateIcon = loading ? LoaderCircle : getFieldStatusIcon(status);
  const hasStart = Boolean(startText || startIcon || start);
  const hasEnd = Boolean(endText || endIcon || end);

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    setValue(event.currentTarget.value);
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        data-balsa="input-group"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-layout={layout}
        data-size={size}
        data-rounded={rounded}
        data-status={status}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <label htmlFor={id} className={fieldLabelClasses}>
          {label}
          {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
        </label>
        <div
          className={mergeClasses(
            "relative isolate flex w-full border bg-balsa-input text-balsa-input-foreground transition-[border-color,box-shadow,opacity] focus-within:border-balsa-focus-ring focus-within:ring-2 focus-within:ring-balsa-focus-ring/30",
            layout === "stacked" ? "flex-col" : "items-stretch",
            roundedClasses[rounded],
            status === "validated"
              ? "border-balsa-success focus-within:border-balsa-success focus-within:ring-balsa-success/30"
              : status === "unvalidated"
                ? "border-balsa-destructive focus-within:border-balsa-destructive focus-within:ring-balsa-destructive/30"
                : "border-balsa-input-border",
            isDisabled ? "bg-balsa-disabled text-balsa-disabled-foreground" : "",
          )}
        >
          <input
            {...domProps}
            id={id}
            data-balsa-control=""
            type={type}
            name={name}
            value={current}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={isDisabled}
            required={required}
            aria-busy={loading ? true : undefined}
            aria-invalid={status === "unvalidated" ? true : undefined}
            aria-describedby={describedBy}
            className={mergeClasses(
              "peer min-w-0 flex-1 border-0 bg-transparent font-balsa-body text-balsa-input-foreground outline-none placeholder:text-balsa-muted-foreground disabled:text-balsa-disabled-foreground",
              size === "sm" ? "h-8 px-balsa-md text-sm" : "h-9 px-balsa-md text-sm",
              layout === "stacked" ? "w-full" : "",
              isDisabled
                ? loading
                  ? "cursor-progress"
                  : "cursor-not-allowed"
                : "cursor-text",
              stateIcon && !hasEnd ? "pr-10" : "",
              className,
            )}
            onChange={handleInput}
          />
          {hasStart ? (
            <div
              data-balsa="input-group-start"
              className={mergeClasses(
                "flex shrink-0 items-center gap-balsa-xs bg-balsa-muted px-balsa-md text-balsa-muted-foreground",
                size === "sm" ? "min-h-8 text-sm" : "min-h-9 text-sm",
                "order-first",
                layout === "stacked"
                  ? "w-full border-b border-balsa-input-border"
                  : "border-r border-balsa-input-border",
              )}
            >
              {start ?? (
                <>
                  {startIcon ? <Icon icon={startIcon} size="md" /> : null}
                  {startText ? <span>{startText}</span> : null}
                </>
              )}
            </div>
          ) : null}
          {hasEnd ? (
            <div
              data-balsa="input-group-end"
              className={mergeClasses(
                "flex shrink-0 items-center gap-balsa-xs bg-balsa-muted px-balsa-md text-balsa-muted-foreground",
                size === "sm" ? "min-h-8 text-sm" : "min-h-9 text-sm",
                layout === "stacked"
                  ? "w-full border-t border-balsa-input-border"
                  : "border-l border-balsa-input-border",
              )}
            >
              {end ?? (
                <>
                  {endText ? <span>{endText}</span> : null}
                  {endIcon ? <Icon icon={endIcon} size="md" /> : null}
                </>
              )}
            </div>
          ) : null}
          {stateIcon && !hasEnd ? (
            <Icon
              icon={stateIcon}
              size="md"
              className={mergeClasses(
                "pointer-events-none absolute z-10",
                layout === "inline"
                  ? size === "sm"
                    ? "right-3 top-1/2 -translate-y-1/2 text-base"
                    : "right-4 top-1/2 -translate-y-1/2 text-lg"
                  : "right-3 top-1/2 -translate-y-1/2 text-lg",
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
