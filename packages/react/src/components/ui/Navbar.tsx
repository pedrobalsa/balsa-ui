import { ChevronRight, ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Dropdown } from "./Dropdown";
import { Icon } from "./Icon";
import { mergeClasses } from "./classes";
import { NavbarExpandableItem } from "./NavbarExpandableItem";
import type { BrandLogo, NavigationGroup, NavigationLink } from "./navigation";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ActionColor } from "./types";

export type NavbarVariant = "surface" | "outline" | "soft" | "glass";
export type NavbarType = "bar" | "floating" | "minimal";
export type NavbarBehavior = "static" | "fixed" | "reveal";
export type NavbarFloatingLayout = "inset" | "container";
export type NavbarItemsAlignment = "left" | "center" | "right";

export interface NavbarProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "color"> {
  logo: BrandLogo;
  items: readonly NavigationGroup[];
  variant?: NavbarVariant;
  color?: ActionColor;
  type?: NavbarType;
  behavior?: NavbarBehavior;
  floatingLayout?: NavbarFloatingLayout;
  floatingMaxWidth?: string;
  contentMaxWidth?: string;
  itemsAlignment?: NavbarItemsAlignment;
  contentRegion?: string;
  /** @deprecated Use behavior="fixed" instead. */
  fixed?: boolean;
  shadow?: Shadow;
  theme?: ThemeInput;
  actions?: ReactNode;
  onNavigate?: (item: NavigationLink, event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

const typeClasses: Readonly<Record<NavbarType, string[]>> = {
  bar: ["inset-x-0 w-full"],
  floating: ["left-1/2 mt-balsa-lg max-w-7xl -translate-x-1/2"],
  minimal: ["inset-x-0 w-full"],
};
const surfaceTypeClasses: Readonly<Record<NavbarType, string[]>> = {
  bar: ["inset-0 border-b"],
  floating: ["inset-0 rounded-xl border"],
  minimal: ["inset-0 border-b border-transparent"],
};
const floatingLayoutClasses: Readonly<Record<NavbarFloatingLayout, string[]>> = {
  inset: ["w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)]"],
  container: ["w-full"],
};
const variantClasses: Readonly<Record<NavbarVariant, string[]>> = {
  surface: ["bg-balsa-background/90", "backdrop-balsa"],
  outline: ["bg-balsa-background/80", "backdrop-balsa"],
  soft: ["backdrop-balsa"],
  glass: ["backdrop-balsa", "shadow-balsa-control"],
};
const colorClasses: Readonly<Record<ActionColor, Record<NavbarVariant, string[]>>> = {
  neutral: {
    surface: [], outline: [], soft: [], glass: [],
  },
  primary: {
    surface: ["border-balsa-primary/30"], outline: ["border-balsa-primary"], soft: ["border-balsa-primary/20", "bg-balsa-primary/10"], glass: ["border-balsa-primary/30"],
  },
  secondary: {
    surface: ["border-balsa-secondary/30"], outline: ["border-balsa-secondary"], soft: ["border-balsa-secondary/20", "bg-balsa-secondary/10"], glass: ["border-balsa-secondary/30"],
  },
  accent: {
    surface: ["border-balsa-accent/30"], outline: ["border-balsa-accent"], soft: ["border-balsa-accent/20", "bg-balsa-accent/10"], glass: ["border-balsa-accent/30"],
  },
  destructive: {
    surface: ["border-balsa-destructive/30"], outline: ["border-balsa-destructive"], soft: ["border-balsa-destructive/20", "bg-balsa-destructive/10"], glass: ["border-balsa-destructive/30"],
  },
};
const variantTextClasses: Readonly<Record<NavbarVariant, string>> = {
  surface: "text-balsa-foreground",
  outline: "text-balsa-foreground",
  soft: "text-balsa-foreground",
  glass: "text-balsa-surface-elevated-foreground",
};
const behaviorClasses: Readonly<Record<NavbarBehavior, string[]>> = {
  static: ["relative"],
  fixed: ["fixed top-0"],
  reveal: ["fixed top-0"],
};
const mobileVariantClasses: Readonly<Record<NavbarVariant, string[]>> = {
  surface: ["bg-balsa-background/90", "text-balsa-foreground", "backdrop-balsa"],
  outline: ["bg-balsa-background/80", "text-balsa-foreground", "backdrop-balsa"],
  soft: ["text-balsa-foreground", "backdrop-balsa"],
  glass: ["text-balsa-surface-elevated-foreground", "backdrop-balsa"],
};
const itemsAlignmentClasses: Readonly<Record<NavbarItemsAlignment, string>> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
const regionItemsAlignmentClasses: Readonly<Record<NavbarItemsAlignment, string>> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

function hasLinks(item: NavigationGroup): boolean {
  return Boolean(item.links?.length);
}

export function Navbar(rawProps: NavbarProps) {
  const { props, theme } = useResolvedThemeProps("navbar", "navigation", rawProps, {
    variant: "surface",
    type: "bar",
    shadow: "auto",
  } as const);
  const {
    logo,
    items,
    variant,
    color = "primary",
    type,
    behavior,
    floatingLayout = "inset",
    floatingMaxWidth,
    contentMaxWidth,
    itemsAlignment = "right",
    contentRegion,
    fixed = false,
    shadow,
    theme: _themeInput,
    actions,
    onNavigate,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const resolvedBehavior: NavbarBehavior = behavior ?? (fixed ? "fixed" : "reveal");
  const regionConfined = Boolean(contentRegion);
  const [activeItem, setActiveItem] = useState<NavigationGroup>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string>();
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [hasReturnedFromScroll, setHasReturnedFromScroll] = useState(false);
  const lastScrollY = useRef(0);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mobileOpenRef = useRef(mobileOpen);
  const behaviorRef = useRef(resolvedBehavior);
  mobileOpenRef.current = mobileOpen;
  behaviorRef.current = resolvedBehavior;
  const seenBehavior = useRef(resolvedBehavior);

  if (seenBehavior.current !== resolvedBehavior) {
    seenBehavior.current = resolvedBehavior;
    lastScrollY.current = typeof window === "undefined" ? 0 : window.scrollY;
    setIsNavHidden(false);
    setHasReturnedFromScroll(false);
  }

  function clearCloseTimeout(): void {
    if (closeTimeout.current === undefined) return;
    clearTimeout(closeTimeout.current);
    closeTimeout.current = undefined;
  }

  function openDesktopItem(item: NavigationGroup): void {
    clearCloseTimeout();
    setActiveItem(hasLinks(item) ? item : undefined);
  }

  function scheduleDesktopClose(): void {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => {
      setActiveItem(undefined);
      closeTimeout.current = undefined;
    }, 160);
  }

  function closeDesktopItem(): void {
    clearCloseTimeout();
    setActiveItem(undefined);
  }

  function toggleMobileMenu(): void {
    const nextOpen = !mobileOpen;
    setMobileOpen(nextOpen);
    setIsNavHidden(false);
    setHasReturnedFromScroll(false);
    if (!nextOpen) setExpandedMobileItem(undefined);
  }

  function toggleMobileItem(item: NavigationGroup): void {
    if (!hasLinks(item)) return;
    setExpandedMobileItem((current) => current === item.link ? undefined : item.link);
  }

  function navigate(item: NavigationLink, event: ReactMouseEvent<HTMLAnchorElement>): void {
    onNavigate?.(item, event);
    closeDesktopItem();
    setMobileOpen(false);
    setExpandedMobileItem(undefined);
  }

  useEffect(() => {
    function updateRevealOnScroll(): void {
      const scrollY = window.scrollY;
      const scrollDelta = scrollY - lastScrollY.current;
      if (behaviorRef.current !== "reveal" || mobileOpenRef.current) {
        setIsNavHidden(false);
        setHasReturnedFromScroll(false);
      } else if (scrollY <= 72 || scrollDelta < -8) {
        setIsNavHidden(false);
        setHasReturnedFromScroll(scrollY > 72);
      } else if (scrollDelta > 8) {
        setIsNavHidden(true);
        setHasReturnedFromScroll(false);
        closeDesktopItem();
      }
      lastScrollY.current = scrollY;
    }

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", updateRevealOnScroll, { passive: true });
    return () => {
      clearCloseTimeout();
      window.removeEventListener("scroll", updateRevealOnScroll);
    };
  }, []);

  const barMaterialVisible = type !== "minimal";
  const minimalRevealFadeVisible = type === "minimal"
    && resolvedBehavior === "reveal"
    && hasReturnedFromScroll
    && !isNavHidden;
  const material = [...variantClasses[variant], ...colorClasses[color][variant]];
  const floatingStyle = type === "floating" && floatingMaxWidth
    ? { maxWidth: floatingMaxWidth }
    : undefined;
  const navigationStyle: CSSProperties | undefined = (() => {
    const next: CSSProperties & { ["--balsa-navbar-region"]?: string } = {};
    if (contentMaxWidth) {
      next.maxWidth = contentMaxWidth;
      next.marginInline = "auto";
    }
    if (contentRegion) next["--balsa-navbar-region"] = contentRegion;
    return Object.keys(next).length ? next : undefined;
  })();

  return (
    <BalsaThemeContext.Provider value={theme}>
      <header
        {...domProps}
        data-balsa="navbar"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-color={color}
        data-type={type}
        data-behavior={resolvedBehavior}
        data-floating-layout={type === "floating" ? floatingLayout : undefined}
        data-items-alignment={itemsAlignment}
        data-scroll-hidden={isNavHidden ? "true" : "false"}
        data-shadow={shadow}
        inert={isNavHidden ? true : undefined}
        className={mergeClasses(
          "z-50 transition-transform duration-300 ease-out",
          behaviorClasses[resolvedBehavior],
          typeClasses[type],
          type === "floating" ? floatingLayoutClasses[floatingLayout] : [],
          variantTextClasses[variant],
          isNavHidden ? "pointer-events-none -translate-y-[calc(100%+1rem)]" : "translate-y-0",
          className,
        )}
        style={
          {
            ...floatingStyle,
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        {barMaterialVisible ? (
          <div
            aria-hidden="true"
            data-balsa="navbar-surface"
            data-variant={variant}
            data-color={color}
            className={mergeClasses(
              "pointer-events-none absolute z-0",
              surfaceTypeClasses[type],
              material,
            )}
          />
        ) : null}
        {minimalRevealFadeVisible ? (
          <div
            aria-hidden="true"
            data-balsa="navbar-reveal-fade"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-balsa-background via-balsa-background/85 to-transparent"
          />
        ) : null}
        <nav
          aria-label="Main navigation"
          className={mergeClasses(
            type === "floating" && floatingLayout === "inset"
              ? "relative flex h-14 items-center gap-balsa-lg px-balsa-xs sm:px-2 lg:px-6 xl:px-8"
              : type === "floating"
                ? "relative flex h-14 items-center gap-balsa-lg px-balsa-lg sm:px-6 lg:px-8"
                : regionConfined
                  ? "relative flex h-26 w-full items-center px-balsa-lg sm:px-6 lg:w-[var(--balsa-navbar-region,100%)] lg:px-8"
                  : "relative mx-auto flex h-14 w-full max-w-7xl items-center gap-balsa-lg px-balsa-lg sm:px-balsa-2xl lg:px-balsa-3xl",
          )}
          style={navigationStyle}
        >
          <div
            className={mergeClasses(
              regionConfined
                ? "mx-auto flex w-full max-w-xl items-center gap-balsa-lg min-[1536px]:max-w-2xl min-[1920px]:max-w-3xl"
                : "contents",
            )}
          >
            <a
              href={logo.href}
              className={"title" in logo && logo.title ? "shrink-0 no-underline" : "w-40 shrink-0 no-underline"}
              aria-label={logo.alt}
              onClick={(event) => navigate({ title: logo.alt, link: logo.href }, event)}
            >
              {"title" in logo && logo.title ? (
                <span className="font-balsa-title text-lg font-medium tracking-[0.12em] text-inherit">
                  {logo.title}
                </span>
              ) : (
                <img
                  src={"src" in logo ? logo.src : undefined}
                  alt=""
                  className="h-8 w-full object-contain object-left"
                />
              )}
            </a>
            <ul
              className={mergeClasses(
                regionConfined
                  ? ["hidden h-full w-fit items-stretch lg:-mr-4 lg:flex", regionItemsAlignmentClasses[itemsAlignment]]
                  : ["hidden h-full flex-1 items-stretch lg:flex", itemsAlignmentClasses[itemsAlignment]],
              )}
            >
              {items.map((item, index) => {
                const menuId = `navbar-dropdown-${index}`;
                return (
                  <NavbarExpandableItem
                    key={item.link}
                    item={item}
                    expanded={activeItem?.link === item.link}
                    menuId={menuId}
                    onOpen={openDesktopItem}
                    onClose={scheduleDesktopClose}
                    onNavigate={navigate}
                  >
                    {hasLinks(item) ? (
                      <Dropdown
                        id={menuId}
                        open={activeItem?.link === item.link}
                        variant={variant}
                        color={color}
                        align="auto"
                      >
                        <ul className="flex flex-col" aria-label={`${item.title} navigation`}>
                          {item.links?.map((link) => (
                            <li key={link.link}>
                              <a
                                href={link.link}
                                className="group flex items-start gap-balsa-md rounded-lg px-balsa-md py-balsa-sm text-inherit no-underline transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                                onClick={(event) => navigate(link, event)}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium">{link.title}</span>
                                  {link.shortDescription ? (
                                    <span className="mt-balsa-4xs block text-sm text-balsa-muted-foreground">
                                      {link.shortDescription}
                                    </span>
                                  ) : null}
                                </span>
                                <Icon
                                  icon={ChevronRight}
                                  size="md"
                                  className="mt-balsa-4xs text-balsa-primary transition-transform group-hover:translate-x-0.5"
                                />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </Dropdown>
                    ) : null}
                  </NavbarExpandableItem>
                );
              })}
            </ul>
            {actions ? (
              <div className="hidden min-w-40 shrink-0 items-center justify-end gap-balsa-xs lg:flex">
                {actions}
              </div>
            ) : null}
            <button
              type="button"
              className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-balsa-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring lg:hidden"
              aria-expanded={mobileOpen}
              aria-label="Open navigation menu"
              onClick={toggleMobileMenu}
            >
              <Icon icon={mobileOpen ? X : Menu} size="md" />
            </button>
          </div>
        </nav>
        <div
          className={mergeClasses(
            "relative z-10 grid overflow-hidden border-t transition-[grid-template-rows,opacity] duration-300 lg:hidden",
            mobileVariantClasses[variant],
            colorClasses[color][variant],
            mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <nav aria-label="Mobile navigation" className="min-h-0 overflow-hidden">
            <ul className="flex flex-col px-balsa-lg py-balsa-md sm:px-6">
              {items.map((item) => (
                <li key={item.link} className="border-b border-balsa-border last:border-b-0">
                  <div className="flex items-center justify-between gap-balsa-md py-balsa-md">
                    <a
                      href={item.link}
                      className="font-balsa-title text-lg font-medium text-balsa-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                      onClick={(event) => navigate(item, event)}
                    >
                      {item.title}
                    </a>
                    {hasLinks(item) ? (
                      <button
                        type="button"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-balsa-foreground hover:bg-balsa-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                        aria-expanded={expandedMobileItem === item.link}
                        aria-label={`Open ${item.title} items`}
                        onClick={() => toggleMobileItem(item)}
                      >
                        <Icon
                          icon={expandedMobileItem === item.link ? ChevronUp : ChevronDown}
                          size="md"
                          className="text-balsa-primary transition-transform duration-200"
                        />
                      </button>
                    ) : null}
                  </div>
                  {hasLinks(item) ? (
                    <div
                      className={mergeClasses(
                        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300",
                        expandedMobileItem === item.link
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <ul className="min-h-0 space-y-balsa-md overflow-hidden pb-balsa-lg pl-balsa-xs">
                        {item.links?.map((link) => (
                          <li key={link.link}>
                            <a
                              href={link.link}
                              className="text-sm font-medium text-balsa-muted-foreground no-underline hover:text-balsa-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
                              onClick={(event) => navigate(link, event)}
                            >
                              {link.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </BalsaThemeContext.Provider>
  );
}
