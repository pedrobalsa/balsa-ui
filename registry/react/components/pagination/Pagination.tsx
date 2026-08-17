import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import {
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { mergeClasses } from "./classes";
import { roundedClasses, type Rounded } from "./form";
import { Icon } from "./Icon";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useControllableState,
  useResolvedThemeProps,
} from "./theme-context";

export type PaginationSize = "sm" | "md" | "lg";
export type PaginationPresentation = "pages" | "action-labels" | "icons";

type PaginationToken =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  total: number;
  pageSize?: number;
  siblingCount?: number;
  presentation?: PaginationPresentation;
  showEdges?: boolean;
  showLabels?: boolean;
  disabled?: boolean;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  firstLabel?: string;
  lastLabel?: string;
  pageLabel?: (page: number) => string;
  size?: PaginationSize;
  rounded?: Rounded;
  theme?: ThemeInput;
  value?: number;
  defaultValue?: number;
  onValueChange?: (page: number) => void;
  onChange?: (page: number) => void;
}

const sizeClasses: Readonly<Record<PaginationSize, string[]>> = {
  sm: ["min-h-8", "min-w-8", "px-balsa-xs", "text-xs"],
  md: ["min-h-9", "min-w-9", "px-balsa-md", "text-sm"],
  lg: ["min-h-10", "min-w-10", "px-balsa-lg", "text-sm"],
};

function paginationTokens(
  pageCount: number,
  currentPage: number,
  siblingCount: number,
): PaginationToken[] {
  if (pageCount <= 1) return [{ type: "page", page: 1 }];
  const siblings = Math.max(0, Math.floor(siblingCount));
  const included = new Set<number>([1, pageCount, currentPage]);
  for (let page = currentPage - siblings; page <= currentPage + siblings; page += 1) {
    if (page > 1 && page < pageCount) included.add(page);
  }
  const pages = [...included].sort((a, b) => a - b);
  const result: PaginationToken[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) {
      result.push({ type: "ellipsis", key: `${previous}-${page}` });
    }
    result.push({ type: "page", page });
  });
  return result;
}

export function Pagination(rawProps: PaginationProps) {
  const { props, theme } = useResolvedThemeProps("pagination", "navigation", rawProps, {
    size: "md",
    rounded: "lg",
  } as const);
  const {
    total,
    pageSize = 10,
    siblingCount = 1,
    presentation = "pages",
    showEdges = true,
    showLabels = true,
    disabled = false,
    label = "Pagination",
    previousLabel = "Previous page",
    nextLabel = "Next page",
    firstLabel = "First page",
    lastLabel = "Last page",
    pageLabel = (page: number) => `Page ${page}`,
    size,
    rounded,
    theme: _themeInput,
    value,
    defaultValue = 1,
    onValueChange,
    onChange,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [current, setValue] = useControllableState<number>({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  const pageCount = Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
  const currentPage = Math.min(pageCount, Math.max(1, Math.round(current || 1)));
  const tokens = paginationTokens(pageCount, currentPage, siblingCount);
  const visibleTokens = presentation === "pages" ? tokens : [];
  const showActionLabels = presentation === "action-labels"
    || (presentation === "pages" && showLabels);
  const actionLabelClasses = presentation === "pages" ? "max-sm:sr-only" : undefined;
  const buttonClasses = mergeClasses(
    "inline-flex shrink-0 items-center justify-center gap-balsa-2xs border border-balsa-border bg-balsa-surface font-medium tabular-nums text-balsa-foreground transition-colors hover:bg-balsa-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-balsa-focus-ring disabled:cursor-not-allowed disabled:opacity-45",
    sizeClasses[size],
    roundedClasses[rounded],
  );
  const selectedButtonClasses = mergeClasses(
    buttonClasses,
    "border-balsa-primary bg-balsa-primary text-balsa-primary-foreground hover:bg-balsa-primary-hover",
  );

  function setPage(page: number): void {
    if (disabled) return;
    const next = Math.min(pageCount, Math.max(1, page));
    if (next === currentPage) return;
    setValue(next);
    onChange?.(next);
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <nav
        {...domProps}
        data-balsa="pagination"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-rounded={rounded}
        data-presentation={presentation}
        aria-label={label}
        className={mergeClasses("max-w-full font-balsa-body", className)}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <ul
          className={mergeClasses(
            "flex max-w-full items-center gap-balsa-3xs overflow-x-auto",
            presentation === "action-labels" ? "w-full justify-between" : "justify-center",
          )}
          role="list"
        >
          {presentation === "pages" && showEdges ? (
            <li className="max-sm:hidden">
              <button
                type="button"
                className={buttonClasses}
                aria-label={firstLabel}
                disabled={disabled || currentPage === 1}
                onClick={() => setPage(1)}
              >
                <Icon icon={ChevronFirst} size="md" />
              </button>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              className={buttonClasses}
              aria-label={previousLabel}
              disabled={disabled || currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              {presentation !== "action-labels" ? <Icon icon={ChevronLeft} size="md" /> : null}
              {showActionLabels ? <span className={actionLabelClasses}>{previousLabel}</span> : null}
            </button>
          </li>
          {visibleTokens.map((token) => (
            <li key={token.type === "page" ? token.page : token.key}>
              {token.type === "ellipsis" ? (
                <span
                  className="inline-flex min-h-10 min-w-8 items-center justify-center text-balsa-muted-foreground max-sm:hidden"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  type="button"
                  className={mergeClasses(
                    token.page === currentPage ? selectedButtonClasses : buttonClasses,
                    token.page !== currentPage ? "max-sm:hidden" : "",
                  )}
                  aria-label={pageLabel(token.page)}
                  aria-current={token.page === currentPage ? "page" : undefined}
                  disabled={disabled}
                  onClick={() => setPage(token.page)}
                >
                  {token.page}
                </button>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              className={buttonClasses}
              aria-label={nextLabel}
              disabled={disabled || currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              {showActionLabels ? <span className={actionLabelClasses}>{nextLabel}</span> : null}
              {presentation !== "action-labels" ? <Icon icon={ChevronRight} size="md" /> : null}
            </button>
          </li>
          {presentation === "pages" && showEdges ? (
            <li className="max-sm:hidden">
              <button
                type="button"
                className={buttonClasses}
                aria-label={lastLabel}
                disabled={disabled || currentPage === pageCount}
                onClick={() => setPage(pageCount)}
              >
                <Icon icon={ChevronLast} size="md" />
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </BalsaThemeContext.Provider>
  );
}
