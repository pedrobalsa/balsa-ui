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

export type TooltipVariant = LayerVariant;

export interface TooltipProps extends Omit<HTMLAttributes<HTMLElement>, "id"> {
  id: string;
  label: string;
  "data-balsa"?: string;
  "data-palette"?: string;
  side?: AnchoredSide;
  align?: AnchoredAlign;
  sideOffset?: number;
  openDelay?: number;
  closeDelay?: number;
  variant?: TooltipVariant;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  disabled?: boolean;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Readonly<Record<TooltipVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-surface-foreground backdrop-balsa"],
};

export function Tooltip(rawProps: TooltipProps) {
  const { props, theme } = useResolvedThemeProps("tooltip", "overlays", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    side = "top",
    align = "center",
    sideOffset = 8,
    openDelay = 300,
    closeDelay = 180,
    variant,
    rounded,
    shadow,
    contained = false,
    disabled = false,
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
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [mounted, setMounted] = useState(false);
  const [resolvedSide, setResolvedSide] = useState<AnchoredSide>(side);
  const [position, setPosition] = useState({ left: 0, top: 0, maxWidth: 0, maxHeight: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const openRef = useRef(current);
  openRef.current = current;

  const showPanel = mounted && current;
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));

  function clearTimers(): void {
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
    openTimerRef.current = undefined;
    closeTimerRef.current = undefined;
  }

  function scheduleOpen(): void {
    if (disabled) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = undefined;
    openTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, Math.max(0, openDelay));
  }

  function scheduleClose(): void {
    clearTimeout(openTimerRef.current);
    openTimerRef.current = undefined;
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, Math.max(0, closeDelay));
  }

  function updatePosition(): void {
    const triggerElement = triggerRef.current;
    const panelElement = panelRef.current;
    if (!triggerElement || !panelElement || !openRef.current) return;
    const next = getAnchoredLayerPosition(triggerElement, panelElement, {
      side,
      align,
      sideOffset,
      alignOffset: 0,
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
  }, [showPanel, side, align, sideOffset, contained]);

  useLayoutEffect(() => {
    if (!mounted) return;
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      clearTimers();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, contained, side, align, sideOffset]);

  const panelClasses = mergeClasses(
    "pointer-events-none z-[60] max-w-[calc(100vw-1rem)] overflow-auto border px-balsa-md py-balsa-xs text-sm shadow-balsa-panel outline-none",
    contained ? "absolute" : "fixed",
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
    ...panelPresentation.style,
    ...style,
  } as CSSProperties;

  const panel = showPanel ? (
    <span
      id={id}
      ref={panelRef}
      data-balsa="tooltip-panel"
      data-theme={panelPresentation.themeId}
      data-theme-base={panelPresentation.themeBase}
      data-palette={panelPresentation.paletteId}
      data-side={resolvedSide}
      data-variant={variant}
      data-shadow={shadow}
      role="tooltip"
      aria-label={label}
      className={panelClasses}
      style={panelStyle}
    >
      {children}
    </span>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        ref={rootRef}
        data-balsa="tooltip"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-state={current ? "open" : "closed"}
        className="relative inline-flex"
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !openRef.current) return;
          clearTimers();
          setOpen(false);
        }}
      >
        <span
          id={`${id}-trigger`}
          ref={triggerRef}
          tabIndex={0}
          aria-describedby={current ? id : undefined}
          className="inline-flex cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring"
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          onFocus={scheduleOpen}
          onBlur={scheduleClose}
        >
          {trigger ?? "Tooltip"}
        </span>
        {contained ? panel : (portalHost && panel ? createPortal(panel, portalHost) : null)}
      </span>
    </BalsaThemeContext.Provider>
  );
}
