import {
  Bell,
  Bookmark,
  Flag,
  Heart,
  Pin,
  Star,
} from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { roundedClasses, type Rounded } from "./form";
import { Icon, type IconComponent, type IconSize } from "./Icon";
import { mergeClasses } from "./classes";
import { type Shadow, type ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import { actionColorClasses, type ActionColor } from "./types";

export type ToggleVariant = "surface" | "solid" | "outline" | "glass";
export type ToggleSize = "sm" | "md" | "lg" | "xl";
export type ToggleType = "button" | "submit" | "reset" | "icon";
export type ToggleIcon = "bookmark" | "heart" | "star" | "pin" | "bell" | "flag";

const toggleIcons: Readonly<Record<ToggleIcon, IconComponent>> = {
  bookmark: Bookmark,
  heart: Heart,
  star: Star,
  pin: Pin,
  bell: Bell,
  flag: Flag,
};

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "defaultValue" | "onChange" | "type"> {
  variant?: ToggleVariant;
  color?: ActionColor;
  size?: ToggleSize;
  rounded?: Rounded;
  prefixIcon?: IconComponent;
  suffixIcon?: IconComponent;
  icon?: ToggleIcon;
  disabled?: boolean;
  type?: ToggleType;
  shadow?: Shadow;
  theme?: ThemeInput;
  value?: boolean;
  defaultValue?: boolean;
  onValueChange?: (value: boolean) => void;
  children?: ReactNode;
}

const sizeClasses: Readonly<Record<ToggleSize, string[]>> = {
  sm: ["h-8", "gap-balsa-2xs", "px-balsa-md", "text-sm"],
  md: ["h-9", "gap-balsa-xs", "px-balsa-lg", "text-sm"],
  lg: ["h-10", "gap-balsa-xs", "px-balsa-xl", "text-sm"],
  xl: ["h-12", "gap-balsa-sm", "px-balsa-2xl", "text-base"],
};

const iconSizes: Readonly<Record<ToggleSize, IconSize>> = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const iconButtonSizeClasses: Readonly<Record<ToggleSize, string[]>> = {
  sm: ["h-8", "w-8"],
  md: ["h-9", "w-9"],
  lg: ["h-10", "w-10"],
  xl: ["h-12", "w-12"],
};

const surfaceIdleClasses = [
  "border-balsa-border-strong",
  "bg-balsa-surface",
  "text-balsa-foreground",
  "hover:bg-balsa-muted",
  "active:bg-balsa-selected",
];

const idleColorClasses: Readonly<
  Record<ActionColor, Record<Exclude<ToggleVariant, "surface">, string[]>>
> = {
  neutral: {
    solid: ["border-transparent", "bg-balsa-muted", "text-balsa-foreground", "hover:bg-balsa-muted/80", "active:bg-balsa-muted/70"],
    outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground", "hover:bg-balsa-muted", "active:bg-balsa-muted/80"],
    glass: ["border-balsa-border", "bg-balsa-surface/60", "text-balsa-foreground", "hover:bg-balsa-surface/70", "active:bg-balsa-surface/80"],
  },
  primary: {
    solid: ["border-transparent", "bg-balsa-primary/15", "text-balsa-primary", "hover:bg-balsa-primary/20", "active:bg-balsa-primary/25"],
    outline: ["border-balsa-primary", "bg-transparent", "text-balsa-primary", "hover:bg-balsa-primary/15", "active:bg-balsa-primary/25"],
    glass: ["border-balsa-primary/40", "bg-balsa-primary/10", "text-balsa-primary", "hover:bg-balsa-primary/15", "active:bg-balsa-primary/25"],
  },
  secondary: {
    solid: ["border-transparent", "bg-balsa-secondary/15", "text-balsa-secondary", "hover:bg-balsa-secondary/20", "active:bg-balsa-secondary/25"],
    outline: ["border-balsa-secondary", "bg-transparent", "text-balsa-secondary", "hover:bg-balsa-secondary/15", "active:bg-balsa-secondary/25"],
    glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10", "text-balsa-secondary", "hover:bg-balsa-secondary/15", "active:bg-balsa-secondary/25"],
  },
  accent: {
    solid: ["border-transparent", "bg-balsa-accent/15", "text-balsa-accent", "hover:bg-balsa-accent/20", "active:bg-balsa-accent/25"],
    outline: ["border-balsa-accent", "bg-transparent", "text-balsa-accent", "hover:bg-balsa-accent/15", "active:bg-balsa-accent/25"],
    glass: ["border-balsa-accent/40", "bg-balsa-accent/10", "text-balsa-accent", "hover:bg-balsa-accent/15", "active:bg-balsa-accent/25"],
  },
  destructive: {
    solid: ["border-transparent", "bg-balsa-destructive/15", "text-balsa-destructive", "hover:bg-balsa-destructive/20", "active:bg-balsa-destructive/25"],
    outline: ["border-balsa-destructive", "bg-transparent", "text-balsa-destructive", "hover:bg-balsa-destructive/15", "active:bg-balsa-destructive/25"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "hover:bg-balsa-destructive/15", "active:bg-balsa-destructive/25"],
  },
};

const iconIdleClasses = [
  "border-transparent",
  "bg-transparent",
  "text-balsa-muted-foreground",
  "hover:bg-balsa-muted",
  "hover:text-balsa-foreground",
  "active:bg-balsa-selected",
];

const iconPressedClasses: Readonly<Record<ActionColor, string[]>> = {
  neutral: ["border-transparent", "bg-transparent", "text-balsa-foreground", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  primary: ["border-transparent", "bg-transparent", "text-balsa-primary", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  secondary: ["border-transparent", "bg-transparent", "text-balsa-secondary", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  accent: ["border-transparent", "bg-transparent", "text-balsa-accent", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
  destructive: ["border-transparent", "bg-transparent", "text-balsa-destructive", "hover:bg-balsa-muted", "active:bg-balsa-selected"],
};

export function Toggle(rawProps: ToggleProps) {
  const { props, theme } = useResolvedThemeProps("toggle", "controls", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    variant,
    color = "primary",
    size,
    rounded,
    prefixIcon,
    suffixIcon,
    icon = "bookmark",
    disabled = false,
    type = "button",
    shadow,
    theme: _themeInput,
    value,
    defaultValue = false,
    onValueChange,
    className,
    style,
    children,
    onClick,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setPressed] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const isIconType = type === "icon";
  const nativeType = type === "icon" ? "button" : type;
  const pressedClasses = actionColorClasses[color].solid;
  const idleClasses = variant === "surface"
    ? surfaceIdleClasses
    : idleColorClasses[color][variant];
  const classes = mergeClasses(
    "inline-flex w-fit shrink-0 cursor-pointer items-center justify-center border font-balsa-body transition-[border-color,background-color,color,box-shadow,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:border-balsa-disabled disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
    isIconType ? iconButtonSizeClasses[size] : sizeClasses[size],
    roundedClasses[rounded],
    isIconType
      ? current ? iconPressedClasses[color] : iconIdleClasses
      : current ? pressedClasses : idleClasses,
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <button
        {...domProps}
        data-balsa="toggle"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-state={current ? "on" : "off"}
        data-variant={variant}
        data-color={color}
        data-size={size}
        data-rounded={rounded}
        data-shadow={shadow}
        type={nativeType}
        disabled={disabled}
        aria-pressed={current}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !disabled) setPressed(!current);
        }}
      >
        {isIconType ? (
          <Icon
            icon={toggleIcons[icon]}
            size={iconSizes[size]}
            className={current ? "fill-current" : "fill-none"}
          />
        ) : (
          <>
            {prefixIcon ? <Icon icon={prefixIcon} size={iconSizes[size]} /> : null}
            {children}
            {suffixIcon ? <Icon icon={suffixIcon} size={iconSizes[size]} /> : null}
          </>
        )}
      </button>
    </BalsaThemeContext.Provider>
  );
}
