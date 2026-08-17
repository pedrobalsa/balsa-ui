import { X } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { type LayerVariant } from "./anchored-layer";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Icon } from "./Icon";
import {
  capturePortalPresentation,
  type PortalPresentationSnapshot,
} from "./portal-core";
import type { Shadow, ThemeInput, ThemePresentation } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type DrawerSide = "left" | "right" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";
export type DrawerVariant = LayerVariant;

export interface DrawerProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children" | "id"> {
  id: string;
  title: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  description?: string;
  side?: DrawerSide;
  size?: DrawerSize;
  variant?: DrawerVariant;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  dismissible?: boolean;
  showHandle?: boolean;
  closeLabel?: string;
  initialFocus?: string;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  footer?: (close: () => void) => ReactNode;
  children?: ReactNode;
}

const variantClasses: Readonly<Record<DrawerVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/85 text-balsa-surface-foreground backdrop-balsa"],
};
const sideClasses: Readonly<Record<DrawerSide, string[]>> = {
  bottom: ["bottom-0 left-0 right-0 top-auto border-b-0"],
  top: ["bottom-auto left-0 right-0 top-0 border-t-0"],
  left: ["bottom-0 left-0 right-auto top-0 border-l-0"],
  right: ["bottom-0 left-auto right-0 top-0 border-r-0"],
};
const edgeRoundedClasses: Readonly<Record<DrawerSide, string>> = {
  bottom: "rounded-b-none",
  top: "rounded-t-none",
  left: "rounded-l-none",
  right: "rounded-r-none",
};
const handlePositionClasses: Readonly<Record<DrawerSide, string>> = {
  bottom: "left-1/2 top-3 h-1.5 w-14 -translate-x-1/2 cursor-ns-resize",
  top: "bottom-3 left-1/2 h-1.5 w-14 -translate-x-1/2 cursor-ns-resize",
  left: "right-3 top-1/2 h-14 w-1.5 -translate-y-1/2 cursor-ew-resize",
  right: "left-3 top-1/2 h-14 w-1.5 -translate-y-1/2 cursor-ew-resize",
};
const sizeClasses: Readonly<Record<DrawerSize, Record<"vertical" | "horizontal", string>>> = {
  sm: { vertical: "max-h-[min(20rem,calc(100dvh-3rem))]", horizontal: "w-[min(20rem,calc(100vw-3rem))]" },
  md: { vertical: "max-h-[min(32rem,calc(100dvh-3rem))]", horizontal: "w-[min(26rem,calc(100vw-3rem))]" },
  lg: { vertical: "max-h-[calc(100dvh-3rem)]", horizontal: "w-[min(36rem,calc(100vw-1rem))]" },
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

export function Drawer(rawProps: DrawerProps) {
  const { props, theme } = useResolvedThemeProps("drawer", "overlays", rawProps, {
    size: "md",
    variant: "surface",
    rounded: "2xl",
    shadow: "auto",
  } as const);
  const {
    id,
    title,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    description,
    side = "bottom",
    size,
    variant,
    rounded,
    shadow,
    contained = false,
    dismissible = true,
    showHandle = false,
    closeLabel = "Close drawer",
    initialFocus,
    theme: _themeInput,
    open,
    defaultOpen = false,
    onOpenChange,
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
  const dragStartRef = useRef(0);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const openRef = useRef(current);
  openRef.current = current;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  const sideRef = useRef(side);
  sideRef.current = side;

  const showPanel = mounted && current;
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-description` : undefined;
  const vertical = side === "top" || side === "bottom";
  const layerPositionClasses = contained ? "absolute inset-0" : "fixed inset-0";

  function close(): void {
    setOpen(false);
  }

  function dismiss(): void {
    if (dismissibleRef.current) close();
  }

  function handleKeydown(event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent): void {
    if (event.key === "Escape" && openRef.current) {
      event.preventDefault();
      dismiss();
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

  function pointerCoordinate(event: ReactPointerEvent<HTMLElement>): number {
    return vertical ? event.clientY : event.clientX;
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>): void {
    if (!dismissibleRef.current) return;
    draggingRef.current = true;
    dragStartRef.current = pointerCoordinate(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateDrag(event: ReactPointerEvent<HTMLElement>): void {
    if (!draggingRef.current) return;
    const delta = pointerCoordinate(event) - dragStartRef.current;
    const outward = sideRef.current === "top" || sideRef.current === "left" ? -delta : delta;
    dragOffsetRef.current = Math.max(0, outward);
    setDragOffset(dragOffsetRef.current);
  }

  function endDrag(): void {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const shouldClose = dragOffsetRef.current >= 80;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    if (shouldClose) dismiss();
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
    const panel = panelRef.current;
    const initial = initialFocus
      ? panel?.querySelector<HTMLElement>(initialFocus)
      : panel?.querySelector<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex=\"-1\"])",
        );
    (initial ?? panel)?.focus();
    return () => {
      const previous = returnFocusRef.current;
      returnFocusRef.current = null;
      if (previous?.isConnected) previous.focus();
    };
  }, [showPanel, initialFocus]);

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
  const signedOffset = side === "top" || side === "left" ? -dragOffset : dragOffset;
  const panelStyle = {
    ...portalStyle,
    transform: dragOffset > 0
      ? vertical
        ? `translateY(${signedOffset}px)`
        : `translateX(${signedOffset}px)`
      : undefined,
  } as CSSProperties;
  const backdropClasses = mergeClasses(
    layerPositionClasses,
    "z-40 cursor-default bg-balsa-overlay backdrop-balsa",
  );
  const panelClasses = mergeClasses(
    "inset-auto m-0 z-50 flex max-w-none flex-col border p-0 shadow-balsa-panel outline-none",
    contained ? "absolute" : "fixed",
    vertical ? "h-auto w-full" : "h-full max-h-none",
    sideClasses[side],
    sizeClasses[size][vertical ? "vertical" : "horizontal"],
    roundedClasses[rounded],
    edgeRoundedClasses[side],
    variantClasses[variant],
    className,
  );
  const handleClasses = mergeClasses(
    "absolute z-10 rounded-full bg-balsa-border-strong",
    handlePositionClasses[side],
  );
  const headerClasses = mergeClasses(
    "flex shrink-0 items-start justify-between gap-balsa-lg border-b border-balsa-border p-balsa-xl",
    showHandle && vertical ? "pt-10" : "",
    showHandle && side === "left" ? "pr-10" : "",
    showHandle && side === "right" ? "pl-10" : "",
  );
  const footerContent = footer?.(close);

  const overlay = showPanel ? (
    <>
      <button
        data-balsa="drawer-backdrop"
        data-theme={panelPresentation.themeId}
        data-theme-base={panelPresentation.themeBase}
        data-palette={panelPresentation.paletteId}
        style={portalStyle}
        type="button"
        className={backdropClasses}
        aria-label={closeLabel}
        onClick={dismiss}
      />
      <section
        id={id}
        ref={panelRef}
        data-balsa="drawer-panel"
        data-theme={panelPresentation.themeId}
        data-theme-base={panelPresentation.themeBase}
        data-palette={panelPresentation.paletteId}
        data-side={side}
        data-size={size}
        data-variant={variant}
        data-shadow={shadow}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={panelClasses}
        style={panelStyle}
        onKeyDown={handleKeydown}
      >
        {showHandle ? (
          <div
            className={handleClasses}
            aria-hidden="true"
            onPointerDown={beginDrag}
            onPointerMove={updateDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        ) : null}
        <header className={headerClasses}>
          <div>
            <h3 id={titleId}>{title}</h3>
            {description ? (
              <p id={descriptionId} className="mt-balsa-xs text-sm text-balsa-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground focus-visible:outline-2 focus-visible:outline-balsa-focus-ring"
            aria-label={closeLabel}
            onClick={close}
          >
            <Icon icon={X} size="lg" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-balsa-xl">
          {children}
        </div>
        {footerContent ? (
          <footer className="shrink-0 border-t border-balsa-border p-balsa-xl">
            {footerContent}
          </footer>
        ) : null}
      </section>
    </>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        ref={rootRef}
        data-balsa="drawer"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-side={side}
        data-size={size}
        data-variant={variant}
        data-rounded={rounded}
        className="contents"
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        {contained ? overlay : (portalHost && overlay ? createPortal(overlay, portalHost) : null)}
      </span>
    </BalsaThemeContext.Provider>
  );
}
