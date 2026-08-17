import { LoaderCircle } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { actionColorClasses, type ActionColor } from "./types";
import { type Shadow, type ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import { mergeClasses } from "./classes";
import { Icon, type IconComponent, type IconSize } from "./Icon";

export type ButtonVariant = "solid" | "soft" | "outline" | "glass";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "2xl";
type ButtonShape = "rounded" | "pill" | "fab";
type ButtonIconPlacement = "none" | "prefix" | "suffix" | "both";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ActionColor;
  size?: ButtonSize | null;
  shape?: ButtonShape;
  prefixIcon?: IconComponent;
  suffixIcon?: IconComponent;
  loading?: boolean;
  analyticsEvent?: string;
  shadow?: Shadow;
  theme?: ThemeInput;
  children?: ReactNode;
}

const sizeClasses: Record<ButtonSize, string[]> = {
  sm: ["h-8", "gap-balsa-2xs", "text-sm"],
  md: ["h-9", "gap-balsa-xs", "text-sm"],
  lg: ["h-10", "gap-balsa-xs", "text-sm"],
  xl: ["h-12", "gap-balsa-sm", "text-base"],
  "2xl": ["h-18", "gap-balsa-md", "text-xl"],
};

/*
 * The inset is not here any more. It follows from the size, and from whether an
 * icon sits beside it; both are published as data for the stylesheet to key on.
 * See the icon-adjacency rule in balsa-theme.css.
 */
const iconSizes: Record<ButtonSize, IconSize> = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "md",
  "2xl": "lg",
};

const shapeClasses: Record<ButtonShape, string[]> = {
  rounded: ["rounded-balsa-control"],
  pill: ["rounded-balsa-pill"],
  fab: ["rounded-balsa-pill", "p-0"],
};

const fabSizeClasses: Record<ButtonSize, string[]> = {
  sm: ["h-8", "w-8"],
  md: ["h-9", "w-9"],
  lg: ["h-10", "w-10"],
  xl: ["h-12", "w-12"],
  "2xl": ["h-18", "w-18"],
};

const fabIconSizes: Record<ButtonSize, IconSize> = {
  sm: "sm",
  md: "md",
  lg: "md",
  xl: "lg",
  "2xl": "xl",
};

export function Button(rawProps: ButtonProps) {
  const { props, theme } = useResolvedThemeProps("button", "controls", rawProps, {
    variant: "solid",
    size: "md",
    shape: "rounded",
    shadow: "auto",
  } as const);
  const {
  variant,
  color = "primary",
  size,
  shape,
  prefixIcon,
  suffixIcon,
  disabled = false,
  loading = false,
  analyticsEvent,
  type = "button",
  shadow,
  theme: _themeInput,
  className,
  style,
  children,
  ...domProps
  } = props;
  void _themeInput;

  const leadingIcon = loading ? LoaderCircle : prefixIcon;
  const trailingIcon = loading ? undefined : suffixIcon;

  const iconPlacement: ButtonIconPlacement = leadingIcon && trailingIcon
    ? "both"
    : leadingIcon
      ? "prefix"
      : trailingIcon
        ? "suffix"
        : "none";

  const isDisabled = disabled || loading;
  const classes = mergeClasses(
    // No `duration-200 ease-in-out`. The shared control rule already sets
    // transition duration and easing from the motion tokens, and a literal
    // utility outranks it -- so every button animated for a fixed 200ms at
    // every motion setting, including the one that asks for none.
    "inline-flex w-fit items-center justify-center font-balsa-body transition-colors hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:border-balsa-disabled disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    actionColorClasses[color][variant],
    variant === "outline" ? ["bg-transparent"] : [],
    size ? sizeClasses[size] : [],
    shapeClasses[shape],
    shape === "fab" && size
      ? fabSizeClasses[size]
      : [],
    loading ? "disabled:cursor-progress" : "disabled:cursor-not-allowed",
    className,
  );

  const iconSize: IconSize = !size
    ? "md"
    : shape === "fab"
      ? fabIconSizes[size]
      : iconSizes[size];

  return (
    <BalsaThemeContext.Provider value={theme}>
      <button
        {...domProps}
        data-balsa="button"
        data-balsa-track={analyticsEvent?.trim() || undefined}
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-shape={shape}
        data-color={color}
        data-shadow={shadow}
        data-size={size ?? undefined}
        data-icon={iconPlacement}
        type={type}
        disabled={isDisabled}
        aria-busy={loading ? true : undefined}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        className={classes}
      >
        {leadingIcon ? (
          <Icon
            icon={leadingIcon}
            size={iconSize}
            className={loading ? "animate-spin" : undefined}
          />
        ) : null}
        {children}
        {trailingIcon ? <Icon icon={trailingIcon} size={iconSize} /> : null}
      </button>
    </BalsaThemeContext.Provider>
  );
}
