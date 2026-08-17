import { LoaderCircle, Search } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBalsaPortalScope } from "./BalsaPortalScope";
import type { LayerVariant } from "./anchored-layer";
import { mergeClasses } from "./classes";
import type { CommandGroup, CommandItem } from "./command";
import { getAnchoredPopupPosition, roundedClasses, type Rounded } from "./form";
import { Icon } from "./Icon";
import {
  capturePortalPresentation,
  type PortalPresentationSnapshot,
} from "./portal-core";
import type { Shadow } from "./theme";
import { useBalsaThemeContext, useControllableState } from "./theme-context";

export interface CommandListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  id: string;
  label: string;
  groups: readonly CommandGroup[];
  "data-balsa"?: string;
  "data-palette"?: string;
  placeholder?: string;
  loading?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  dropdown?: boolean;
  contained?: boolean;
  variant?: LayerVariant;
  rounded?: Rounded;
  shadow?: Shadow;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: CommandItem) => void;
  onEscape?: () => void;
  emptyContent?: ReactNode;
  loadingContent?: ReactNode;
}

const variantClasses: Readonly<Record<LayerVariant, string[]>> = {
  surface: ["border-balsa-border-strong bg-balsa-surface-elevated text-balsa-surface-elevated-foreground"],
  outline: ["border-balsa-border-strong bg-balsa-background text-balsa-foreground"],
  soft: ["border-balsa-border bg-balsa-muted text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-surface-foreground backdrop-balsa"],
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

export function CommandList({
  id,
  label,
  groups,
  "data-balsa": _dataBalsa,
  "data-palette": dataPalette,
  placeholder = "Search commands",
  loading = false,
  open,
  defaultOpen,
  dropdown = false,
  contained = false,
  variant = "surface",
  rounded = "xl",
  shadow = "auto",
  value,
  defaultValue = "",
  onValueChange,
  onOpenChange,
  onSelect,
  onEscape,
  emptyContent,
  loadingContent,
  className,
  style,
  ...domProps
}: CommandListProps) {
  void _dataBalsa;
  const [query, setQuery] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [currentOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen ?? !dropdown,
    onChange: onOpenChange,
  });
  const [mounted, setMounted] = useState(false);
  const [requestedActiveIndex, setRequestedActiveIndex] = useState(0);
  const [listPosition, setListPosition] = useState({ left: 0, top: 0, width: 0 });
  const [portalSnapshot, setPortalSnapshot] = useState<PortalPresentationSnapshot | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const queryRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const theme = useBalsaThemeContext();
  const scope = useBalsaPortalScope();

  const normalizedQuery = normalize(query.trim());
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (
        !normalizedQuery
        || normalize([item.label, ...(item.keywords ?? [])].join(" ")).includes(normalizedQuery)
      )),
    }))
    .filter((group) => group.items.length > 0);
  const items = filteredGroups.flatMap((group) => group.items);
  const firstEnabledIndex = items.findIndex((item) => !item.disabled);
  const activeIndex = requestedActiveIndex >= 0
    && requestedActiveIndex < items.length
    && !items[requestedActiveIndex]?.disabled
    ? requestedActiveIndex
    : firstEnabledIndex;
  const activeItem = items[activeIndex];
  const activeId = activeItem ? `${id}-item-${activeItem.id}` : undefined;
  const floating = dropdown && !contained;
  const visibleOpen = currentOpen && (!floating || mounted);
  const portalHost = floating && mounted ? (scope?.host ?? document.body) : null;
  const openRef = useRef(visibleOpen);
  openRef.current = visibleOpen;

  function positionList(): void {
    const queryElement = queryRef.current;
    const listElement = listRef.current;
    if (!openRef.current || !floating || !queryElement || !listElement) return;
    const next = getAnchoredPopupPosition(queryElement, listElement, 320);
    setListPosition((current) => (
      current.left === next.left && current.top === next.top && current.width === next.width
        ? current
        : next
    ));
  }

  function capturePresentation(): void {
    const root = rootRef.current;
    if (!root?.isConnected) return;
    try {
      const next = capturePortalPresentation(root, theme?.presentation);
      setPortalSnapshot((current) => (
        current
        && current.themeId === next.themeId
        && current.themeBase === next.themeBase
        && current.paletteId === next.paletteId
        && current.adapt === next.adapt
          ? current
          : next
      ));
    } catch {
      setPortalSnapshot((current) => current);
    }
  }

  function scrollActiveIntoView(nextIndex: number): void {
    const item = items[nextIndex];
    if (!item) return;
    queueMicrotask(() => {
      document.getElementById(`${id}-item-${item.id}`)?.scrollIntoView?.({ block: "nearest" });
    });
  }

  function move(direction: 1 | -1): void {
    if (firstEnabledIndex < 0) return;
    let next = activeIndex < 0 ? firstEnabledIndex : activeIndex;
    do {
      next = (next + direction + items.length) % items.length;
    } while (items[next]?.disabled);
    setRequestedActiveIndex(next);
    scrollActiveIntoView(next);
  }

  function select(item: CommandItem | undefined): void {
    if (!item || item.disabled) return;
    onSelect?.(item);
    setOpen(false);
  }

  function openList(): void {
    setOpen(true);
  }

  function closeList(): void {
    setOpen(false);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    setQuery(event.currentTarget.value);
    setRequestedActiveIndex(0);
    openList();
  }

  function handleKeydown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!visibleOpen) {
        openList();
        return;
      }
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      if (firstEnabledIndex >= 0) {
        setRequestedActiveIndex(firstEnabledIndex);
        scrollActiveIntoView(firstEnabledIndex);
      }
    } else if (event.key === "End") {
      event.preventDefault();
      let lastEnabledIndex = items.length - 1;
      while (lastEnabledIndex >= 0 && items[lastEnabledIndex]?.disabled) lastEnabledIndex -= 1;
      if (lastEnabledIndex >= 0) {
        setRequestedActiveIndex(lastEnabledIndex);
        scrollActiveIntoView(lastEnabledIndex);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(activeItem);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onEscape?.();
      closeList();
    } else if (event.key === "Tab") {
      closeList();
    }
  }

  function handleListboxKeydown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape?.();
      closeList();
    } else if (event.key === "Tab") {
      closeList();
    }
  }

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!visibleOpen || !floating) return;
    capturePresentation();
    positionList();
  }, [visibleOpen, floating, items.length, query]);

  useLayoutEffect(() => {
    if (!mounted || !dropdown) return;

    function handleDocumentPointerDown(event: PointerEvent): void {
      if (!openRef.current) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      closeList();
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    window.addEventListener("resize", positionList, { passive: true });
    window.addEventListener("scroll", positionList, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      window.removeEventListener("resize", positionList);
      window.removeEventListener("scroll", positionList, true);
    };
  }, [mounted, dropdown, floating]);

  const presentation = portalSnapshot ?? {
    themeId: theme?.presentation.id,
    themeBase: theme?.presentation.base,
    paletteId: dataPalette,
    style: theme?.presentation.style ?? {},
  };
  const queryClasses = mergeClasses(
    "flex items-center gap-balsa-md px-balsa-lg",
    dropdown
      ? ["border shadow-balsa-surface", roundedClasses[rounded], variantClasses[variant]]
      : "border-b border-balsa-border",
  );
  const listboxClasses = mergeClasses(
    "max-h-80 overflow-y-auto p-balsa-xs",
    dropdown
      ? [
          floating ? "fixed z-[70] m-0" : "absolute left-0 right-0 z-30 mt-balsa-xs",
          "border shadow-balsa-panel",
          roundedClasses[rounded],
          variantClasses[variant],
        ]
      : "",
  );
  const listboxStyle = floating
    ? {
        left: `${listPosition.left}px`,
        top: `${listPosition.top}px`,
        width: `${listPosition.width}px`,
        ...presentation.style,
      } as CSSProperties
    : undefined;

  const listbox = visibleOpen ? (
    <div
      id={`${id}-listbox`}
      ref={listRef}
      data-balsa="command-listbox"
      data-theme={floating ? presentation.themeId : undefined}
      data-theme-base={floating ? presentation.themeBase : undefined}
      data-palette={floating ? dataPalette ?? presentation.paletteId : dataPalette}
      data-shadow={shadow}
      role="listbox"
      aria-label={label}
      className={listboxClasses}
      style={listboxStyle}
      onKeyDown={handleListboxKeydown}
    >
      {loading ? (
        <div className="px-balsa-md py-balsa-3xl text-center text-sm text-balsa-muted-foreground">
          {loadingContent ?? "Loading commands…"}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="px-balsa-md py-balsa-3xl text-center text-sm text-balsa-muted-foreground">
          {emptyContent ?? "No commands found."}
        </div>
      ) : filteredGroups.map((group) => (
        <section
          key={group.id}
          role="group"
          aria-labelledby={`${id}-group-${group.id}`}
          className="not-first:mt-2"
        >
          <div
            id={`${id}-group-${group.id}`}
            className="px-balsa-md py-balsa-xs text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground"
          >
            {group.label}
          </div>
          {group.items.map((item) => {
            const index = items.findIndex((candidate) => candidate.id === item.id);
            return (
              <button
                key={item.id}
                id={`${id}-item-${item.id}`}
                type="button"
                role="option"
                aria-selected={item.id === activeItem?.id}
                disabled={item.disabled}
                className={mergeClasses(
                  "flex min-h-9 w-full items-center gap-balsa-sm rounded-md px-balsa-md py-balsa-2xs text-left text-sm outline-none transition-colors",
                  index === activeIndex
                    ? "bg-balsa-selected text-balsa-selected-foreground"
                    : "text-inherit",
                  item.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                )}
                onMouseEnter={() => setRequestedActiveIndex(index)}
                onFocus={() => setRequestedActiveIndex(index)}
                onClick={() => select(item)}
              >
                {item.icon ? <Icon icon={item.icon} size="md" /> : null}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.shortcut ? <span className="text-xs text-current/70">{item.shortcut}</span> : null}
              </button>
            );
          })}
        </section>
      ))}
    </div>
  ) : null;

  return (
    <div
      {...domProps}
      ref={rootRef}
      data-balsa="command-list"
      data-palette={dataPalette}
      data-dropdown={dropdown || undefined}
      className={mergeClasses(dropdown ? "relative" : "overflow-hidden", className)}
      style={style}
    >
      <div ref={queryRef} data-shadow={shadow} className={queryClasses}>
        <Icon icon={Search} size="md" className="text-balsa-muted-foreground" />
        <input
          value={query}
          type="search"
          role="combobox"
          aria-label={label}
          aria-controls={`${id}-listbox`}
          aria-expanded={visibleOpen}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          placeholder={placeholder}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-balsa-input-foreground outline-none placeholder:text-balsa-muted-foreground"
          onClick={openList}
          onFocus={openList}
          onChange={handleInput}
          onKeyDown={handleKeydown}
        />
        {loading ? <Icon icon={LoaderCircle} size="md" className="animate-spin text-balsa-info" /> : null}
      </div>
      {portalHost && listbox ? createPortal(listbox, portalHost) : listbox}
    </div>
  );
}
