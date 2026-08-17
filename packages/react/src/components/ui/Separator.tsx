import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { mergeClasses } from "./classes";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorVariant = "solid" | "dashed" | "dotted";
export type SeparatorSize = "sm" | "md" | "lg";
export type SeparatorAlign = "start" | "center" | "end";

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: SeparatorOrientation;
  variant?: SeparatorVariant;
  size?: SeparatorSize;
  align?: SeparatorAlign;
  decorative?: boolean;
  label?: string;
  accessibleLabel?: string;
  theme?: ThemeInput;
  children?: ReactNode;
}

const borderVariantClasses: Readonly<Record<SeparatorVariant, string>> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};
const horizontalSizeClasses: Readonly<Record<SeparatorSize, string>> = {
  sm: "border-t",
  md: "border-t-2",
  lg: "border-t-4",
};
const verticalSizeClasses: Readonly<Record<SeparatorSize, string>> = {
  sm: "border-l",
  md: "border-l-2",
  lg: "border-l-4",
};
const segmentClassesByAlign: Readonly<
  Record<SeparatorAlign, { before: string; after: string }>
> = {
  start: { before: "w-8 shrink-0", after: "min-w-0 flex-1" },
  center: { before: "min-w-0 flex-1", after: "min-w-0 flex-1" },
  end: { before: "min-w-0 flex-1", after: "w-8 shrink-0" },
};

export function Separator(rawProps: SeparatorProps) {
  const { props, theme } = useResolvedThemeProps("separator", "surfaces", rawProps, {
    variant: "solid",
    size: "sm",
  } as const);
  const {
    orientation = "horizontal",
    variant,
    size,
    align = "center",
    decorative = true,
    label,
    accessibleLabel,
    theme: _themeInput,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const hasLabel = orientation === "horizontal" && Boolean(label || children);
  const lineClasses = mergeClasses(
    "border-balsa-border",
    horizontalSizeClasses[size],
    borderVariantClasses[variant],
  );
  const classes = mergeClasses(
    "border-balsa-border",
    orientation === "horizontal"
      ? hasLabel
        ? "flex w-full items-center gap-balsa-md"
        : ["block w-full", horizontalSizeClasses[size], borderVariantClasses[variant]]
      : [
          "block h-full min-h-4 w-0 shrink-0",
          verticalSizeClasses[size],
          borderVariantClasses[variant],
        ],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="separator"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-orientation={orientation}
        data-variant={variant}
        data-size={size}
        data-align={align}
        data-decorative={decorative}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        aria-label={decorative ? undefined : accessibleLabel}
        aria-hidden={decorative ? true : undefined}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {hasLabel ? (
          <>
            <span
              aria-hidden="true"
              className={mergeClasses(lineClasses, segmentClassesByAlign[align].before)}
            />
            <span className="shrink-0 font-balsa-body text-sm font-medium text-balsa-muted-foreground">
              {children ?? label}
            </span>
            <span
              aria-hidden="true"
              className={mergeClasses(lineClasses, segmentClassesByAlign[align].after)}
            />
          </>
        ) : null}
      </div>
    </BalsaThemeContext.Provider>
  );
}
