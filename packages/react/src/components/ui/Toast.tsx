import {
  CircleAlert,
  CircleCheckBig,
  Info,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";
import type {
  CSSProperties,
  FocusEvent,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Icon, type IconComponent, type IconSize } from "./Icon";
import type { Shadow, ThemeInput } from "./theme";
import { BalsaThemeContext, useResolvedThemeProps } from "./theme-context";
import type { ActionColor, SemanticColor } from "./types";

export type ToastVariant = "surface" | "soft" | "outline" | "glass";
export type ToastSize = "sm" | "md" | "lg";

export interface ToastProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children" | "color" | "onPause"
> {
  id: string;
  title: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  description?: string;
  color?: SemanticColor;
  variant?: ToastVariant;
  size?: ToastSize;
  rounded?: Rounded;
  shadow?: Shadow;
  icon?: IconComponent;
  actionLabel?: string;
  dismissible?: boolean;
  closeLabel?: string;
  theme?: ThemeInput;
  onAction?: () => void;
  onDismiss?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  action?: ReactNode | ((dismiss: () => void) => ReactNode);
  children?: ReactNode;
}

const defaultIcons: Readonly<Record<SemanticColor, IconComponent>> = {
  primary: Info,
  secondary: Info,
  accent: Star,
  destructive: CircleAlert,
  success: CircleCheckBig,
  warning: TriangleAlert,
  info: Info,
};
const colorVariantClasses: Readonly<
  Record<SemanticColor, Record<ToastVariant, string[]>>
> = {
  primary: {
    surface: ["border-balsa-primary/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-primary/25", "bg-balsa-primary/15", "text-balsa-primary"],
    outline: ["border-balsa-primary", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-primary/40", "bg-balsa-primary/10", "text-balsa-primary", "backdrop-balsa"],
  },
  secondary: {
    surface: ["border-balsa-secondary/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-secondary/25", "bg-balsa-secondary/15", "text-balsa-secondary"],
    outline: ["border-balsa-secondary", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10", "text-balsa-secondary", "backdrop-balsa"],
  },
  accent: {
    surface: ["border-balsa-accent/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-accent/25", "bg-balsa-accent/15", "text-balsa-accent"],
    outline: ["border-balsa-accent", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-accent/40", "bg-balsa-accent/10", "text-balsa-accent", "backdrop-balsa"],
  },
  destructive: {
    surface: ["border-balsa-destructive/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15", "text-balsa-destructive"],
    outline: ["border-balsa-destructive", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "backdrop-balsa"],
  },
  success: {
    surface: ["border-balsa-success/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-success/25", "bg-balsa-success/15", "text-balsa-success"],
    outline: ["border-balsa-success", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-success/40", "bg-balsa-success/10", "text-balsa-success", "backdrop-balsa"],
  },
  warning: {
    surface: ["border-balsa-warning/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-warning/25", "bg-balsa-warning/15", "text-balsa-warning"],
    outline: ["border-balsa-warning", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-warning/40", "bg-balsa-warning/10", "text-balsa-warning", "backdrop-balsa"],
  },
  info: {
    surface: ["border-balsa-info/40", "bg-balsa-surface-elevated", "text-balsa-surface-elevated-foreground"],
    soft: ["border-balsa-info/25", "bg-balsa-info/15", "text-balsa-info"],
    outline: ["border-balsa-info", "bg-balsa-background", "text-balsa-foreground"],
    glass: ["border-balsa-info/40", "bg-balsa-info/10", "text-balsa-info", "backdrop-balsa"],
  },
};
const iconColorClasses: Readonly<Record<SemanticColor, string>> = {
  primary: "text-balsa-primary",
  secondary: "text-balsa-secondary",
  accent: "text-balsa-accent",
  destructive: "text-balsa-destructive",
  success: "text-balsa-success",
  warning: "text-balsa-warning",
  info: "text-balsa-info",
};
const actionColorMap: Readonly<Record<SemanticColor, ActionColor>> = {
  primary: "primary",
  secondary: "secondary",
  accent: "accent",
  destructive: "destructive",
  success: "primary",
  warning: "accent",
  info: "primary",
};
const sizeClasses: Readonly<Record<ToastSize, string>> = {
  sm: "p-balsa-md text-sm",
  md: "p-balsa-lg text-sm",
  lg: "p-balsa-xl text-base",
};
const contentGapClasses: Readonly<Record<ToastSize, string>> = {
  sm: "gap-balsa-md",
  md: "gap-balsa-lg",
  lg: "gap-balsa-xl",
};
const iconSizes: Readonly<Record<ToastSize, IconSize>> = {
  sm: "md",
  md: "lg",
  lg: "xl",
};
const titleSizeClasses: Readonly<Record<ToastSize, string>> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Toast(rawProps: ToastProps) {
  const { props, theme } = useResolvedThemeProps("toast", "overlays", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    title,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    description,
    color = "primary",
    variant,
    size,
    rounded,
    shadow,
    icon,
    actionLabel,
    dismissible = true,
    closeLabel = "Dismiss notification",
    theme: _themeInput,
    onAction,
    onDismiss,
    onPause,
    onResume,
    action,
    className,
    style,
    children,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...domProps
  } = props;
  void _dataBalsa;
  void _themeInput;

  const currentIcon = icon ?? defaultIcons[color];
  const isTintedVariant = variant === "soft" || variant === "glass";
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-description` : undefined;
  const actionContent = typeof action === "function" ? action(() => onDismiss?.()) : action;

  const classes = mergeClasses(
    "pointer-events-auto relative w-full min-w-0 border font-balsa-body shadow-balsa-surface outline-none",
    sizeClasses[size],
    roundedClasses[rounded],
    colorVariantClasses[color][variant],
    className,
  );

  function pause(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>): void {
    if (event.type === "mouseenter") onMouseEnter?.(event as MouseEvent<HTMLElement>);
    else onFocus?.(event as FocusEvent<HTMLElement>);
    onPause?.();
  }

  function resume(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>): void {
    if (event.type === "mouseleave") onMouseLeave?.(event as MouseEvent<HTMLElement>);
    else onBlur?.(event as FocusEvent<HTMLElement>);
    onResume?.();
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <article
        {...domProps}
        id={id}
        data-balsa="toast"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-color={color}
        data-variant={variant}
        data-size={size}
        data-rounded={rounded}
        data-shadow={shadow}
        role={color === "destructive" ? "alert" : "status"}
        aria-live={color === "destructive" ? "assertive" : "polite"}
        aria-atomic="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
      >
        <div className={mergeClasses("flex min-w-0 items-start", contentGapClasses[size])}>
          <Icon
            icon={currentIcon}
            size={iconSizes[size]}
            className={mergeClasses(
              "shrink-0",
              isTintedVariant ? "text-current" : iconColorClasses[color],
            )}
          />
          <div className={mergeClasses("min-w-0 flex-1", dismissible ? "pr-9" : "")}>
            <h3
              id={titleId}
              className={mergeClasses("m-0 font-semibold leading-tight", titleSizeClasses[size])}
            >
              {title}
            </h3>
            {description ? (
              <p
                id={descriptionId}
                className={mergeClasses(
                  "mt-balsa-3xs leading-relaxed",
                  isTintedVariant ? "text-current" : "text-balsa-muted-foreground",
                )}
              >
                {description}
              </p>
            ) : null}
            {children}
          </div>
        </div>

        {dismissible ? (
          <Button
            data-balsa-toast-close=""
            size={null}
            shape="fab"
            variant="outline"
            color="secondary"
            prefixIcon={X}
            aria-label={closeLabel}
            className={mergeClasses(
              "absolute right-2 top-2 size-8 min-h-0 min-w-0 border-0 bg-transparent p-0 text-lg shadow-none",
              isTintedVariant
                ? "text-current hover:bg-current/15 active:bg-current/25"
                : "text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground active:bg-balsa-muted",
            )}
            onClick={onDismiss}
          />
        ) : null}

        {actionLabel || actionContent ? (
          <div
            data-balsa-toast-action=""
            className="mt-balsa-md flex min-w-0 justify-end gap-balsa-xs"
          >
            {actionContent ?? (
              <Button
                variant="outline"
                color={actionColorMap[color]}
                size="sm"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )}
          </div>
        ) : null}
      </article>
    </BalsaThemeContext.Provider>
  );
}
