import { ChevronDown, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import {
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import { Drawer } from "./Drawer";
import { roundedClasses, type Rounded } from "./form";
import { Icon, type IconComponent } from "./Icon";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon?: IconComponent;
  badge?: string;
  disabled?: boolean;
  children?: readonly SidebarItem[];
}
export interface SidebarGroup {
  id: string;
  label?: string;
  items: readonly SidebarItem[];
}
export type SidebarVariant = "surface" | "outline" | "soft" | "glass";
export type SidebarSide = "left" | "right";
export type SidebarCollapse = "rail" | "offcanvas" | "none";

export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect" | "children" | "title" | "id"> {
  id: string;
  label: string;
  groups: readonly SidebarGroup[];
  "data-balsa"?: string;
  "data-palette"?: string;
  side?: SidebarSide;
  variant?: SidebarVariant;
  collapsible?: SidebarCollapse;
  width?: string;
  railWidth?: string;
  mobileBreakpointLabel?: string;
  shortcut?: string;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  defaultMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  onSelect?: (item: SidebarItem) => void;
  header?: (collapsed: boolean) => ReactNode;
  footer?: (collapsed: boolean) => ReactNode;
}

const variantClasses: Readonly<Record<SidebarVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface", "text-balsa-foreground"],
  outline: ["border-balsa-border-strong", "bg-transparent", "text-balsa-foreground"],
  soft: ["border-transparent", "bg-balsa-muted", "text-balsa-foreground"],
  glass: ["border-balsa-border/60", "bg-balsa-surface/60", "text-balsa-foreground", "backdrop-balsa"],
};

