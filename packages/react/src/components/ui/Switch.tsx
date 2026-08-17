import {
  type CSSProperties,
  type LabelHTMLAttributes,
} from "react";
import {
  fieldHintClasses,
  getChoiceTrackClasses,
  type FieldVariant,
  type Rounded,
} from "./form";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import { mergeClasses } from "./classes";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
  id: string;
  label: string;
  hint?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  size?: SwitchSize;
  variant?: FieldVariant;
  rounded?: Rounded;
  theme?: ThemeInput;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none after:rounded-none",
  sm: "rounded-sm after:rounded-sm",
  md: "rounded-md after:rounded-md",
  lg: "rounded-lg after:rounded-lg",
  xl: "rounded-xl after:rounded-xl",
  "2xl": "rounded-2xl after:rounded-2xl",
  "3xl": "rounded-3xl after:rounded-3xl",
  full: "rounded-full after:rounded-full",
};

export function Switch(rawProps: SwitchProps) {
  const { props, theme } = useResolvedThemeProps("switch", "fields", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "full",
  } as const);
  const {
  id,
  label,
  hint,
  name,
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
  const sizeClasses: Readonly<Record<SwitchSize, string>> = {
    sm: "h-5 w-9 after:h-3 after:w-3 peer-checked:after:translate-x-4",
    md: "h-6 w-10 after:h-4 after:w-4 peer-checked:after:translate-x-4",
    lg: "h-7 w-12 after:h-5 after:w-5 peer-checked:after:translate-x-5",
  };
  const controlClasses = mergeClasses(
    "relative mt-balsa-4xs shrink-0 cursor-pointer transition-[border-color,background-color,box-shadow,opacity] after:absolute after:left-1 after:top-1 after:bg-balsa-muted-foreground after:transition-transform after:content-[''] peer-checked:border-balsa-primary peer-checked:bg-balsa-primary peer-checked:after:bg-balsa-primary-foreground peer-focus-visible:border-balsa-focus-ring peer-focus-visible:ring-2 peer-focus-visible:ring-balsa-focus-ring/30 peer-disabled:cursor-not-allowed peer-disabled:border-balsa-border peer-disabled:bg-balsa-disabled peer-disabled:after:bg-balsa-disabled-foreground",
    getChoiceTrackClasses(variant),
    sizeClasses[size],
    roundedClasses[rounded],
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <label
        {...domProps}
        htmlFor={id}
        data-balsa="switch"
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
        <input
          id={id}
          checked={current}
          onChange={(event) => setChecked(event.target.checked)}
          type="checkbox"
          role="switch"
          name={name}
          disabled={disabled}
          required={required}
          aria-describedby={hintId}
          className="peer sr-only"
        />
        <span
          data-balsa="switch-control"
          className={controlClasses}
          aria-hidden="true"
        />
        <span>
          <span className="block text-sm font-medium text-balsa-foreground">
            {label}
            {required ? <span className="text-balsa-primary" aria-hidden="true">*</span> : null}
          </span>
          {hint ? (
            <span id={hintId} className={fieldHintClasses}>
              {hint}
            </span>
          ) : null}
        </span>
      </label>
    </BalsaThemeContext.Provider>
  );
}
