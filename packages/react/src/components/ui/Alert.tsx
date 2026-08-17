import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from "lucide-react";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import { Icon, type IconComponent, type IconSize } from "./Icon";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import type { Shadow, ThemeInput } from "./theme";

export type AlertMode = "inline" | "dialog";
export type AlertColor = "neutral" | "info" | "success" | "warning" | "destructive";
export type AlertVariant = "surface" | "outline" | "soft" | "solid" | "glass";
export type AlertSize = "sm" | "md" | "lg";
export type AlertInitialFocus = "dialog" | "action" | "close";

export interface AlertProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "color" | "id"> {
  id: string;
  title: string;
  description?: string;
  mode?: AlertMode;
  color?: AlertColor;
  variant?: AlertVariant;
  size?: AlertSize;
  rounded?: SurfaceRounded;
  shadow?: Shadow;
  icon?: IconComponent;
  persistent?: boolean;
  closeLabel?: string;
  outsideDismiss?: boolean;
  escapeDismiss?: boolean;
  initialFocus?: AlertInitialFocus;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  actions?: ReactNode | ((close: () => void) => ReactNode);
  children?: ReactNode;
}

const defaultIcons: Readonly<Record<AlertColor, IconComponent>> = {
  neutral: Info,
  info: Info,
  success: CircleCheckBig,
  warning: TriangleAlert,
  destructive: CircleAlert,
};
const colorVariantClasses: Readonly<
  Record<AlertColor, Record<AlertVariant, string[]>>
