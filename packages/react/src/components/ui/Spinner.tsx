import { type CSSProperties, type HTMLAttributes } from "react";
import { mergeClasses } from "./classes";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";
import type { SemanticColor } from "./types";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerSpeed = "slow" | "normal" | "fast";
export type SpinnerLabelPosition = "hidden" | "right" | "bottom";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
  labelPosition?: SpinnerLabelPosition;
  color?: SemanticColor;
  size?: SpinnerSize;
  speed?: SpinnerSpeed;
  theme?: ThemeInput;
}

const colorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "text-balsa-primary",
  secondary: "text-balsa-secondary",
  accent: "text-balsa-accent",
  destructive: "text-balsa-destructive",
  success: "text-balsa-success",
  warning: "text-balsa-warning",
  info: "text-balsa-info",
};
const sizeClasses: Readonly<
  Record<SpinnerSize, { ring: string[]; border: string; label: string }>
> = {
  xs: { ring: ["size-3.5"], border: "border-2", label: "text-xs" },
  sm: { ring: ["size-5"], border: "border-2", label: "text-sm" },
  md: { ring: ["size-7"], border: "border-[3px]", label: "text-sm" },
  lg: { ring: ["size-10"], border: "border-4", label: "text-base" },
  xl: { ring: ["size-14"], border: "border-[5px]", label: "text-lg" },
};
const speedClasses: Readonly<Record<SpinnerSpeed, string>> = {
  slow: "[animation-duration:1.4s]",
  normal: "[animation-duration:0.9s]",
  fast: "[animation-duration:0.55s]",
};

export function Spinner(rawProps: SpinnerProps) {
  const { props, theme } = useResolvedThemeProps("spinner", "controls", rawProps, {
    size: "md",
  } as const);
  const {
    label = "Loading",
    labelPosition = "hidden",
    color = "info",
    size,
    speed = "normal",
    theme: _themeInput,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const visibleLabel = labelPosition !== "hidden";
  const classes = mergeClasses(
    "inline-flex w-fit items-center font-balsa-body",
    labelPosition === "bottom" ? "flex-col gap-balsa-xs" : "flex-row gap-balsa-sm",
    colorClasses[color],
    className,
  );
  const ringClasses = mergeClasses(
    "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent motion-reduce:animate-none",
    sizeClasses[size].ring,
    sizeClasses[size].border,
    speedClasses[speed],
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        data-balsa="spinner"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-color={color}
        data-size={size}
        data-speed={speed}
        data-label-position={labelPosition}
        role="status"
        aria-live="polite"
        aria-label={label}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <span data-balsa="spinner-ring" className={ringClasses} aria-hidden="true" />
        {visibleLabel ? (
          <span
            className={mergeClasses(
              "font-medium text-balsa-foreground",
              sizeClasses[size].label,
            )}
            aria-hidden="true"
          >
            {label}
          </span>
        ) : null}
      </span>
    </BalsaThemeContext.Provider>
  );
}
