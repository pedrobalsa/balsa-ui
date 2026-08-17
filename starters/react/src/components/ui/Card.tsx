import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import type { CardColor, CardPadding, CardSize, CardVariant, Rounded } from "./types";
import { type Shadow, type ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import { mergeClasses } from "./classes";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  color?: CardColor;
  padding?: CardPadding;
  size?: CardSize;
  rounded?: Rounded;
  shadow?: Shadow | boolean;
  theme?: ThemeInput;
  children?: ReactNode;
}

const variantClasses: Record<CardVariant, string[]> = {
  surface: [
    "border-balsa-border",
    "bg-balsa-surface",
    "text-balsa-surface-foreground",
  ],
  elevated: [
    "border-balsa-border",
    "bg-balsa-surface-elevated",
    "text-balsa-surface-elevated-foreground",
  ],
  muted: ["border-balsa-border", "bg-balsa-muted", "text-balsa-muted-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["text-balsa-foreground"],
  // Blur is theme-owned through --balsa-backdrop-blur; a utility here would sit
  // in Tailwind's utilities layer and silently outrank the token.
  glass: ["text-balsa-foreground"],
};
const colorClasses: Readonly<Record<CardColor, Record<CardVariant, string[]>>> = {
  neutral: {
    surface: [], elevated: [], muted: [], outline: [],
    soft: ["border-balsa-border", "bg-balsa-muted/60"], glass: ["border-balsa-border/70"],
  },
  primary: {
    surface: ["border-balsa-primary/30"], elevated: ["border-balsa-primary/40"], muted: ["border-balsa-primary/25"],
    outline: ["border-balsa-primary"], soft: ["border-balsa-primary/25", "bg-balsa-primary/15"], glass: ["border-balsa-primary/40"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], elevated: ["border-balsa-secondary/40"], muted: ["border-balsa-secondary/25"],
    outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/25", "bg-balsa-secondary/15"], glass: ["border-balsa-secondary/40"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], elevated: ["border-balsa-accent/40"], muted: ["border-balsa-accent/25"],
    outline: ["border-balsa-accent"], soft: ["border-balsa-accent/25", "bg-balsa-accent/15"], glass: ["border-balsa-accent/40"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], elevated: ["border-balsa-destructive/40"], muted: ["border-balsa-destructive/25"],
    outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15"], glass: ["border-balsa-destructive/40"],
  },
};
const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-balsa-lg",
  md: "p-balsa-xl",
  lg: "p-balsa-2xl",
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};

function resolveShadow(shadow: Shadow | boolean): Shadow {
  if (shadow === true) return "auto";
  if (shadow === false) return "none";
  return shadow;
}

export function Card(rawProps: CardProps) {
  const { props, theme } = useResolvedThemeProps("card", "surfaces", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "2xl",
    shadow: "auto",
  } as const);
  const {
    variant,
    color = "neutral",
    padding,
    size,
    rounded,
    shadow,
    theme: _themeInput,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const resolvedShadow = resolveShadow(shadow);
  const resolvedPadding = (padding
    ?? (theme.defaults.padding as CardPadding | undefined)
    ?? size) as CardPadding;
  const emitRoundedClass = rawProps.rounded !== undefined || theme.defaults.rounded !== undefined;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="card"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-color={color}
        data-size={size}
        data-rounded={rounded}
        data-shadow={resolvedShadow}
        data-padding={resolvedPadding}
        className={mergeClasses(
          "min-w-0",
          emitRoundedClass ? roundedClasses[rounded] : undefined,
          variantClasses[variant],
          colorClasses[color][variant],
          paddingClasses[resolvedPadding],
          className,
        )}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </BalsaThemeContext.Provider>
  );
}
