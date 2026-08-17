import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  getAnchoredLayerPosition,
  type AnchoredAlign,
  type AnchoredSide,
  type LayerVariant,
} from "./anchored-layer";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
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

export type PopupVariant = LayerVariant;
export type PopupSize = "sm" | "md" | "lg" | "trigger";

export interface PopupProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "id"> {
  id: string;
  label: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  side?: AnchoredSide;
  align?: AnchoredAlign;
  sideOffset?: number;
  alignOffset?: number;
  variant?: PopupVariant;
  size?: PopupSize;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  disabled?: boolean;
  initialFocus?: boolean;
  dismissOnOutside?: boolean;
  triggerAriaLabelledby?: string;
  triggerAriaDescribedby?: string;
  triggerAriaInvalid?: boolean;
  triggerAriaRequired?: boolean;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  children?: ReactNode | ((close: (restoreFocus?: boolean) => void) => ReactNode);
}

const variantClasses: Readonly<Record<PopupVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-surface-foreground backdrop-balsa"],
};
const sizeClasses: Readonly<Record<PopupSize, string>> = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
  trigger: "w-[var(--balsa-popup-trigger-width)]",
};

export function Popup(rawProps: PopupProps) {
  const { props, theme } = useResolvedThemeProps("popup", "overlays", rawProps, {
    variant: "surface",
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    side = "bottom",
    align = "center",
    sideOffset = 8,
    alignOffset = 0,
    variant,
    size,
    rounded,
    shadow,
    contained = false,
    disabled = false,
    initialFocus = true,
    dismissOnOutside = true,
    triggerAriaLabelledby,
    triggerAriaDescribedby,
    triggerAriaInvalid,
    triggerAriaRequired,
    theme: _themeInput,
    open,
    defaultOpen = false,
    onOpenChange,
    trigger,
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [resolvedSide, setResolvedSide] = useState<AnchoredSide>(side);
  const [position, setPosition] = useState({ left: 0, top: 0, maxWidth: 0, maxHeight: 0 });
  const [triggerWidth, setTriggerWidth] = useState(0);
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const openRef = useRef(current);
  openRef.current = current;

  const showPanel = mounted && current;
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));

  function close(restoreFocus = true): void {
    setOpen(false);
    if (restoreFocus) {
      queueMicrotask(() => triggerRef.current?.focus());
    }
  }

  function updatePosition(): void {
    const triggerElement = triggerRef.current;
    const panelElement = panelRef.current;
    if (!triggerElement || !panelElement || !openRef.current) return;
    const next = getAnchoredLayerPosition(triggerElement, panelElement, {
      side,
      align,
      sideOffset,
      alignOffset,
    });
    const rootRect = rootRef.current?.getBoundingClientRect();
    const left = next.left - (contained ? rootRect?.left ?? 0 : 0);
    const top = next.top - (contained ? rootRect?.top ?? 0 : 0);
    setPosition((currentPosition) => (
      currentPosition.left === left
        && currentPosition.top === top
        && currentPosition.maxWidth === next.maxWidth
        && currentPosition.maxHeight === next.maxHeight
        ? currentPosition
        : { left, top, maxWidth: next.maxWidth, maxHeight: next.maxHeight }
    ));
    setResolvedSide((currentSide) => (currentSide === next.side ? currentSide : next.side));
    const width = triggerElement.getBoundingClientRect().width;
    setTriggerWidth((currentWidth) => (currentWidth === width ? currentWidth : width));
  }

  function focusPanel(): void {
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (first ?? panelRef.current)?.focus();
  }

  function capturePresentation(): void {
    const root = rootRef.current;
    if (!root?.isConnected) return;
    const currentTheme = themeRef.current;
    const presentation: ThemePresentation | undefined = currentTheme.inherited || currentTheme.explicitPresentation
      ? currentTheme.presentation
      : undefined;
    try {
      const snapshot = capturePortalPresentation(root, presentation);
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
    updatePosition();
    if (initialFocus) focusPanel();
  }, [showPanel, side, align, sideOffset, alignOffset, contained, initialFocus]);

  useLayoutEffect(() => {
    if (!mounted) return;

    function handleDocumentPointer(event: PointerEvent): void {
      if (!openRef.current || !dismissOnOutside) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close(false);
    }

    function handleKeydown(event: KeyboardEvent): void {
      if (event.key !== "Escape" || !openRef.current) return;
      event.preventDefault();
      close();
    }

    document.addEventListener("pointerdown", handleDocumentPointer, true);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointer, true);
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, dismissOnOutside, contained, side, align, sideOffset, alignOffset]);

  const triggerClasses = mergeClasses(
    "inline-flex min-h-9 cursor-pointer items-center justify-center gap-balsa-xs rounded-lg border border-balsa-border-strong bg-balsa-surface px-balsa-md py-balsa-2xs text-sm font-semibold text-balsa-surface-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring disabled:cursor-not-allowed disabled:bg-balsa-disabled disabled:text-balsa-disabled-foreground",
  );
  const panelClasses = mergeClasses(
    "z-[60] max-w-[calc(100vw-1rem)] overflow-auto border p-balsa-md shadow-balsa-panel outline-none transition-[opacity,transform] duration-150",
    contained ? "absolute" : "fixed",
    sizeClasses[size],
    roundedClasses[rounded],
    variantClasses[variant],
    className,
  );
  const panelPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const panelStyle = {
    left: `${position.left}px`,
    top: `${position.top}px`,
    maxWidth: `${position.maxWidth}px`,
    maxHeight: `${position.maxHeight}px`,
    "--balsa-popup-trigger-width": `${triggerWidth}px`,
    ...panelPresentation.style,
    ...style,
  } as CSSProperties;

  const content = typeof children === "function" ? children(close) : children;
  const panel = showPanel ? (
    <section
      id={id}
      ref={panelRef}
      data-balsa="popup-panel"
      data-theme={panelPresentation.themeId}
      data-theme-base={panelPresentation.themeBase}
      data-palette={panelPresentation.paletteId}
      data-side={resolvedSide}
      data-variant={variant}
      data-rounded={rounded}
      data-shadow={shadow}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className={panelClasses}
      style={panelStyle}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        close();
      }}
    >
      {content}
    </section>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        ref={rootRef}
        data-balsa="popup"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-state={current ? "open" : "closed"}
        className="relative inline-flex"
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
      >
        <button
          id={`${id}-trigger`}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-expanded={current}
          aria-controls={id}
          aria-labelledby={triggerAriaLabelledby}
          aria-describedby={triggerAriaDescribedby}
          aria-invalid={triggerAriaInvalid || undefined}
          aria-required={triggerAriaRequired || undefined}
          aria-haspopup="dialog"
          className={triggerClasses}
          onClick={() => {
            if (disabled) return;
            setOpen(!current);
          }}
        >
          {trigger ?? "Open popup"}
        </button>
        {contained ? panel : (portalHost && panel ? createPortal(panel, portalHost) : null)}
      </span>
    </BalsaThemeContext.Provider>
  );
}
