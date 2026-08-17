import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { semanticColorClasses, type Rounded, type SemanticColor } from "./types";
import { type ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import { mergeClasses } from "./classes";

export type BadgeVariant = "solid" | "soft" | "outline" | "glass";
type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: SemanticColor;
  size?: BadgeSize;
  rounded?: Rounded;
  theme?: ThemeInput;
  children?: ReactNode;
}

const sizeClasses: Readonly<Record<BadgeSize, string>> = {
  sm: "px-balsa-xs py-balsa-4xs text-xs",
  md: "px-balsa-sm py-balsa-4xs text-xs",
  lg: "px-balsa-md py-balsa-3xs text-sm",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

export function Badge(rawProps: BadgeProps) {
  const { props, theme } = useResolvedThemeProps("badge", "controls", rawProps, {
    variant: "solid",
    size: "md",
    rounded: "full",
  } as const);
  const {
  variant,
  color = "accent",
  size,
  rounded,
  // Omit from the DOM rest; resolved values live on `theme` from the helper.
  theme: _themeInput,
  className,
  style,
  children,
  ...domProps
  } = props;
  void _themeInput;

  const classes = mergeClasses(
    "inline-flex",
    roundedClasses[rounded],
    sizeClasses[size],
    semanticColorClasses[color][variant],
    variant === "outline" ? ["border", "bg-transparent"] : [],
    variant === "glass" ? "border" : [],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        data-balsa="badge"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-color={color}
        data-size={size}
        data-rounded={rounded}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        className={classes}
      >
        {children}
      </span>
    </BalsaThemeContext.Provider>
  );
}
