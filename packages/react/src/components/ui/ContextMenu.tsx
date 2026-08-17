import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import { mergeClasses } from "./classes";
import type { Rounded } from "./form";
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

export interface ContextMenuProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onSelect" | "title"
> {
  id: string;
  label: string;
  items: readonly MenuItem[];
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
  children?: ReactNode;
  "data-balsa"?: string;
  "data-palette"?: string;
}

interface Position {
  left: number;
  top: number;
}

const viewportPadding = 8;

export function ContextMenu(rawProps: ContextMenuProps) {
  const { props, theme } = useResolvedThemeProps("context-menu", "overlays", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    items,
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
    children,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    className,
    style,
    tabIndex,
    onContextMenu,
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<MenuListHandle | null>(null);
  const requestedPositionRef = useRef<Position>({ left: 0, top: 0 });
  const openRef = useRef(current);
  openRef.current = current;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ left: 0, top: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);

  const showLayer = mounted && current;
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));

  function capturePresentation(): void {
    const root = rootRef.current;
    if (!root?.isConnected) return;
    const currentTheme = themeRef.current;
    const presentation: ThemePresentation | undefined = currentTheme.inherited
      || currentTheme.explicitPresentation
      ? currentTheme.presentation
      : undefined;
    setPortalSnapshot(capturePortalPresentation(root, presentation));
  }

  function updatePosition(): void {
    const layer = layerRef.current;
    if (!layer || !openRef.current) return;
    const layerRect = layer.getBoundingClientRect();
    const requested = requestedPositionRef.current;
    const rootRect = rootRef.current?.getBoundingClientRect();

    if (contained && (!rootRect || rootRect.width <= 0 || rootRect.height <= 0)) return;

    const bounds = contained && rootRect
      ? {
        left: rootRect.left + viewportPadding,
        top: rootRect.top + viewportPadding,
        right: rootRect.right - viewportPadding,
        bottom: rootRect.bottom - viewportPadding,
      }
      : {
        left: viewportPadding,
        top: viewportPadding,
        right: window.innerWidth - viewportPadding,
        bottom: window.innerHeight - viewportPadding,
      };
    const viewportLeft = Math.min(
      Math.max(requested.left, bounds.left),
      Math.max(bounds.left, bounds.right - layerRect.width),
    );
    const viewportTop = Math.min(
      Math.max(requested.top, bounds.top),
      Math.max(bounds.top, bounds.bottom - layerRect.height),
    );
    const next = {
      left: viewportLeft - (contained ? rootRect?.left ?? 0 : 0),
      top: viewportTop - (contained ? rootRect?.top ?? 0 : 0),
    };
    setPosition((previous) => (
      previous.left === next.left && previous.top === next.top ? previous : next
    ));
  }

  function openAt(left: number, top: number): void {
    if (disabled) return;
    const next = { left, top };
    requestedPositionRef.current = next;
    setPosition(next);
    capturePresentation();
    setOpen(true);
  }

  function close(restoreFocus = true): void {
    setOpen(false);
    if (restoreFocus) queueMicrotask(() => rootRef.current?.focus());
  }

  function handleContextMenu(event: ReactMouseEvent<HTMLDivElement>): void {
    onContextMenu?.(event);
    if (disabled) return;
    event.preventDefault();
    openAt(event.clientX, event.clientY);
  }

  function handleKeydown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);
    if (disabled || (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))) return;
    event.preventDefault();
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) openAt(rect.left + 16, rect.top + 16);
  }

  function handleSelection(selection: MenuSelection): void {
    onSelect?.(selection);
    close();
  }

  useEffect(() => {
    setMounted(true);

    function handleDocumentPointer(event: PointerEvent): void {
      if (!openRef.current) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || layerRef.current?.contains(target)) return;
      close(false);
    }

    document.addEventListener("pointerdown", handleDocumentPointer, true);
    window.addEventListener("resize", updatePosition, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointer, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  useLayoutEffect(() => {
    if (!showLayer) return;
    updatePosition();
    listRef.current?.focusFirst();
  }, [showLayer, contained]);

  const layerPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const layer = showLayer ? (
    <div
      ref={layerRef}
      data-balsa="context-menu-layer"
      data-theme={layerPresentation.themeId}
      data-theme-base={layerPresentation.themeBase}
      data-palette={dataPalette ?? layerPresentation.paletteId}
      data-shadow={shadow}
      className={mergeClasses("z-[65]", contained ? "absolute" : "fixed")}
      style={{
        ...layerPresentation.style,
        left: `${position.left}px`,
        top: `${position.top}px`,
      } as CSSProperties}
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
        theme={theme.input}
        data-palette={dataPalette ?? layerPresentation.paletteId}
        onSelect={handleSelection}
        onDismiss={close}
      />
    </div>
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        ref={rootRef}
        data-balsa="context-menu"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-state={current ? "open" : "closed"}
        aria-haspopup="menu"
        tabIndex={tabIndex ?? 0}
        className={mergeClasses("relative", className)}
        style={{
          ...theme.explicitPresentation?.style,
          ...style,
        } as CSSProperties}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeydown}
      >
        {children}
        {contained ? layer : (portalHost && layer ? createPortal(layer, portalHost) : null)}
      </div>
    </BalsaThemeContext.Provider>
  );
}
