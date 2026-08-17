import { X } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Icon } from "./Icon";
import {
  capturePortalPresentation,
  type PortalPresentationSnapshot,
} from "./portal-core";
import { semanticColorClasses, type ActionColor } from "./types";
import type { Shadow, ThemeInput, ThemePresentation } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type ModalPresentation = "dialog" | "sheet" | "fullscreen";
export type ModalVariant = "surface" | "solid" | "outline" | "soft" | "glass";
export type ModalSize = "sm" | "md" | "lg" | "full";

export interface ModalProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children" | "id" | "color"> {
  id: string;
  title: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  description?: string;
  presentation?: ModalPresentation;
  variant?: ModalVariant;
  color?: ActionColor;
  contained?: boolean;
  closeLabel?: string;
  size?: ModalSize;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  eyebrow?: ReactNode;
  footer?: (close: () => void) => ReactNode;
  children?: ReactNode;
}

const dialogSizeClasses: Readonly<Record<ModalSize, string>> = {
  sm: "max-w-md p-balsa-xl",
  md: "max-w-lg p-balsa-2xl",
  lg: "max-w-2xl p-balsa-2xl",
  full: "h-full max-w-none p-balsa-xl",
};
const topRoundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-t-none",
  sm: "rounded-t-sm",
  md: "rounded-t-md",
  lg: "rounded-t-lg",
  xl: "rounded-t-xl",
  "2xl": "rounded-t-2xl",
  "3xl": "rounded-t-3xl",
  full: "rounded-t-full",
};
const panelVariantClasses: Readonly<Record<ModalVariant, string>> = {
  surface: "border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground",
  solid: "border",
  outline: "border-balsa-border-strong bg-balsa-background text-balsa-foreground",
  soft: "text-balsa-foreground",
  glass: "text-balsa-surface-foreground",
};
const panelColorClasses: Readonly<Record<ActionColor, Record<ModalVariant, string[]>>> = {
  neutral: {
    surface: [],
    solid: ["border-balsa-inverse", "bg-balsa-inverse", "text-balsa-inverse-foreground"],
    outline: ["border-balsa-border-strong"],
    soft: ["bg-balsa-muted"],
    glass: [],
  },
  primary: {
    surface: ["border-balsa-primary/30"],
    solid: ["border-balsa-primary", ...semanticColorClasses.primary.solid],
    outline: ["border-balsa-primary"],
    soft: ["border-balsa-primary/25", "bg-balsa-primary/15"],
    glass: ["border-balsa-primary/40", "bg-balsa-primary/10"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"],
    solid: ["border-balsa-secondary", ...semanticColorClasses.secondary.solid],
    outline: ["border-balsa-secondary"],
    soft: ["border-balsa-secondary/25", "bg-balsa-secondary/15"],
    glass: ["border-balsa-secondary/40", "bg-balsa-secondary/10"],
  },
  accent: {
    surface: ["border-balsa-accent/30"],
    solid: ["border-balsa-accent", ...semanticColorClasses.accent.solid],
    outline: ["border-balsa-accent"],
    soft: ["border-balsa-accent/25", "bg-balsa-accent/15"],
    glass: ["border-balsa-accent/40", "bg-balsa-accent/10"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"],
    solid: ["border-balsa-destructive", ...semanticColorClasses.destructive.solid],
    outline: ["border-balsa-destructive"],
    soft: ["border-balsa-destructive/25", "bg-balsa-destructive/15"],
    glass: ["border-balsa-destructive/40", "bg-balsa-destructive/10"],
  },
};
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");
const pageScrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export function Modal(rawProps: ModalProps) {
  const { props, theme } = useResolvedThemeProps("modal", "overlays", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "2xl",
    shadow: "auto",
  } as const);
  const {
    id,
    title,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    description,
    presentation = "dialog",
    variant,
    color = "primary",
    contained = false,
    closeLabel = "Close modal",
    size,
    rounded,
    shadow,
    theme: _themeInput,
    open,
    defaultOpen = false,
    onOpenChange,
    eyebrow,
    footer,
    className,
    style,
    children,
    ...domProps
  } = props;
  void _dataBalsa;
  void _themeInput;

  const [current, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const scope = useBalsaPortalScope();
  const rootRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const openRef = useRef(current);
  openRef.current = current;

  const showPanel = mounted && current;
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-description` : undefined;
  const layerPositionClasses = contained ? "absolute inset-0" : "fixed inset-0";

  function close(): void {
    setOpen(false);
  }

  function handleKeydown(event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent): void {
    if (event.key === "Escape" && openRef.current) {
      close();
      return;
    }
    if (event.key !== "Tab" || !openRef.current) return;

    const dialog = panelRef.current;
    const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      dialog?.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function capturePresentation(): void {
    const root = rootRef.current;
    if (!root?.isConnected) return;
    const currentTheme = themeRef.current;
    const presentationSnapshot: ThemePresentation | undefined = currentTheme.inherited || currentTheme.explicitPresentation
      ? currentTheme.presentation
      : undefined;
    try {
      const snapshot = capturePortalPresentation(root, presentationSnapshot);
      setPortalSnapshot((currentSnapshot) => (
        currentSnapshot
          && currentSnapshot.themeId === snapshot.themeId
          && currentSnapshot.themeBase === snapshot.themeBase
          && currentSnapshot.paletteId === snapshot.paletteId
          && currentSnapshot.adapt === snapshot.adapt
          ? currentSnapshot
          : snapshot
      ));
    } catch {
      setPortalSnapshot((currentSnapshot) => currentSnapshot);
    }
  }

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!showPanel) return;
    capturePresentation();
    if (document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement;
    }
    panelRef.current?.focus();
    return () => {
      const previous = returnFocusRef.current;
      returnFocusRef.current = null;
      if (previous?.isConnected) previous.focus();
    };
  }, [showPanel]);

  useLayoutEffect(() => {
    if (!showPanel || contained) return;
    const lockedScrollX = window.scrollX;
    const lockedScrollY = window.scrollY;

    function preventPageScroll(event: Event): void {
      const target = event.target;
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      event.preventDefault();
    }

    function preventPageKeyboardScroll(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      if (pageScrollKeys.has(event.key)) event.preventDefault();
    }

    function restoreLockedScrollPosition(): void {
      if (window.scrollX !== lockedScrollX || window.scrollY !== lockedScrollY) {
        window.scrollTo(lockedScrollX, lockedScrollY);
      }
    }

    window.addEventListener("wheel", preventPageScroll, { passive: false });
    window.addEventListener("touchmove", preventPageScroll, { passive: false });
    window.addEventListener("keydown", preventPageKeyboardScroll);
    window.addEventListener("scroll", restoreLockedScrollPosition);
    return () => {
      window.removeEventListener("wheel", preventPageScroll);
      window.removeEventListener("touchmove", preventPageScroll);
      window.removeEventListener("keydown", preventPageKeyboardScroll);
      window.removeEventListener("scroll", restoreLockedScrollPosition);
    };
  }, [showPanel, contained]);

  const panelPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const portalStyle = {
    ...panelPresentation.style,
    ...style,
  } as CSSProperties;
  const backdropClasses = mergeClasses(layerPositionClasses, "z-40 cursor-default bg-balsa-overlay backdrop-balsa");
  const viewportClasses = mergeClasses(
    "pointer-events-none z-50 flex",
    layerPositionClasses,
    presentation === "fullscreen"
      ? "items-stretch justify-stretch p-0"
      : presentation === "sheet"
        ? "items-end justify-center p-0"
        : "items-center justify-center p-balsa-lg",
  );
  const panelClasses = mergeClasses(
    "pointer-events-auto relative w-full outline-none",
    presentation === "fullscreen"
      ? "h-full overflow-hidden rounded-none border-0 bg-transparent shadow-none"
      : [
          "border shadow-balsa-surface",
          panelVariantClasses[variant],
          panelColorClasses[color][variant],
          presentation === "sheet"
            ? [
                contained ? "max-h-[calc(100%-2rem)] p-balsa-xl" : "max-h-[calc(100dvh-2rem)] p-balsa-xl sm:p-6",
                "overflow-auto border-b-0",
                topRoundedClasses[rounded],
              ]
            : [
                "flex flex-col",
                contained ? "max-h-full" : "max-h-[calc(100dvh-2rem)]",
                dialogSizeClasses[size],
                roundedClasses[rounded],
              ],
        ],
    className,
  );
  const closeButtonClasses = presentation === "fullscreen"
    ? "absolute right-6 top-6 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full border border-balsa-border bg-balsa-surface/70 text-balsa-surface-foreground shadow-balsa-surface backdrop-balsa transition-colors hover:bg-balsa-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
    : variant === "solid"
      ? "absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-md text-current/80 transition-colors hover:bg-current/10 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
      : "absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-md text-balsa-muted-foreground transition-colors hover:bg-balsa-muted hover:text-balsa-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring";
  const headerClasses = presentation === "fullscreen" ? "sr-only" : "mb-balsa-xl shrink-0 pr-10";
  const eyebrowClasses = variant === "solid"
    ? "mb-balsa-xs block text-current/75"
    : "mb-balsa-xs block text-balsa-accent";
  const bodyClasses = presentation === "dialog" ? "min-h-0 flex-1 overflow-y-auto" : undefined;
  const descriptionClasses = variant === "solid"
    ? "text-sm text-current/80"
    : "text-sm text-balsa-muted-foreground";
  const footerContent = footer?.(close);

  const overlay = showPanel ? (
    <>
      <button
        data-balsa="modal-backdrop"
        data-theme={panelPresentation.themeId}
        data-theme-base={panelPresentation.themeBase}
        data-palette={panelPresentation.paletteId}
        style={portalStyle}
        type="button"
        className={backdropClasses}
        aria-label={closeLabel}
        onClick={close}
      />
      <div
        data-theme={panelPresentation.themeId}
        data-theme-base={panelPresentation.themeBase}
        data-palette={panelPresentation.paletteId}
        style={panelPresentation.style as CSSProperties}
        className={viewportClasses}
        onKeyDown={handleKeydown}
      >
        <section
          id={id}
          ref={panelRef}
          data-balsa="modal-panel"
          data-theme={panelPresentation.themeId}
          data-theme-base={panelPresentation.themeBase}
          data-palette={panelPresentation.paletteId}
          data-size={size}
          data-variant={variant}
          data-color={color}
          data-presentation={presentation}
          data-shadow={presentation === "fullscreen" ? "none" : shadow}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={panelClasses}
        >
          <button
            type="button"
            className={closeButtonClasses}
            aria-label={closeLabel}
            onClick={close}
          >
            <Icon icon={X} size={presentation === "fullscreen" ? "lg" : "md"} />
          </button>
          <header className={headerClasses}>
            {eyebrow ? <small className={eyebrowClasses}>{eyebrow}</small> : null}
            <h3
              id={titleId}
              className="mb-balsa-xs font-balsa-title text-lg font-semibold leading-none tracking-tight"
            >
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className={descriptionClasses}>
                {description}
              </p>
            ) : null}
          </header>
          <div className={bodyClasses}>{children}</div>
          {footerContent ? (
            <footer className="mt-balsa-2xl flex shrink-0 flex-wrap gap-balsa-xs">
              {footerContent}
            </footer>
          ) : null}
        </section>
      </div>
    </>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        ref={rootRef}
        data-balsa="modal"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-size={size}
        data-variant={variant}
        data-color={color}
        data-rounded={rounded}
        className="contents"
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        {contained ? overlay : (portalHost && overlay ? createPortal(overlay, portalHost) : null)}
      </span>
    </BalsaThemeContext.Provider>
  );
}
