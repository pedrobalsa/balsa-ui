import {
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { Button, type ButtonVariant } from "./Button";
import { mergeClasses } from "./classes";
import { type Shadow, type ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ActionColor } from "./types";
import type { IconComponent } from "./Icon";

export interface ButtonGroupOption {
  id: string;
  label: string;
  icon?: IconComponent;
}

type ButtonSize = "sm" | "md" | "lg" | "xl";
type ButtonGroupVariant = "surface" | "solid" | "outline" | "glass" | "code";
type ButtonGroupShape = "rounded" | "pill";

export interface ButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: readonly ButtonGroupOption[];
  label: string;
  color?: ActionColor;
  size?: ButtonSize;
  variant?: ButtonGroupVariant;
  shape?: ButtonGroupShape;
  shadow?: Shadow;
  collapseLabels?: boolean;
  theme?: ThemeInput;
  value: string;
  onValueChange: (value: string) => void;
}

const solidColorClasses: Readonly<Record<ActionColor, string[]>> = {
  neutral: ["border-balsa-inverse", "bg-balsa-inverse", "text-balsa-inverse-foreground"],
  primary: ["border-balsa-primary", "bg-balsa-primary", "text-balsa-primary-foreground"],
  secondary: ["border-balsa-secondary", "bg-balsa-secondary", "text-balsa-secondary-foreground"],
  accent: ["border-balsa-accent", "bg-balsa-accent", "text-balsa-accent-foreground"],
  destructive: ["border-balsa-destructive", "bg-balsa-destructive", "text-balsa-destructive-foreground"],
};

const solidOptionClasses: Readonly<Record<ActionColor, { selected: string[]; idle: string[] }>> = {
  neutral: {
    selected: ["bg-balsa-inverse-foreground/20", "text-balsa-inverse-foreground", "hover:bg-balsa-inverse-foreground/20", "active:bg-balsa-inverse-foreground/30"],
    idle: ["text-balsa-inverse-foreground/75", "hover:bg-balsa-inverse-foreground/10", "active:bg-balsa-inverse-foreground/20"],
  },
  primary: {
    selected: ["bg-balsa-primary-foreground/20", "text-balsa-primary-foreground", "hover:bg-balsa-primary-foreground/20", "active:bg-balsa-primary-foreground/30"],
    idle: ["text-balsa-primary-foreground/75", "hover:bg-balsa-primary-foreground/10", "active:bg-balsa-primary-foreground/20"],
  },
  secondary: {
    selected: ["bg-balsa-secondary-foreground/20", "text-balsa-secondary-foreground", "hover:bg-balsa-secondary-foreground/20", "active:bg-balsa-secondary-foreground/30"],
    idle: ["text-balsa-secondary-foreground/75", "hover:bg-balsa-secondary-foreground/10", "active:bg-balsa-secondary-foreground/20"],
  },
  accent: {
    selected: ["bg-balsa-accent-foreground/20", "text-balsa-accent-foreground", "hover:bg-balsa-accent-foreground/20", "active:bg-balsa-accent-foreground/30"],
    idle: ["text-balsa-accent-foreground/75", "hover:bg-balsa-accent-foreground/10", "active:bg-balsa-accent-foreground/20"],
  },
  destructive: {
    selected: ["bg-balsa-destructive-foreground/20", "text-balsa-destructive-foreground", "hover:bg-balsa-destructive-foreground/20", "active:bg-balsa-destructive-foreground/30"],
    idle: ["text-balsa-destructive-foreground/75", "hover:bg-balsa-destructive-foreground/10", "active:bg-balsa-destructive-foreground/20"],
  },
};

const codeRootSizeClasses: Readonly<Record<ButtonSize, string>> = {
  sm: "h-7",
  md: "h-9",
  lg: "h-10",
  xl: "h-11",
};

const codeOptionSizeClasses: Readonly<Record<ButtonSize, string[]>> = {
  sm: ["gap-balsa-2xs", "px-balsa-sm", "text-xs"],
  md: ["gap-balsa-xs", "px-balsa-md", "text-sm"],
  lg: ["gap-balsa-sm", "px-3.5", "text-base"],
  xl: ["gap-balsa-md", "px-balsa-lg", "text-lg"],
};

const shapeClasses: Readonly<Record<ButtonGroupShape, string>> = {
  rounded: "rounded-balsa-control",
  pill: "rounded-balsa-pill",
};

