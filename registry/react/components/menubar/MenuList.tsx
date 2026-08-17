import { Check, ChevronRight, Circle } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type KeyboardEvent,
  type RefAttributes,
} from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Icon } from "./Icon";
import {
  isInteractiveMenuItem,
  type MenuItem,
  type MenuSelection,
  type MenuVariant,
} from "./menu";
import type { Shadow, ThemeInput } from "./theme";
import { BalsaThemeContext, useResolvedThemeProps } from "./theme-context";
import type { ActionColor } from "./types";

export interface MenuListHandle {
  focusFirst: () => void;
}

export interface MenuListProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "id" | "onSelect"
> {
  id: string;
  label: string;
  items: readonly MenuItem[];
  variant?: MenuVariant;
  color?: ActionColor;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  submenu?: boolean;
  "data-balsa"?: string;
  "data-palette"?: string;
  onSelect?: (selection: MenuSelection) => void;
  onDismiss?: () => void;
  onCloseSubmenu?: () => void;
}

const variantClasses: Readonly<Record<MenuVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 text-balsa-surface-foreground backdrop-balsa"],
};

const colorClasses: Readonly<Record<ActionColor, Record<MenuVariant, string[]>>> = {
  neutral: { surface: [], outline: [], soft: [], glass: [] },
  primary: {
    surface: ["border-balsa-primary/30"],
    outline: ["border-balsa-primary"],
    soft: ["border-balsa-primary/20", "bg-balsa-primary/10"],
    glass: ["border-balsa-primary/30"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"],
    outline: ["border-balsa-secondary"],
    soft: ["border-balsa-secondary/20", "bg-balsa-secondary/10"],
    glass: ["border-balsa-secondary/30"],
  },
  accent: {
    surface: ["border-balsa-accent/30"],
    outline: ["border-balsa-accent"],
    soft: ["border-balsa-accent/20", "bg-balsa-accent/10"],
    glass: ["border-balsa-accent/30"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"],
    outline: ["border-balsa-destructive"],
    soft: ["border-balsa-destructive/20", "bg-balsa-destructive/10"],
    glass: ["border-balsa-destructive/30"],
  },
};

function firstInteractiveIndex(items: readonly MenuItem[]): number {
  const index = items.findIndex(isInteractiveMenuItem);
  return index < 0 ? 0 : index;
}

function lastInteractiveIndex(items: readonly MenuItem[]): number {
  const reversed = [...items].reverse().findIndex(isInteractiveMenuItem);
  return reversed < 0 ? 0 : items.length - reversed - 1;
}

function itemRole(item: MenuItem): "menuitem" | "menuitemcheckbox" | "menuitemradio" {
  if (item.type === "checkbox") return "menuitemcheckbox";
  if (item.type === "radio") return "menuitemradio";
  return "menuitem";
}

export const MenuList: ForwardRefExoticComponent<
  MenuListProps & RefAttributes<MenuListHandle>
> = forwardRef<MenuListHandle, MenuListProps>(function MenuListInner(
  rawProps,
  forwardedRef,
) {
  const { props, theme } = useResolvedThemeProps("dropdown-menu", "overlays", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    items,
    variant,
    color,
    rounded,
    shadow,
    theme: _themeInput,
    submenu = false,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    className,
    style,
    onSelect,
    onDismiss,
    onCloseSubmenu,
    ...domProps
  } = props;
  void _themeInput;
  void _dataBalsa;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(() => firstInteractiveIndex(items));
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

  function focusIndex(index: number): void {
    queueMicrotask(() => {
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`)
        ?.focus();
    });
  }

  function focusFirst(): void {
    const index = firstInteractiveIndex(items);
    setActiveIndex(index);
    focusIndex(index);
  }

  useImperativeHandle(forwardedRef, () => ({ focusFirst }));

  useEffect(() => () => {
    clearTimeout(typeaheadTimerRef.current);
  }, []);

  function moveActive(direction: 1 | -1): void {
    if (!items.some(isInteractiveMenuItem)) return;
    let next = activeIndex;
    do {
      next = (next + direction + items.length) % items.length;
    } while (!isInteractiveMenuItem(items[next]!));
    setActiveIndex(next);
    focusIndex(next);
  }

  function selectItem(item: MenuItem, index: number): void {
    if (!isInteractiveMenuItem(item)) return;
    setActiveIndex(index);
    if (item.type === "submenu" || item.children?.length) {
      setOpenSubmenuIndex(index);
      return;
    }
    onSelect?.({
      id: item.id,
      type: item.type === "checkbox"
        ? "checkbox"
        : item.type === "radio"
          ? "radio"
          : "action",
      value: item.value,
      checked: item.type === "checkbox" ? !item.checked : item.checked,
    });
  }

  function handleKeydown(event: KeyboardEvent<HTMLButtonElement>, item: MenuItem, index: number): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const next = firstInteractiveIndex(items);
      setActiveIndex(next);
      focusIndex(next);
    } else if (event.key === "End") {
      event.preventDefault();
      const next = lastInteractiveIndex(items);
      setActiveIndex(next);
      focusIndex(next);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectItem(item, index);
    } else if (event.key === "ArrowRight" && (item.children?.length || item.type === "submenu")) {
      event.preventDefault();
      setOpenSubmenuIndex(index);
    } else if (event.key === "ArrowLeft" && submenu) {
      event.preventDefault();
      onCloseSubmenu?.();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onDismiss?.();
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      typeaheadRef.current += event.key.toLocaleLowerCase();
      clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadRef.current = "";
      }, 500);
      const match = items.findIndex((candidate) =>
        isInteractiveMenuItem(candidate)
        && candidate.label?.toLocaleLowerCase().startsWith(typeaheadRef.current));
      if (match >= 0) {
        setActiveIndex(match);
        focusIndex(match);
      }
    }
  }

  const rootClasses = mergeClasses(
    "min-w-52 max-w-[min(22rem,calc(100vw-1rem))] overflow-y-auto border p-balsa-3xs shadow-balsa-panel outline-none",
    roundedClasses[rounded],
    submenu ? "absolute left-full top-0 z-[70] ml-balsa-3xs" : "",
    variantClasses[variant],
    color ? colorClasses[color][variant] : [],
    className,
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        id={id}
        ref={rootRef}
        data-balsa="menu-list"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-palette={dataPalette}
        data-variant={variant}
        data-color={color}
        data-rounded={rounded}
        data-shadow={shadow}
        role="menu"
        aria-label={label}
        className={rootClasses}
        style={{
          ...theme.explicitPresentation?.style,
          ...style,
        } as CSSProperties}
      >
        {items.map((item, index) => {
          if (item.type === "separator") {
            return (
              <div
                key={item.id}
                className="my-balsa-3xs h-px bg-balsa-border"
                role="separator"
              />
            );
          }
          if (item.type === "label") {
            return (
              <div
                key={item.id}
                className="px-balsa-md py-balsa-xs text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground"
                role="presentation"
              >
                {item.label}
              </div>
            );
          }

          const active = index === activeIndex;
          const hasSubmenu = Boolean(item.children?.length);
          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                data-menu-index={index}
                role={itemRole(item)}
                tabIndex={active ? 0 : -1}
                disabled={item.disabled}
                aria-checked={item.type === "checkbox" || item.type === "radio"
                  ? item.checked
                  : undefined}
                aria-haspopup={hasSubmenu ? "menu" : undefined}
                aria-expanded={hasSubmenu ? openSubmenuIndex === index : undefined}
                className={mergeClasses(
                  "relative flex min-h-9 w-full items-center gap-balsa-xs rounded-md px-balsa-md py-balsa-xs text-left text-sm outline-none transition-colors",
                  active
                    ? item.destructive
                      ? "bg-balsa-destructive text-balsa-destructive-foreground"
                      : "bg-balsa-selected text-balsa-selected-foreground"
                    : item.destructive
                      ? "text-balsa-destructive"
                      : "text-inherit",
                  item.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                )}
                onFocus={() => setActiveIndex(index)}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => selectItem(item, index)}
                onKeyDown={(event) => handleKeydown(event, item, index)}
              >
                {item.icon ? <Icon icon={item.icon} size="md" /> : null}
                <span
                  className="min-w-0 flex-1 truncate"
                  style={item.labelFontFamily ? { fontFamily: item.labelFontFamily } : undefined}
                >
                  {item.label}
                </span>
                {item.type === "checkbox" && item.checked
                  ? <Icon icon={Check} size="md" />
                  : item.type === "radio" && item.checked
                    ? <Icon icon={Circle} size="sm" className="fill-current" />
                    : null}
                {item.shortcut
                  ? <span className="ml-balsa-lg text-xs text-current/70">{item.shortcut}</span>
                  : null}
                {hasSubmenu ? <Icon icon={ChevronRight} size="md" /> : null}
              </button>
              {hasSubmenu && openSubmenuIndex === index ? (
                <MenuList
                  id={`${id}-${item.id}`}
                  label={item.label ?? label}
                  items={item.children ?? []}
                  variant={variant}
                  color={color}
                  rounded={rounded}
                  shadow={shadow}
                  data-palette={dataPalette}
                  submenu
                  onSelect={onSelect}
                  onDismiss={onDismiss}
                  onCloseSubmenu={() => setOpenSubmenuIndex(null)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </BalsaThemeContext.Provider>
  );
});