> = {
  neutral: {
    surface: ["border-balsa-border-strong", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-border-strong", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-border", "bg-balsa-muted", "text-balsa-foreground"],
    solid: ["border-balsa-inverse", "bg-balsa-inverse", "text-balsa-inverse-foreground"],
    glass: ["border-balsa-border/60", "bg-balsa-surface/45", "text-balsa-surface-foreground", "backdrop-balsa"],
  },
  info: {
    surface: ["border-balsa-info/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-info", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-info/25", "bg-balsa-info/15", "text-balsa-info"],
    solid: ["border-balsa-info", "bg-balsa-info", "text-balsa-info-foreground"],
    glass: ["border-balsa-info/40", "bg-balsa-info/10", "text-balsa-info", "backdrop-balsa"],
  },
  success: {
    surface: ["border-balsa-success/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-success", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-success/25", "bg-balsa-success/15", "text-balsa-success"],
    solid: ["border-balsa-success", "bg-balsa-success", "text-balsa-success-foreground"],
    glass: ["border-balsa-success/40", "bg-balsa-success/10", "text-balsa-success", "backdrop-balsa"],
  },
  warning: {
    surface: ["border-balsa-warning/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-warning", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-warning/25", "bg-balsa-warning/15", "text-balsa-warning"],
    solid: ["border-balsa-warning", "bg-balsa-warning", "text-balsa-warning-foreground"],
    glass: ["border-balsa-warning/40", "bg-balsa-warning/10", "text-balsa-warning", "backdrop-balsa"],
  },
  destructive: {
    surface: ["border-balsa-destructive/40", "bg-balsa-surface", "text-balsa-surface-foreground"],
    outline: ["border-balsa-destructive", "bg-balsa-background", "text-balsa-foreground"],
    soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15", "text-balsa-destructive"],
    solid: ["border-balsa-destructive", "bg-balsa-destructive", "text-balsa-destructive-foreground"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10", "text-balsa-destructive", "backdrop-balsa"],
  },
};
const iconColorClasses: Readonly<Record<AlertColor, string>> = {
  neutral: "text-balsa-muted-foreground",
  info: "text-balsa-info",
  success: "text-balsa-success",
  warning: "text-balsa-warning",
  destructive: "text-balsa-destructive",
};
const sizeClasses: Readonly<Record<AlertSize, string>> = {
  sm: "p-balsa-md text-sm",
  md: "p-balsa-lg text-sm",
  lg: "p-balsa-xl text-base",
};
const contentGapClasses: Readonly<Record<AlertSize, string>> = {
  sm: "gap-balsa-md",
  md: "gap-balsa-lg",
  lg: "gap-balsa-xl",
};
const dialogSizeClasses: Readonly<Record<AlertSize, string>> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};
const iconSizes: Readonly<Record<AlertSize, IconSize>> = {
  sm: "md",
  md: "lg",
  lg: "xl",
};
const titleSizeClasses: Readonly<Record<AlertSize, string>> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Alert(rawProps: AlertProps) {
  const { props, theme } = useResolvedThemeProps("alert", "surfaces", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "auto",
    shadow: "auto",
  } as const);
  const {
    id,
    title,
    description,
    mode = "inline",
    color = "neutral",
    variant,
    size,
    rounded,
    shadow,
    icon,
    persistent = false,
    closeLabel = "Dismiss alert",
    outsideDismiss = false,
    escapeDismiss = true,
    initialFocus = "action",
    theme: _themeInput,
    open,
    defaultOpen,
    onOpenChange,
    onDismiss,
    actions,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _themeInput;

  const [visible, setVisible] = useControllableState({
    value: open,
    defaultValue: defaultOpen ?? mode === "inline",
    onChange: onOpenChange,
  });
  const rootRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef("");
  const scrollLockedRef = useRef(false);

  const titleId = `${id}-title`;
  const descriptionId = description || children ? `${id}-description` : undefined;
  const currentIcon = icon ?? defaultIcons[color];
  const canDismiss = !persistent;
  const isColoredTextVariant = variant === "soft" || variant === "solid" || variant === "glass";
  const presentation = mode === "dialog" ? theme.presentation : theme.explicitPresentation;

  function dismiss(): void {
    if (!canDismiss) return;
    setVisible(false);
    onDismiss?.();
  }

  const actionContent = typeof actions === "function" ? actions(dismiss) : actions;

  function restoreOverflow(): void {
    if (!scrollLockedRef.current) return;
    document.documentElement.style.overflow = previousOverflowRef.current;
    scrollLockedRef.current = false;
  }

  function focusDialogTarget(dialog: HTMLDialogElement): void {
    if (initialFocus === "dialog") {
      dialog.focus();
      return;
    }
    const selector = initialFocus === "close"
      ? "[data-balsa-alert-close]"
      : "[data-balsa-alert-actions] button:not([disabled]), [data-balsa-alert-actions] a[href]";
    const target = dialog.querySelector<HTMLElement>(selector);
    if (target) target.focus();
    else dialog.focus();
  }

  function openDialog(): void {
    const dialog = rootRef.current;
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    previousOverflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    scrollLockedRef.current = true;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    queueMicrotask(() => focusDialogTarget(dialog));
  }

  function closeDialog(): void {
    const dialog = rootRef.current;
    if (dialog instanceof HTMLDialogElement) {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    restoreOverflow();
    queueMicrotask(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      returnFocusRef.current = null;
    });
  }

  function handleCancel(event: SyntheticEvent): void {
    event.preventDefault();
    if (escapeDismiss) dismiss();
  }

  function handleDialogClick(event: ReactMouseEvent<HTMLElement>): void {
    const dialog = rootRef.current;
    if (!(dialog instanceof HTMLDialogElement) || event.target !== dialog || !outsideDismiss) {
      return;
    }
    const bounds = dialog.getBoundingClientRect();
    const inside = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
    if (!inside) dismiss();
  }

  function handleNativeClose(): void {
    if (visible) setVisible(false);
    restoreOverflow();
  }

  useEffect(() => {
    if (mode !== "dialog") {
      restoreOverflow();
      return;
    }
    if (visible) openDialog();
    else closeDialog();
    return () => {
      restoreOverflow();
    };
  }, [visible, mode]);

  if (mode !== "dialog" && !visible) return null;

  const Tag = mode === "dialog" ? "dialog" : "section";
  const classes = mergeClasses(
    "relative min-w-0 font-balsa-body",
    sizeClasses[size],
    surfaceRoundedClasses[rounded],
    colorVariantClasses[color][variant],
    mode === "dialog"
      ? [
          "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-auto shadow-balsa-surface outline-none",
          "[&::backdrop]:bg-balsa-overlay [&::backdrop]:backdrop-balsa-overlay",
          dialogSizeClasses[size],
          visible ? "" : "hidden",
        ]
      : "w-full",
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <Tag
        {...domProps}
        id={id}
        ref={rootRef as never}
        data-balsa="alert"
        data-theme={presentation?.id}
        data-theme-base={presentation?.base}
        data-mode={mode}
        data-color={color}
        data-variant={variant}
        data-size={size}
        data-rounded={rounded}
        data-shadow={shadow}
        role={mode === "dialog" ? "alertdialog" : "alert"}
        tabIndex={mode === "dialog" ? -1 : undefined}
        aria-modal={mode === "dialog" ? true : undefined}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={classes}
        style={
          {
            ...presentation?.style,
            ...style,
          } as CSSProperties
        }
        onCancel={mode === "dialog" ? handleCancel : undefined}
        onClick={mode === "dialog" ? handleDialogClick : undefined}
        onClose={mode === "dialog" ? handleNativeClose : undefined}
      >
        <div className={mergeClasses("flex min-w-0 items-start", contentGapClasses[size])}>
          <Icon
            icon={currentIcon}
            size={iconSizes[size]}
            className={mergeClasses(
              "shrink-0",
              isColoredTextVariant ? "text-current" : iconColorClasses[color],
            )}
          />
          <div className={mergeClasses("min-w-0 flex-1", canDismiss ? "pr-balsa-3xl" : "")}>
            <h3
              id={titleId}
              className={mergeClasses("m-0 font-semibold leading-tight", titleSizeClasses[size])}
            >
              {title}
            </h3>
            {description || children ? (
              <div
                id={descriptionId}
                className={mergeClasses(
                  "mt-balsa-3xs leading-relaxed",
                  isColoredTextVariant ? "text-current" : "text-balsa-muted-foreground",
                )}
              >
                {description ? <p>{description}</p> : null}
                {children}
              </div>
            ) : null}
          </div>
        </div>
        {actionContent ? (
          <div
            data-balsa-alert-actions=""
            className="mt-balsa-md flex min-w-0 flex-wrap justify-end gap-balsa-xs"
          >
            {actionContent}
          </div>
        ) : null}
        {canDismiss ? (
          <Button
            data-balsa-alert-close=""
            size={null}
            shape="fab"
            variant="outline"
            color="secondary"
            prefixIcon={X}
            aria-label={closeLabel}
            className={mergeClasses(
              "absolute right-2 top-2 size-8 min-h-0 min-w-0 border-0 bg-transparent p-0 text-lg shadow-none",
              isColoredTextVariant
                ? "text-current hover:bg-current/15 active:bg-current/25"
                : "text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground active:bg-balsa-muted",
            )}
            onClick={dismiss}
          />
        ) : null}
      </Tag>
    </BalsaThemeContext.Provider>
  );
}