export function Sidebar(rawProps: SidebarProps) {
  const { props, theme } = useResolvedThemeProps("sidebar", "navigation", rawProps, {
    variant: "surface",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    id,
    label,
    groups,
    "data-balsa": _dataBalsa,
    "data-palette": dataPalette,
    side = "left",
    variant,
    collapsible = "rail",
    width = "18rem",
    railWidth = "4.5rem",
    mobileBreakpointLabel = "Open navigation",
    shortcut = "b",
    rounded,
    shadow,
    theme: themeInput,
    value,
    defaultValue = "",
    onValueChange,
    collapsed: collapsedProp,
    defaultCollapsed = false,
    onCollapsedChange,
    mobileOpen: mobileOpenProp,
    defaultMobileOpen = false,
    onMobileOpenChange,
    onSelect,
    header,
    footer,
    className,
    style,
    ...domProps
  } = props;
  void _dataBalsa;

  const [active, setActive] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [collapsed, setCollapsed] = useControllableState({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  });
  const [mobileOpen, setMobileOpen] = useControllableState({
    value: mobileOpenProp,
    defaultValue: defaultMobileOpen,
    onChange: onMobileOpenChange,
  });
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const railCollapsed = collapsed && collapsible === "rail";
  const labelClasses = railCollapsed ? "sr-only" : "min-w-0 flex-1 truncate";

  function itemClasses(item: SidebarItem): string {
    return mergeClasses(
      "flex min-h-9 w-full items-center gap-balsa-sm rounded-balsa-control px-balsa-md py-balsa-2xs text-left text-sm font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
      active === item.id
        ? "bg-balsa-selected text-balsa-selected-foreground"
        : "text-balsa-foreground hover:bg-balsa-muted",
      item.disabled && "cursor-not-allowed opacity-45",
      railCollapsed && "justify-center px-balsa-xs",
    );
  }

  function toggleCollapsed(): void {
    if (collapsible !== "none") setCollapsed(!collapsed);
  }

  function select(item: SidebarItem): void {
    if (item.disabled) return;
    if (item.children?.length) {
      setExpanded((current) => {
        const next = new Set(current);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
      return;
    }
    setActive(item.id);
    setMobileOpen(false);
    onSelect?.(item);
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent): void {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== shortcut.toLowerCase()) return;
      event.preventDefault();
      if (collapsible !== "none") setCollapsed(!collapsed);
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [shortcut, collapsible, collapsed, setCollapsed]);

  const asideClasses = mergeClasses(
    "hidden h-full shrink-0 flex-col border transition-[width,transform] duration-200 lg:flex",
    variantClasses[variant],
    roundedClasses[rounded],
    collapsible === "offcanvas" && collapsed && "-translate-x-full",
    className,
  );
  const asideStyle = {
    width: railCollapsed ? railWidth : width,
    ...style,
  } as CSSProperties;
  const footerContent = footer?.(collapsed);
  const themeAttrs = {
    "data-theme": theme.explicitPresentation?.id,
    "data-theme-base": theme.explicitPresentation?.base,
    "data-palette": dataPalette,
  };

  function renderItem(item: SidebarItem, options: { rail?: boolean } = {}): ReactNode {
    const content = (
      <>
        {item.icon ? <Icon icon={item.icon} size="md" className="shrink-0" /> : null}
        <span className={options.rail ? labelClasses : "min-w-0 flex-1 truncate"}>{item.label}</span>
        {item.badge && !options.rail ? (
          <span className="text-xs text-balsa-muted-foreground">{item.badge}</span>
        ) : null}
        {item.children?.length && !options.rail ? <Icon icon={ChevronDown} size="md" /> : null}
      </>
    );
    const classNameForItem = itemClasses(item);
    const title = options.rail ? item.label : undefined;
    const control = item.href && !item.children?.length ? (
      <a href={item.href} className={classNameForItem} title={title} onClick={() => select(item)}>
        {content}
      </a>
    ) : (
      <button
        type="button"
        disabled={item.disabled}
        className={classNameForItem}
        title={title}
        onClick={() => select(item)}
      >
        {content}
      </button>
    );
    return (
      <li key={item.id}>
        {control}
        {item.children?.length && expanded.has(item.id) && !options.rail ? (
          <ul className="ml-balsa-xl mt-balsa-3xs space-y-balsa-3xs border-l border-balsa-border pl-balsa-xs">
            {item.children.map((child) => renderItem(child))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        data-balsa="sidebar-shell"
        {...themeAttrs}
        style={theme.explicitPresentation?.style as CSSProperties | undefined}
        className="contents"
      >
        <aside
          {...domProps}
          id={id}
          data-balsa="sidebar"
          {...themeAttrs}
          data-variant={variant}
          data-shadow={shadow}
          data-side={side}
          data-collapsed={collapsed}
          aria-label={label}
          className={asideClasses}
          style={asideStyle}
        >
          <header className="flex min-h-14 items-center gap-balsa-sm border-b border-balsa-border p-balsa-md">
            {header ? header(collapsed) : <span className={labelClasses}>{label}</span>}
            {collapsible !== "none" ? (
              <Button
                shape="fab"
                size="sm"
                variant="glass"
                prefixIcon={collapsed ? ChevronRight : ChevronLeft}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={toggleCollapsed}
              />
            ) : null}
          </header>
          <nav className="min-h-0 flex-1 overflow-y-auto p-balsa-md" aria-label={label}>
            {groups.map((group) => (
              <section key={group.id} className="mb-balsa-xl last:mb-0">
                {group.label && !railCollapsed ? (
                  <small className="mb-balsa-xs block px-balsa-md text-balsa-muted-foreground">{group.label}</small>
                ) : null}
                <ul className="space-y-balsa-3xs">
                  {group.items.map((item) => renderItem(item, { rail: railCollapsed }))}
                </ul>
              </section>
            ))}
          </nav>
          {footerContent ? (
            <footer className="border-t border-balsa-border p-balsa-md">{footerContent}</footer>
          ) : null}
        </aside>
        <Button
          className="lg:hidden"
          prefixIcon={Menu}
          aria-label={mobileBreakpointLabel}
          onClick={() => setMobileOpen(true)}
        >
          {mobileBreakpointLabel}
        </Button>
        <Drawer
          id={`${id}-mobile`}
          title={label}
          side={side}
          size="lg"
          theme={themeInput}
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          footer={footer ? () => footer(false) : undefined}
        >
          <nav aria-label={label}>
            {groups.map((group) => (
              <section key={group.id} className="mb-balsa-xl">
                {group.label ? (
                  <small className="mb-balsa-xs block text-balsa-muted-foreground">{group.label}</small>
                ) : null}
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled}
                    className={itemClasses(item)}
                    onClick={() => select(item)}
                  >
                    {item.icon ? <Icon icon={item.icon} size="md" /> : null}
                    <span className="min-w-0 flex-1 text-left">{item.label}</span>
                    {item.badge ? (
                      <span className="text-xs text-balsa-muted-foreground">{item.badge}</span>
                    ) : null}
                  </button>
                ))}
              </section>
            ))}
          </nav>
        </Drawer>
      </div>
    </BalsaThemeContext.Provider>
  );
}
