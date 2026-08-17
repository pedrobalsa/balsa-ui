import { type CSSProperties, type HTMLAttributes } from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";
import type { SemanticColor } from "./types";

export type ProgressVariant = "solid" | "soft" | "striped";
export type ProgressSize = "sm" | "md" | "lg";
export type ProgressState = "loading" | "complete" | "indeterminate";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value?: number | null;
  max?: number;
  showValue?: boolean;
  formatValue?: (value: number, max: number) => string;
  indeterminateLabel?: string;
  variant?: ProgressVariant;
  color?: SemanticColor;
  size?: ProgressSize;
  rounded?: Rounded;
  theme?: ThemeInput;
}

const trackColorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "bg-balsa-primary/15",
  secondary: "bg-balsa-secondary/15",
  accent: "bg-balsa-accent/15",
  destructive: "bg-balsa-destructive/15",
  success: "bg-balsa-success/15",
  warning: "bg-balsa-warning/15",
  info: "bg-balsa-info/15",
};
const indicatorColorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "bg-balsa-primary",
  secondary: "bg-balsa-secondary",
  accent: "bg-balsa-accent",
  destructive: "bg-balsa-destructive",
  success: "bg-balsa-success",
  warning: "bg-balsa-warning",
  info: "bg-balsa-info",
};
const sizeClasses: Readonly<Record<ProgressSize, string>> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};
const labelSizeClasses: Readonly<Record<ProgressSize, string>> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};
const indicatorVariantClasses: Readonly<Record<ProgressVariant, string[]>> = {
  solid: [],
  soft: ["opacity-75"],
  striped: [],
};

export function Progress(rawProps: ProgressProps) {
  const { props, theme } = useResolvedThemeProps("progress", "controls", rawProps, {
    variant: "solid",
    size: "md",
    rounded: "full",
  } as const);
  const {
    label,
    value = null,
    max = 100,
    showValue = true,
    formatValue,
    indeterminateLabel = "In progress",
    variant,
    color = "info",
    size,
    rounded,
    theme: _themeInput,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const determinate = value !== null && Number.isFinite(value);
  const normalizedValue = determinate ? Math.min(safeMax, Math.max(0, Number(value))) : null;
  const percentage = normalizedValue === null ? 0 : (normalizedValue / safeMax) * 100;
  const state: ProgressState = !determinate
    ? "indeterminate"
    : percentage >= 100
      ? "complete"
      : "loading";
  const valueText = normalizedValue === null
    ? indeterminateLabel
    : formatValue
      ? formatValue(normalizedValue, safeMax)
      : `${Math.round(percentage)}%`;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="progress"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-state={state}
        data-variant={variant}
        data-color={color}
        data-size={size}
        data-rounded={rounded}
        className={mergeClasses("min-w-0 font-balsa-body", className)}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <div
          className={mergeClasses(
            "mb-balsa-xs flex min-w-0 items-baseline justify-between gap-balsa-lg",
            labelSizeClasses[size],
          )}
        >
          <span className="min-w-0 text-sm font-medium text-balsa-foreground">{label}</span>
          {showValue ? (
            <span className="shrink-0 tabular-nums text-balsa-muted-foreground" aria-hidden="true">
              {valueText}
            </span>
          ) : null}
        </div>
        <div
          data-balsa="progress-track"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={normalizedValue ?? undefined}
          aria-valuetext={valueText}
          className={mergeClasses(
            "relative w-full overflow-hidden",
            sizeClasses[size],
            roundedClasses[rounded],
            trackColorClasses[color],
          )}
        >
          <div
            data-balsa="progress-indicator"
            data-state={state}
            data-variant={variant}
            style={{ width: state === "indeterminate" ? "40%" : `${percentage}%` }}
            className={mergeClasses(
              "relative h-full overflow-hidden transition-[width,transform] duration-balsa-slow ease-balsa motion-reduce:transition-none",
              roundedClasses[rounded],
              indicatorColorClasses[color],
              indicatorVariantClasses[variant],
            )}
          />
        </div>
      </div>
    </BalsaThemeContext.Provider>
  );
}
