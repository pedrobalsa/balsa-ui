import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { getAnchoredLayerPosition } from "./anchored-layer";
import { useBalsaPortalScope } from "./BalsaPortalScope";
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

export interface MenubarMenu {
  id: string;
  label: string;
  items: readonly MenuItem[];
  disabled?: boolean;
}

export type MenubarSelection = MenuSelection & { menuId: string };

export interface MenubarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onSelect" | "title" | "defaultValue"
> {
  id: string;
  label: string;
  menus: readonly MenubarMenu[];
  variant?: MenuVariant;
  rounded?: Rounded;
  shadow?: Shadow;
  contained?: boolean;
  theme?: ThemeInput;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  onSelect?: (selection: MenubarSelection) => void;
  "data-balsa"?: string;
  "data-palette"?: string;
}

function firstEnabledIndex(menus: readonly MenubarMenu[]): number {
  const index = menus.findIndex((menu) => !menu.disabled);
  return index < 0 ? 0 : index;
}

function lastEnabledIndex(menus: readonly MenubarMenu[]): number {
  const reversed = [...menus].reverse().findIndex((menu) => !menu.disabled);
  return reversed < 0 ? 0 : menus.length - reversed - 1;
}

export function Menubar(rawProps: MenubarProps) {
  const { props, theme } = useResolvedThemeProps("menubar", "navigation", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    menus,
    variant,
    rounded,
    shadow,
    contained = false,
    theme: _themeInput,
    value,
    defaultValue = null,
    onValueChange,
    onSelect,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;
  void _dataBalsa;

  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const scope = useBalsaPortalScope();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<MenuListHandle | null>(null);
  const [mounted, setMounted] = useState(false);
  const [focusIndex, setFocusIndex] = useState(() => firstEnabledIndex(menus));
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const menusRef = useRef(menus);
  menusRef.current = menus;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const activeMenu = menus.find((menu) => menu.id === current);
  const showPanel = mounted && Boolean(current && activeMenu);
  const portalHost = contained ? null : (scope?.host ?? (mounted ? document.body : null));

  function openMenu(index: number): void {
    const menu = menus[index];
    if (!menu || menu.disabled) return;
    setFocusIndex(index);
    setValue(menu.id);
  }

  function close(restoreFocus = true): void {
    const index = focusIndex;
    setValue(null);
    if (restoreFocus) queueMicrotask(() => triggerRefs.current[index]?.focus());
  }

  function moveTrigger(direction: 1 | -1, transferOpen = Boolean(current)): void {
    if (!menus.some((menu) => !menu.disabled)) return;
    let next = focusIndex;
    do {
      next = (next + direction + menus.length) % menus.length;
    } while (menus[next]?.disabled);
    setFocusIndex(next);
    triggerRefs.current[next]?.focus();
    if (transferOpen) openMenu(next);
  }

  function handleTriggerKeydown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTrigger(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTrigger(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const next = firstEnabledIndex(menus);
      setFocusIndex(next);
      triggerRefs.current[next]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      const next = lastEnabledIndex(menus);
      setFocusIndex(next);
      triggerRefs.current[next]?.focus();
    } else if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu(index);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function handleSelection(selection: MenuSelection): void {
    if (!activeMenu) return;
    onSelect?.({ ...selection, menuId: activeMenu.id });
    close();
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
    const openId = currentRef.current;
    const index = menusRef.current.findIndex((menu) => menu.id === openId);
    const anchor = triggerRefs.current[index];
    const panel = panelRef.current;
    if (!anchor || !panel || !openId) return;
    const next = getAnchoredLayerPosition(anchor, panel, {
      side: "bottom",
      align: "start",
      sideOffset: 6,
      alignOffset: 0,
    });
    const rootRect = rootRef.current?.getBoundingClientRect();
    const left = next.left - (contained ? rootRect?.left ?? 0 : 0);
    const top = next.top - (contained ? rootRect?.top ?? 0 : 0);
    setPosition((currentPosition) => (
      currentPosition.left === left && currentPosition.top === top
        ? currentPosition
        : { left, top }
    ));
  }

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!showPanel) return;
    capturePresentation();
    updatePosition();
    listRef.current?.focusFirst();
  }, [showPanel, current, contained]);

  useLayoutEffect(() => {
    if (!mounted) return;

    function handleDocumentPointer(event: PointerEvent): void {
      if (!currentRef.current) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setValue(null);
    }

    document.addEventListener("pointerdown", handleDocumentPointer, true);
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointer, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, contained]);

  const rootClasses = mergeClasses(
    "relative flex max-w-full items-center gap-balsa-3xs border border-balsa-border-strong bg-balsa-surface p-balsa-3xs text-balsa-surface-foreground",
    roundedClasses[rounded],
    contained ? "overflow-visible" : "overflow-x-auto",
    className,
  );
  const triggerClasses =
    "shrink-0 cursor-pointer rounded-md px-balsa-md py-balsa-xs text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-balsa-focus-ring disabled:cursor-not-allowed disabled:opacity-50";
  const panelPresentation = portalSnapshot ?? {
    themeId: theme.presentation.id,
    themeBase: theme.presentation.base,
    paletteId: dataPalette,
    style: Object.fromEntries(
      Object.entries(theme.presentation.style).filter(([property]) => property.startsWith("--balsa-")),
    ) as PortalPresentationSnapshot["style"],
  };
  const panel = showPanel && activeMenu ? (
    <div
      ref={panelRef}
      data-balsa="menubar-panel"
      data-theme={panelPresentation.themeId}
      data-theme-base={panelPresentation.themeBase}
      data-palette={dataPalette ?? panelPresentation.paletteId}
      data-shadow={shadow}
      className={mergeClasses("z-[65]", contained ? "absolute" : "fixed")}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        ...panelPresentation.style,
      } as CSSProperties}
    >
      <MenuList
        id={`${id}-${activeMenu.id}`}
        ref={listRef}
        label={activeMenu.label}
        items={activeMenu.items}
        variant={variant}
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
      <div
        {...domProps}
        id={id}
        ref={rootRef}
        data-balsa="menubar"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-shadow={shadow}
        data-state={current ? "open" : "closed"}
        role="menubar"
        aria-label={label}
        className={rootClasses}
        style={{
          ...theme.explicitPresentation?.style,
          ...style,
        } as CSSProperties}
      >
        {menus.map((menu, index) => (
          <button
            key={menu.id}
            id={`${id}-${menu.id}-trigger`}
            ref={(element) => {
              triggerRefs.current[index] = element;
            }}
            type="button"
            role="menuitem"
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={menu.disabled}
            aria-haspopup="menu"
            aria-expanded={current === menu.id}
            aria-controls={current === menu.id ? `${id}-${menu.id}` : undefined}
            className={triggerClasses}
            onFocus={() => setFocusIndex(index)}
            onMouseEnter={() => {
              if (current) openMenu(index);
            }}
            onClick={() => current === menu.id ? close() : openMenu(index)}
            onKeyDown={(event) => handleTriggerKeydown(event, index)}
          >
            {menu.label}
          </button>
        ))}
        {contained ? panel : (portalHost && panel ? createPortal(panel, portalHost) : null)}
      </div>
    </BalsaThemeContext.Provider>
  );
}
