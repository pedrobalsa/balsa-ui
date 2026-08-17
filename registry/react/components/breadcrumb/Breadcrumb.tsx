import { ChevronRight, Dot } from "lucide-react";
import { type CSSProperties, type HTMLAttributes, type MouseEvent as ReactMouseEvent } from "react";
import { mergeClasses } from "./classes";
import { Icon } from "./Icon";
import type { NavigationLink } from "./navigation";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  current?: boolean;
}

export type BreadcrumbSeparator = "chevron" | "slash" | "dot";
export type BreadcrumbSize = "sm" | "md";

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: readonly BreadcrumbItem[];
  separator?: BreadcrumbSeparator;
  size?: BreadcrumbSize;
  ariaLabel?: string;
  theme?: ThemeInput;
  onNavigate?: (item: NavigationLink, event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

const sizeClasses: Readonly<Record<BreadcrumbSize, string>> = {
  sm: "gap-balsa-2xs text-xs",
  md: "gap-balsa-xs text-sm",
};
const linkSizeClasses: Readonly<Record<BreadcrumbSize, string>> = {
  sm: "min-h-7 px-balsa-3xs",
  md: "min-h-8 px-balsa-2xs",
};
const separatorIcons = { chevron: ChevronRight, dot: Dot } as const;

function linkRel(item: BreadcrumbItem): string | undefined {
  if (item.rel) return item.rel;
  return item.target === "_blank" ? "noreferrer" : undefined;
}

export function Breadcrumb(rawProps: BreadcrumbProps) {
  const { props, theme } = useResolvedThemeProps("breadcrumb", "navigation", rawProps, {
    size: "sm",
  } as const);
  const {
    items,
    separator = "chevron",
    size,
    ariaLabel = "Breadcrumb",
    theme: _themeInput,
    onNavigate,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const explicitIndex = items.findIndex((item) => item.current);
  const currentIndex = explicitIndex === -1 ? items.length - 1 : explicitIndex;

  function isCurrent(index: number): boolean {
    return index === currentIndex;
  }

  function navigate(item: BreadcrumbItem, event: ReactMouseEvent<HTMLAnchorElement>): void {
    if (!item.href) return;
    onNavigate?.({ title: item.label, link: item.href }, event);
  }

  function itemClasses(index: number): string {
    return mergeClasses(
      "inline-flex items-center rounded-balsa-control font-medium",
      linkSizeClasses[size],
      isCurrent(index) ? "text-balsa-foreground" : "text-balsa-muted-foreground",
    );
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <nav
        {...domProps}
        data-balsa="breadcrumb"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-separator={separator}
        aria-label={ariaLabel}
        className={mergeClasses("min-w-0 font-balsa-body", className)}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <ol
          className={mergeClasses(
            "m-0 flex min-w-0 list-none flex-wrap items-center p-0 text-balsa-muted-foreground",
            sizeClasses[size],
          )}
        >
          {items.map((item, index) => (
            <BreadcrumbEntry
              key={`${item.label}-${index}`}
              item={item}
              index={index}
              size={size}
              separator={separator}
              current={isCurrent(index)}
              itemClassName={itemClasses(index)}
              onNavigate={navigate}
            />
          ))}
        </ol>
      </nav>
    </BalsaThemeContext.Provider>
  );
}

function BreadcrumbEntry({
  item,
  index,
  size,
  separator,
  current,
  itemClassName,
  onNavigate,
}: {
  item: BreadcrumbItem;
  index: number;
  size: BreadcrumbSize;
  separator: BreadcrumbSeparator;
  current: boolean;
  itemClassName: string;
  onNavigate: (item: BreadcrumbItem, event: ReactMouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <>
      {index > 0 ? (
        <li aria-hidden="true" className="flex items-center text-balsa-muted-foreground/70">
          {separator === "slash" ? (
            <span className="font-medium text-sm">/</span>
          ) : (
            <Icon icon={separatorIcons[separator]} size="sm" />
          )}
        </li>
      ) : null}
      <li className="min-w-0">
        {item.href && !current ? (
          <a
            href={item.href}
            target={item.target}
            rel={linkRel(item)}
            className={mergeClasses(
              "inline-flex items-center rounded-balsa-control font-medium text-balsa-muted-foreground no-underline transition-colors hover:bg-balsa-muted hover:text-balsa-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring",
              linkSizeClasses[size],
            )}
            onClick={(event) => onNavigate(item, event)}
          >
            {item.label}
          </a>
        ) : (
          <span aria-current={current ? "page" : undefined} className={itemClassName}>
            {item.label}
          </span>
        )}
      </li>
    </>
  );
}