/**
 * Neutral containers keep unselected options neutral and spend `color` on the
 * selected option only, matching Tabs and the code variant. Letting the action
 * color tint every idle label makes a surface group read as a colored control
 * beside otherwise neutral chrome.
 */
const neutralIdleClasses: Readonly<Record<"surface" | "outline" | "glass", string[]>> = {
  surface: [
    "text-balsa-muted-foreground",
    "hover:bg-balsa-muted",
    "hover:text-balsa-foreground",
    "active:bg-balsa-muted",
  ],
  outline: [
    "text-balsa-muted-foreground",
    "hover:bg-balsa-muted",
    "hover:text-balsa-foreground",
    "active:bg-balsa-muted",
  ],
  glass: [
    "text-balsa-muted-foreground",
    "hover:bg-balsa-surface/55",
    "hover:text-balsa-foreground",
    "active:bg-balsa-surface/70",
  ],
};

export function ButtonGroup(rawProps: ButtonGroupProps) {
  const { props, theme } = useResolvedThemeProps("button-group", "controls", rawProps, {
    size: "sm",
    variant: "surface",
    shape: "rounded",
    shadow: "auto",
  } as const);
  const {
  options,
  label,
  color = "primary",
  size: resolvedSize,
  variant: themedVariant,
  shape: resolvedShape,
  shadow: resolvedShadow,
  collapseLabels = false,
  theme: _themeInput,
  value,
  onValueChange,
  className,
  style,
  ...domProps
  } = props;
  void _themeInput;
  const resolvedVariant = rawProps.variant === undefined
    && theme.defaults.variant === undefined
    && theme.resolved.base === "glassmorphism"
    ? "glass"
    : themedVariant;

  const variantClasses: Readonly<Record<ButtonGroupVariant, string[]>> = {
    surface: ["border-balsa-border-strong", "bg-balsa-surface"],
    solid: solidColorClasses[color],
    outline: ["border-balsa-border-strong", "bg-transparent"],
    glass: ["border-balsa-border", "bg-balsa-surface-elevated/70"],
    code: [codeRootSizeClasses[resolvedSize], "border-balsa-code-foreground/20", "bg-transparent"],
  };

  const rootClasses = mergeClasses(
    "inline-flex w-fit max-w-full shrink-0 overflow-x-auto border",
    shapeClasses[resolvedShape],
    variantClasses[resolvedVariant],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="button-group"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={resolvedVariant}
        data-shape={resolvedShape}
        data-shadow={resolvedShadow}
        role="group"
        aria-label={label}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        className={rootClasses}
      >
        {options.map((item) => {
          const selected = item.id === value;
          const buttonVariant: ButtonVariant =
            resolvedVariant === "code" || resolvedVariant === "solid"
              ? "outline"
              : selected
                ? "solid"
                : resolvedVariant === "glass"
                  ? "glass"
                  : "outline";
          const optionClasses: string[] =
            resolvedVariant === "code"
              ? [
                  "h-full border-balsa-code-foreground/20 bg-transparent text-balsa-code-foreground/65 shadow-none transform-none",
                  ...codeOptionSizeClasses[resolvedSize],
                  ...(selected
                    ? ["bg-balsa-code-foreground/10", "text-balsa-code-foreground", "hover:bg-balsa-code-foreground/10", "active:bg-balsa-code-foreground/10"]
                    : ["hover:bg-balsa-code-foreground/5", "active:bg-balsa-code-foreground/10"]),
                ]
              : resolvedVariant === "solid"
                ? ["border-transparent", "shadow-none", "transform-none", ...(selected ? solidOptionClasses[color].selected : solidOptionClasses[color].idle)]
                : selected
                  ? []
                  : neutralIdleClasses[resolvedVariant];

          return (
            <Button
              key={item.id}
              variant={buttonVariant}
              color={color}
              size={resolvedVariant === "code" ? null : resolvedSize}
              prefixIcon={item.icon}
              aria-label={item.label}
              aria-pressed={selected}
              className={mergeClasses(
                "shrink-0 rounded-none border-y-0 border-r-0 border-l border-balsa-border-strong first:border-l-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-offset-[-2px]",
                optionClasses,
              )}
              onClick={() => onValueChange(item.id)}
            >
              <span className={collapseLabels && item.icon ? "hidden" : undefined}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </BalsaThemeContext.Provider>
  );
}
