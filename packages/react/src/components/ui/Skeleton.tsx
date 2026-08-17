import { type CSSProperties, type HTMLAttributes } from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type SkeletonShape = "text" | "rect" | "circle";
export type SkeletonVariant = "muted" | "soft" | "glass";
export type SkeletonSize = "sm" | "md" | "lg";
export type SkeletonAnimation = "pulse" | "wave" | "none";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  shape?: SkeletonShape;
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  rounded?: Rounded;
  animation?: SkeletonAnimation;
  lines?: number;
  theme?: ThemeInput;
}

const variantClasses: Readonly<Record<SkeletonVariant, string[]>> = {
  muted: ["bg-balsa-muted"],
  soft: ["bg-balsa-primary/15"],
  glass: ["border", "border-balsa-border/50", "bg-balsa-surface/45", "backdrop-balsa"],
};
const animationClasses: Readonly<Record<SkeletonAnimation, string[]>> = {
  pulse: ["animate-pulse", "motion-reduce:animate-none"],
  wave: [],
  none: [],
};
const textHeightClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "h-3",
  md: "h-4",
  lg: "h-5",
};
const rectHeightClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "h-16",
  md: "h-24",
  lg: "h-32",
};
const circleSizeClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "size-8",
  md: "size-12",
  lg: "size-16",
};
const lineGapClasses: Readonly<Record<SkeletonSize, string>> = {
  sm: "gap-balsa-xs",
  md: "gap-balsa-sm",
  lg: "gap-balsa-md",
};

export function Skeleton(rawProps: SkeletonProps) {
  const { props, theme } = useResolvedThemeProps("skeleton", "surfaces", rawProps, {
    shape: "rect",
    variant: "muted",
    size: "md",
    rounded: "lg",
  } as const);
  const {
    shape,
    variant,
    size,
    rounded,
    animation = "pulse",
    lines = 1,
    theme: _themeInput,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const lineCount = shape === "text" ? Math.min(12, Math.max(1, Math.trunc(lines))) : 1;
  const pieceClasses = mergeClasses(
    "relative overflow-hidden",
    variantClasses[variant],
    animationClasses[animation],
  );
  const classes = mergeClasses(
    shape === "text"
      ? ["flex w-full flex-col", lineGapClasses[size]]
      : [
          "block shrink-0",
          pieceClasses,
          shape === "circle"
            ? [circleSizeClasses[size], "rounded-full"]
            : [rectHeightClasses[size], "w-full", roundedClasses[rounded]],
        ],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        data-balsa="skeleton"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-shape={shape}
        data-variant={variant}
        data-size={size}
        data-rounded={rounded}
        data-animation={animation}
        aria-hidden="true"
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {shape === "text"
          ? Array.from({ length: lineCount }, (_, index) => (
            <span
              key={index}
              data-balsa="skeleton-piece"
              data-animation={animation}
              className={mergeClasses(
                pieceClasses,
                textHeightClasses[size],
                roundedClasses[rounded],
                index === lineCount - 1 && lineCount > 1 ? "w-3/4" : "w-full",
              )}
            />
          ))
          : null}
      </span>
    </BalsaThemeContext.Provider>
  );
}
