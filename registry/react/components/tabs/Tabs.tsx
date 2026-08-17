import {
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
} from "react";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";
import { mergeClasses } from "./classes";
import { Icon, type IconComponent, type IconSize } from "./Icon";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconComponent;
  disabled?: boolean;
}

export type TabsVariant = "surface" | "outline" | "soft" | "glass";
export type TabsType = "segmented" | "underline" | "pills" | "tiles";
type TabsSize = "sm" | "md" | "lg";
type Rounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
type TabState = "active" | "inactive";

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  id: string;
  items: readonly TabItem[];
  label?: string;
  variant?: TabsVariant;
  type?: TabsType;
  panelSurface?: boolean;
  size?: TabsSize;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  panels?: Readonly<Record<string, ReactNode>>;
  children?: ReactNode | ((activeId: string) => ReactNode);
}

const sizeClasses: Readonly<Record<TabsSize, { tab: string; tile: string; panel: string }>> = {
  sm: { tab: "h-8 gap-balsa-2xs px-balsa-md text-xs", tile: "min-h-16 gap-balsa-2xs px-balsa-md py-balsa-sm text-xs", panel: "p-balsa-lg text-sm" },
  md: { tab: "h-9 gap-balsa-xs px-balsa-lg text-sm", tile: "min-h-20 gap-balsa-xs px-balsa-lg py-balsa-md text-sm", panel: "p-balsa-xl text-sm" },
  lg: { tab: "h-10 gap-balsa-xs px-balsa-xl text-sm", tile: "min-h-24 gap-balsa-xs px-balsa-xl py-balsa-lg text-sm", panel: "p-balsa-2xl text-sm" },
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const listClassesByType: Readonly<Record<TabsType, Record<TabsVariant, string[]>>> = {
  segmented: {
    surface: ["flex w-fit gap-balsa-3xs border-balsa-border bg-balsa-muted p-balsa-3xs"],
    outline: ["flex w-fit gap-balsa-3xs border-balsa-border-strong bg-transparent p-balsa-3xs"],
    soft: ["flex w-fit gap-balsa-3xs border-balsa-primary/20 bg-balsa-primary/10 p-balsa-3xs"],
    glass: ["flex w-fit gap-balsa-3xs border-balsa-border/70 bg-balsa-surface/70 p-balsa-3xs backdrop-balsa"],
  },
  underline: {
    surface: ["flex w-full min-w-0 items-end gap-balsa-3xs border-b border-balsa-border bg-transparent p-0"],
    outline: ["flex w-full min-w-0 items-end gap-balsa-3xs border-b-2 border-balsa-border-strong bg-transparent p-0"],
    soft: ["flex w-full min-w-0 items-end gap-balsa-3xs border-b border-balsa-primary/20 bg-balsa-primary/5 p-0"],
    glass: ["flex w-full min-w-0 items-end gap-balsa-3xs border-b border-balsa-border/70 bg-balsa-surface/50 p-0 backdrop-balsa"],
  },
  pills: {
    surface: ["flex w-fit gap-balsa-xs border-0 bg-transparent p-0"],
    outline: ["flex w-fit gap-balsa-xs border-0 bg-transparent p-0"],
    soft: ["flex w-fit gap-balsa-xs border-0 bg-transparent p-0"],
    glass: ["flex w-fit gap-balsa-xs border-0 bg-transparent p-0"],
  },
  tiles: {
    surface: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-balsa-xs border-0 bg-transparent p-0"],
    outline: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-balsa-xs border-0 bg-transparent p-0"],
    soft: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-balsa-xs border-0 bg-transparent p-0"],
    glass: ["grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-balsa-xs border-0 bg-transparent p-0"],
  },
};
const tabClassesByType: Readonly<Record<TabsType, Record<TabsVariant, Record<TabState, string[]>>>> = {
  segmented: {
    surface: { active: ["bg-balsa-selected text-balsa-selected-foreground shadow-balsa-detail hover:bg-balsa-selected hover:text-balsa-selected-foreground"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-surface hover:text-balsa-foreground"] },
    outline: { active: ["bg-balsa-surface-elevated text-balsa-surface-elevated-foreground shadow-balsa-detail"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground"] },
    soft: { active: ["bg-balsa-primary/20 text-balsa-primary hover:bg-balsa-primary/25"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-primary/10 hover:text-balsa-primary"] },
    glass: { active: ["border-balsa-border/70 bg-balsa-surface/80 text-balsa-foreground shadow-balsa-detail backdrop-balsa"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-surface/55 hover:text-balsa-foreground"] },
  },
  underline: {
    surface: { active: ["-mb-px rounded-none border-b-2 border-balsa-primary text-balsa-foreground"], inactive: ["rounded-none text-balsa-muted-foreground hover:text-balsa-foreground"] },
    outline: { active: ["-mb-0.5 rounded-none border-b-2 border-balsa-primary text-balsa-foreground"], inactive: ["rounded-none text-balsa-muted-foreground hover:text-balsa-foreground"] },
    soft: { active: ["-mb-px rounded-none border-b-2 border-balsa-primary bg-balsa-primary/10 text-balsa-primary"], inactive: ["rounded-none text-balsa-muted-foreground hover:bg-balsa-primary/5 hover:text-balsa-primary"] },
    glass: { active: ["-mb-px rounded-none border-b-2 border-balsa-primary bg-balsa-surface/60 text-balsa-foreground backdrop-balsa"], inactive: ["rounded-none text-balsa-muted-foreground hover:bg-balsa-surface/45 hover:text-balsa-foreground"] },
  },
  pills: {
    surface: { active: ["bg-balsa-selected text-balsa-selected-foreground shadow-balsa-detail"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground"] },
    outline: { active: ["border-balsa-border-strong bg-balsa-surface text-balsa-surface-foreground shadow-balsa-detail"], inactive: ["border-transparent text-balsa-muted-foreground hover:border-balsa-border hover:text-balsa-foreground"] },
    soft: { active: ["bg-balsa-primary/20 text-balsa-primary"], inactive: ["text-balsa-muted-foreground hover:bg-balsa-primary/10 hover:text-balsa-primary"] },
    glass: { active: ["border-balsa-border/70 bg-balsa-surface/70 text-balsa-foreground shadow-balsa-detail backdrop-balsa"], inactive: ["border-transparent text-balsa-muted-foreground hover:bg-balsa-surface/45 hover:text-balsa-foreground"] },
  },
  tiles: {
    surface: { active: ["border-balsa-selected bg-balsa-selected text-balsa-selected-foreground shadow-balsa-detail"], inactive: ["border-transparent bg-balsa-muted text-balsa-muted-foreground hover:bg-balsa-surface hover:text-balsa-foreground"] },
    outline: { active: ["border-balsa-border-strong bg-balsa-surface text-balsa-surface-foreground shadow-balsa-detail"], inactive: ["border-balsa-border bg-transparent text-balsa-muted-foreground hover:bg-balsa-muted hover:text-balsa-foreground"] },
    soft: { active: ["border-balsa-primary/30 bg-balsa-primary/20 text-balsa-primary"], inactive: ["border-transparent bg-balsa-primary/5 text-balsa-muted-foreground hover:bg-balsa-primary/10 hover:text-balsa-primary"] },
    glass: { active: ["border-balsa-border/70 bg-balsa-surface/75 text-balsa-foreground shadow-balsa-detail backdrop-balsa"], inactive: ["border-balsa-border/50 bg-balsa-surface/40 text-balsa-muted-foreground backdrop-balsa hover:bg-balsa-surface/60 hover:text-balsa-foreground"] },
  },
};
const panelVariantClasses: Readonly<Record<TabsVariant, string[]>> = {
  surface: ["border-balsa-border bg-balsa-surface text-balsa-surface-foreground"],
  outline: ["border-balsa-border-strong bg-transparent text-balsa-foreground"],
  soft: ["border-balsa-primary/20 bg-balsa-primary/5 text-balsa-foreground"],
  glass: ["border-balsa-border/70 bg-balsa-surface/60 text-balsa-foreground backdrop-balsa"],
};

export function Tabs(rawProps: TabsProps) {
  const { props, theme } = useResolvedThemeProps("tabs", "navigation", rawProps, {
    variant: "surface",
    type: "segmented",
    panelSurface: true,
    size: "md",
    shadow: "auto",
    rounded: "lg",
  } as const);
  const {
  id,
  items,
  label = "Content tabs",
  variant: resolvedVariant,
  type: resolvedType,
  panelSurface: resolvedPanelSurface,
  size: resolvedSize,
  rounded: themedRounded,
  shadow: resolvedShadow,
  theme: _themeInput,
  value,
  defaultValue = "",
  onValueChange,
  panels,
  className,
  style,
  children,
  ...domProps
  } = props;
  void _themeInput;
  const resolvedRounded: Rounded =
    rawProps.rounded === undefined
      && theme.defaults.rounded === undefined
      && resolvedType === "underline"
      ? "none"
      : themedRounded;

  const [model, setModel] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  const enabledItems = items.filter((item) => !item.disabled);
  const selectedItem = items.find((item) => item.id === model && !item.disabled);
  const activeItem = selectedItem ?? enabledItems[0];
  const activeId = activeItem?.id ?? "";
  const hasPanelContent = Boolean(
    children
    || (panels && items.some((item) => panels[item.id] != null)),
  );
  const activeTabId = `${id}-${activeId}-tab`;
  const activePanelId = `${id}-${activeId}-panel`;
  const iconSize: IconSize = resolvedSize === "sm" ? "sm" : resolvedSize === "lg" ? "lg" : "md";

  useEffect(() => {
    if (activeId && model !== activeId) setModel(activeId);
  }, [activeId, model]);

  const tabListClasses = mergeClasses(
    roundedClasses[resolvedType === "underline" ? "none" : resolvedRounded],
    resolvedType === "tiles"
      ? []
      : ["max-w-full flex-nowrap overflow-x-auto overflow-y-hidden overscroll-x-contain"],
    listClassesByType[resolvedType][resolvedVariant],
  );
  const panelIsSurfaced = resolvedPanelSurface && hasPanelContent;
  const panelClasses = mergeClasses(
    hasPanelContent
      ? ["mt-balsa-2xl min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring"]
      : [],
    panelIsSurfaced
      ? [
          "overflow-hidden",
          roundedClasses[resolvedRounded],
          ...panelVariantClasses[resolvedVariant],
          sizeClasses[resolvedSize].panel,
        ]
      : [],
  );

  function selectItem(itemId: string): void {
    const item = items.find((tab) => tab.id === itemId);
    if (!item || item.disabled) return;
    setModel(itemId);
  }

  function focusTab(itemId: string): void {
    document.getElementById(`${id}-${itemId}-tab`)?.focus();
  }

  function selectRelativeItem(currentId: string, direction: 1 | -1): void {
    const currentIndex = enabledItems.findIndex((item) => item.id === currentId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + enabledItems.length) % enabledItems.length;
    const nextItem = enabledItems[nextIndex];
    if (!nextItem) return;
    selectItem(nextItem.id);
    focusTab(nextItem.id);
  }

  function selectEdgeItem(edge: "first" | "last"): void {
    const nextItem = edge === "first" ? enabledItems[0] : enabledItems[enabledItems.length - 1];
    if (!nextItem) return;
    selectItem(nextItem.id);
    focusTab(nextItem.id);
  }

  function handleKeydown(event: KeyboardEvent<HTMLButtonElement>, itemId: string): void {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectRelativeItem(itemId, 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectRelativeItem(itemId, -1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectEdgeItem("first");
    }
    if (event.key === "End") {
      event.preventDefault();
      selectEdgeItem("last");
    }
  }

  const namedPanel = activeId ? panels?.[activeId] : undefined;
  const defaultPanel = typeof children === "function" ? children(activeId) : children;
  const panelContent = namedPanel ?? defaultPanel;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="tabs"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={resolvedVariant}
        data-type={resolvedType}
        data-size={resolvedSize}
        data-rounded={resolvedRounded}
        data-shadow={resolvedShadow}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
        className={mergeClasses("min-w-0", className)}
      >
        <div
          data-balsa="tabs-list"
          data-type={resolvedType}
          role="tablist"
          aria-orientation="horizontal"
          aria-label={label}
          className={tabListClasses}
        >
          {items.map((item) => {
            const state: TabState = item.id === activeId ? "active" : "inactive";
            const geometry = resolvedType === "tiles"
              ? sizeClasses[resolvedSize].tile
              : sizeClasses[resolvedSize].tab;
            const shape = resolvedType === "underline" ? "rounded-none" : roundedClasses[resolvedRounded];
            const layout = resolvedType === "tiles" ? "flex-col text-center" : "";
            const stateClasses = item.disabled
              ? ["cursor-not-allowed bg-balsa-disabled text-balsa-disabled-foreground opacity-70"]
              : tabClassesByType[resolvedType][resolvedVariant][state];

            return (
              <button
                id={`${id}-${item.id}-tab`}
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === activeId}
                aria-controls={`${id}-${item.id}-panel`}
                tabIndex={item.id === activeId ? 0 : -1}
                disabled={item.disabled}
                className={mergeClasses(
                  "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-balsa-focus-ring",
                  geometry,
                  shape,
                  layout,
                  stateClasses,
                )}
                onClick={() => selectItem(item.id)}
                onKeyDown={(event) => handleKeydown(event, item.id)}
              >
                {item.icon ? <Icon icon={item.icon} size={iconSize} className="shrink-0" /> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <section
          data-balsa="tabs-panel"
          data-surface={panelIsSurfaced ? "true" : "false"}
          id={activePanelId}
          className={panelClasses}
          role="tabpanel"
          tabIndex={hasPanelContent ? 0 : undefined}
          aria-labelledby={activeTabId}
        >
          {panelContent}
        </section>
      </div>
    </BalsaThemeContext.Provider>
  );
}
