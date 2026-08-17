import { Check } from "lucide-react";
import { type CSSProperties, type LabelHTMLAttributes } from "react";
import {
  fieldHintClasses,
  getChoiceInputClasses,
  roundedClasses,
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

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  size?: CheckboxSize;
  variant?: FieldVariant;
  rounded?: Rounded;
  theme?: ThemeInput;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const sizeClasses: Readonly<Record<CheckboxSize, string>> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};
const wrapSizeClasses: Readonly<Record<CheckboxSize, string>> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Checkbox(rawProps: CheckboxProps) {
  const { props, theme } = useResolvedThemeProps("checkbox", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "md",
  } as const);
  const {
    id,
    label,
    hint,
    disabled = false,
    required = false,
    size,
    variant,
    rounded,
    theme: _themeInput,
    checked,
    defaultChecked = false,
    onCheckedChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <label
        {...domProps}
        htmlFor={id}
        data-balsa="checkbox"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-rounded={rounded}
        data-variant={variant}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        className={mergeClasses("flex items-start gap-balsa-md", className)}
      >
        <span
          className={mergeClasses(
            "relative mt-balsa-4xs flex shrink-0 items-center justify-center",
            wrapSizeClasses[size],
          )}
        >
          <input
            id={id}
            checked={current}
            onChange={(event) => setChecked(event.currentTarget.checked)}
            type="checkbox"
            disabled={disabled}
            required={required}
            aria-describedby={hintId}
            data-balsa="checkbox-control"
            className={mergeClasses(
              getChoiceInputClasses(variant),
              sizeClasses[size],
              roundedClasses[rounded],
              "peer checked:border-balsa-primary checked:bg-balsa-primary",
            )}
          />
          <Icon
            icon={Check}
            size={size === "sm" ? "xs" : size === "lg" ? "md" : "sm"}
            className="pointer-events-none absolute text-balsa-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>
        <span>
          <span className="block text-sm font-medium text-balsa-foreground">
            {label}
            {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
          </span>
          {hint ? (
            <span id={hintId} className={fieldHintClasses}>{hint}</span>
          ) : null}
        </span>
      </label>
    </BalsaThemeContext.Provider>
  );
}
