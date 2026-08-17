import { LoaderCircle } from "lucide-react";
import {
  type CSSProperties,
  type FieldsetHTMLAttributes,
} from "react";
import {
  fieldHintClasses,
  fieldStatusMessages,
  getFieldStateColorClass,
  getFieldStatusIcon,
  roundedClasses,
  type FieldSize,
  type FieldStatus,
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
import type { SemanticColor } from "./types";

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type RadioGroupLayout = "column" | "row" | "cards";

export interface RadioGroupProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  id: string;
  label: string;
  options: readonly RadioGroupOption[];
  name?: string;
  layout?: RadioGroupLayout;
  color?: SemanticColor;
  size?: FieldSize;
  rounded?: Rounded;
  hint?: string;
  disabled?: boolean;
  loading?: boolean;
  status?: FieldStatus;
  statusMessage?: string;
  required?: boolean;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const radioColorClasses: Readonly<Record<SemanticColor, {
  indicator: string;
  selectedCard: string;
  selectedDescription: string;
}>> = {
  primary: {
    indicator: "after:bg-balsa-primary-foreground peer-checked:border-balsa-primary peer-checked:bg-balsa-primary",
    selectedCard: "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground hover:border-balsa-primary hover:bg-balsa-primary active:bg-balsa-primary",
    selectedDescription: "text-balsa-primary-foreground/80",
  },
  secondary: {
    indicator: "after:bg-balsa-secondary-foreground peer-checked:border-balsa-secondary peer-checked:bg-balsa-secondary",
    selectedCard: "border-balsa-secondary bg-balsa-secondary text-balsa-secondary-foreground hover:border-balsa-secondary hover:bg-balsa-secondary active:bg-balsa-secondary",
    selectedDescription: "text-balsa-secondary-foreground/80",
  },
  accent: {
    indicator: "after:bg-balsa-accent-foreground peer-checked:border-balsa-accent peer-checked:bg-balsa-accent",
    selectedCard: "border-balsa-accent bg-balsa-accent text-balsa-accent-foreground hover:border-balsa-accent hover:bg-balsa-accent active:bg-balsa-accent",
    selectedDescription: "text-balsa-accent-foreground/80",
  },
  destructive: {
    indicator: "after:bg-balsa-destructive-foreground peer-checked:border-balsa-destructive peer-checked:bg-balsa-destructive",
    selectedCard: "border-balsa-destructive bg-balsa-destructive text-balsa-destructive-foreground hover:border-balsa-destructive hover:bg-balsa-destructive active:bg-balsa-destructive",
    selectedDescription: "text-balsa-destructive-foreground/80",
  },
  success: {
    indicator: "after:bg-balsa-success-foreground peer-checked:border-balsa-success peer-checked:bg-balsa-success",
    selectedCard: "border-balsa-success bg-balsa-success text-balsa-success-foreground hover:border-balsa-success hover:bg-balsa-success active:bg-balsa-success",
    selectedDescription: "text-balsa-success-foreground/80",
  },
  warning: {
    indicator: "after:bg-balsa-warning-foreground peer-checked:border-balsa-warning peer-checked:bg-balsa-warning",
    selectedCard: "border-balsa-warning bg-balsa-warning text-balsa-warning-foreground hover:border-balsa-warning hover:bg-balsa-warning active:bg-balsa-warning",
    selectedDescription: "text-balsa-warning-foreground/80",
  },
  info: {
    indicator: "after:bg-balsa-info-foreground peer-checked:border-balsa-info peer-checked:bg-balsa-info",
    selectedCard: "border-balsa-info bg-balsa-info text-balsa-info-foreground hover:border-balsa-info hover:bg-balsa-info active:bg-balsa-info",
    selectedDescription: "text-balsa-info-foreground/80",
  },
};

export function RadioGroup(rawProps: RadioGroupProps) {
  const { props, theme } = useResolvedThemeProps("radio-group", "fields", rawProps, {
    size: "md",
    rounded: "lg",
  } as const);
  const {
    id,
    label,
    options,
    name,
    layout = "column",
    color = "primary",
    size,
    rounded,
    hint,
    disabled = false,
    loading = false,
    status = "default",
    statusMessage,
    required = false,
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
  const isDisabled = disabled || loading;
  const hintId = hint ? `${id}-hint` : undefined;
  const statusId = status === "unvalidated" ? `${id}-status` : undefined;
  const describedBy = [hintId, statusId].filter(Boolean).join(" ") || undefined;
  const effectiveStatusMessage = status === "unvalidated"
    ? statusMessage ?? fieldStatusMessages.unvalidated
    : undefined;
  const stateIcon = loading ? LoaderCircle : getFieldStatusIcon(status);
  const optionsClasses = layout === "row"
    ? "flex flex-wrap items-start gap-x-balsa-2xl gap-y-balsa-md"
    : layout === "cards"
      ? "grid grid-cols-1 gap-balsa-md"
      : "flex flex-col gap-balsa-md";
  const choiceClasses = mergeClasses(
    "pointer-events-none mt-balsa-4xs grid shrink-0 place-items-center rounded-full bg-balsa-input transition-[border-color,background-color,box-shadow] after:size-1.5 after:rounded-full after:opacity-0 after:content-[''] peer-checked:after:opacity-100",
    size === "sm" ? "size-4" : "size-5",
    status === "unvalidated"
      ? "border-balsa-destructive peer-focus-visible:ring-balsa-destructive/30"
      : "border-balsa-input-border peer-focus-visible:border-balsa-focus-ring peer-focus-visible:ring-balsa-focus-ring/30",
    "peer-focus-visible:ring-2",
    radioColorClasses[color].indicator,
    "peer-disabled:border-balsa-border peer-disabled:bg-balsa-disabled",
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <fieldset
        {...domProps}
        id={id}
        data-balsa="radio-group"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-layout={layout}
        data-color={color}
        data-size={size}
        data-rounded={rounded}
        data-status={status}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-describedby={describedBy}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        className={mergeClasses("min-w-0", className)}
      >
        <legend className="mb-balsa-md text-sm font-medium leading-snug text-balsa-foreground">
          <span>{label}</span>
          {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
          {stateIcon ? (
            <Icon
              icon={stateIcon}
              size="md"
              className={mergeClasses(
                loading ? "animate-spin text-balsa-info" : getFieldStateColorClass(status),
              )}
            />
          ) : null}
        </legend>

        <div className={optionsClasses}>
          {options.map((option, index) => {
            const optionId = `${id}-${index}`;
            const selected = current === option.value;
            const optionDisabled = isDisabled || option.disabled;
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={mergeClasses(
                  "group relative flex min-w-0 cursor-pointer items-start gap-balsa-md transition-[border-color,background-color,box-shadow,opacity]",
                  layout === "cards"
                    ? "border-balsa-input-border bg-balsa-input p-balsa-lg hover:border-balsa-border-strong"
                    : "gap-balsa-md",
                  layout === "cards" ? roundedClasses[rounded] : "",
                  size === "sm" ? "text-sm" : "text-base",
                  layout === "cards" && selected ? radioColorClasses[color].selectedCard : "",
                  optionDisabled
                    ? loading
                      ? "cursor-progress opacity-60"
                      : "cursor-not-allowed opacity-60"
                    : "",
                )}
              >
                <input
                  id={optionId}
                  className="peer sr-only"
                  type="radio"
                  name={name ?? id}
                  value={option.value}
                  checked={selected}
                  disabled={option.disabled}
                  required={required}
                  aria-invalid={status === "unvalidated" || undefined}
                  aria-describedby={describedBy}
                  onChange={() => setValue(option.value)}
                />
                <span
                  data-balsa="radio-group-indicator"
                  className={choiceClasses}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug">{option.label}</span>
                  {option.description ? (
                    <span
                      className={mergeClasses(
                        "mt-balsa-3xs block text-sm leading-relaxed",
                        layout === "cards" && selected
                          ? radioColorClasses[color].selectedDescription
                          : "text-balsa-muted-foreground",
                      )}
                    >
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
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
      </fieldset>
    </BalsaThemeContext.Provider>
  );
}
