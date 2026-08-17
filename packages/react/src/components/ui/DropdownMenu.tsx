import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  getAnchoredLayerPosition,
  type AnchoredAlign,
  type AnchoredSide,
} from "./anchored-layer";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { MenuList, type MenuListHandle } from "./MenuList";
import type { MenuItem, MenuSelection, MenuVariant } from "./menu";
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
import type { ActionColor } from "./types";

export interface DropdownMenuProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "id" | "onSelect"
> {
  id: string;
  label: string;
  items: readonly MenuItem[];
  side?: AnchoredSide;
  align?: AnchoredAlign;
  sideOffset?: number;
  variant?: MenuVariant;
  color?: ActionColor;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  disabled?: boolean;
  theme?: ThemeInput;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (selection: MenuSelection) => void;
  trigger?: ReactNode;
  "data-balsa"?: string;
  "data-palette"?: string;
}

export function DropdownMenu(rawProps: DropdownMenuProps) {
  const { props, theme } = useResolvedThemeProps("dropdown-menu", "overlays", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    items,
    side = "bottom",
    align = "start",
    sideOffset = 8,
    variant,
    color = "primary",
    rounded,
    shadow,
    contained = false,
    disabled = false,
    theme: _themeInput,
    open,
    defaultOpen = false,
    onOpenChange,
    onSelect,
    trigger,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    className,
    style,
    onKeyDown,
    ...domProps
  } = props;
  void _themeInput;
  void _dataBalsa;

  const [current, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const scope = useBalsaPortalScope();
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<MenuListHandle | null>(null);
  const [mounted, setMounted] = useState(false);
  const [resolvedSide, setResolvedSide] = useState<AnchoredSide>(side);
  const [position, setPosition] = useState({ left: 0, top: 0, maxHeight: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const openRef = useRef(current);
  openRef.current = current;

  const showPanel = mounted && current;
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));

  function triggerElement(): HTMLButtonElement | null {
    return rootRef.current?.querySelector<HTMLButtonElement>(":scope > button") ?? null;
  }

  function close(restoreFocus = true): void {
    setOpen(false);
    if (restoreFocus) queueMicrotask(() => triggerElement()?.focus());
  }

  function capturePresentation(): void {
    const root = rootRef.current;
    if (!root?.isConnected) return;
    const currentTheme = themeRef.current;
    const presentation: ThemePresentation | undefined =
      currentTheme.inherited || currentTheme.explicitPresentation
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

  function updatePosition(): void {
    const triggerNode = triggerElement();
    const panelNode = panelRef.current;
    if (!triggerNode || !panelNode || !openRef.current) return;
    const next = getAnchoredLayerPosition(triggerNode, panelNode, {
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
        && currentPosition.maxHeight === next.maxHeight
        ? currentPosition
        : { left, top, maxHeight: next.maxHeight }
    ));
    setResolvedSide((currentSide) => currentSide === next.side ? currentSide : next.side);
  }

  function handleSelection(selection: MenuSelection): void {
    onSelect?.(selection);
    close();
  }

  function handleTriggerKeydown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      queueMicrotask(() => {
        const buttons = panelRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]');
        buttons?.item(buttons.length - 1)?.focus();
      });
    }
    onKeyDown?.(event as KeyboardEvent<HTMLElement>);
  }

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!showPanel) return;
    capturePresentation();
    updatePosition();
    listRef.current?.focusFirst();
  }, [showPanel, side, align, sideOffset, contained]);

  useLayoutEffect(() => {
    if (!mounted) return;

    function handleDocumentPointer(event: PointerEvent): void {
      if (!openRef.current) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close(false);
    }

    document.addEventListener("pointerdown", handleDocumentPointer, true);
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointer, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, contained, side, align, sideOffset]);

  const panelPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const triggerClasses = mergeClasses(
    "border-balsa-border-strong bg-balsa-surface px-balsa-md py-balsa-2xs text-balsa-surface-foreground hover:bg-balsa-muted",
    rawProps.rounded === undefined ? "rounded-balsa-control" : roundedClasses[rounded],
    className,
  );
  const panelStyle = {
    left: `${position.left}px`,
    top: `${position.top}px`,
    maxHeight: `${position.maxHeight}px`,
    ...panelPresentation.style,
  } as CSSProperties;
  const panel = showPanel ? (
    <div
      ref={panelRef}
      data-balsa="dropdown-menu-panel"
      data-theme={panelPresentation.themeId}
      data-theme-base={panelPresentation.themeBase}
      data-palette={dataPalette ?? panelPresentation.paletteId}
      data-side={resolvedSide}
      data-shadow={shadow}
      className={mergeClasses("z-[65]", contained ? "absolute" : "fixed")}
      style={panelStyle}
    >
      <MenuList
        id={id}
        ref={listRef}
        label={label}
        items={items}
        variant={variant}
        color={color}
        rounded={rounded}
        shadow={shadow}
        data-palette={dataPalette ?? panelPresentation.paletteId}
        onSelect={handleSelection}
        onDismiss={() => close()}
      />
    </div>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <span
        {...domProps}
        ref={rootRef}
        data-balsa="dropdown-menu"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-color={color}
        data-rounded={rounded}
        data-state={current ? "open" : "closed"}
        className="relative inline-flex"
        style={{
          ...theme.explicitPresentation?.style,
          ...style,
        } as CSSProperties}
      >
        <Button
          id={`${id}-trigger`}
          variant="outline"
          color="neutral"
          size="md"
          disabled={disabled}
          aria-expanded={current}
          aria-controls={id}
          aria-haspopup="menu"
          className={triggerClasses}
          onClick={() => {
            if (!disabled) setOpen(!current);
          }}
          onKeyDown={handleTriggerKeydown}
        >
          {trigger ?? "Open menu"}
        </Button>
        {contained ? panel : (portalHost && panel ? createPortal(panel, portalHost) : null)}
      </span>
    </BalsaThemeContext.Provider>
  );
}
