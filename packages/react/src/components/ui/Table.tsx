import {
  Fragment,
  createElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import { surfaceRoundedClasses, type SurfaceRounded } from "./form";
import { Spinner } from "./Spinner";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { SemanticColor } from "./types";

export type TableVariant = "surface" | "outline" | "soft" | "glass";
export type TableDensity = "compact" | "default" | "comfortable";
export type TableColor = "neutral" | SemanticColor;
type TableSectionTag = "thead" | "tbody" | "tfoot";

const tableSectionTags: readonly string[] = ["thead", "tbody", "tfoot"];

interface SlotShape {
  rendered: boolean;
  sectioned: boolean;
}

function inspectSlotNodes(
  node: ReactNode,
  shape: SlotShape = { rendered: false, sectioned: false },
): SlotShape {
  if (node === null || node === undefined || typeof node === "boolean") return shape;
  if (Array.isArray(node)) {
    for (const child of node) inspectSlotNodes(child, shape);
    return shape;
  }
  if (typeof node === "string" || typeof node === "number") {
    if (String(node).trim()) shape.rendered = true;
    return shape;
  }
  if (!isValidElement(node)) return shape;
  if (node.type === Fragment) {
    inspectSlotNodes((node.props as { children?: ReactNode }).children, shape);
    return shape;
  }
  shape.rendered = true;
  if (typeof node.type === "string" && tableSectionTags.includes(node.type)) {
    shape.sectioned = true;
  }
  return shape;
}

function TableSection({
  tag,
  children,
}: {
  tag: TableSectionTag;
  children?: ReactNode;
}) {
  const shape = inspectSlotNodes(children);
  if (!shape.rendered || shape.sectioned) return children ?? null;
  return createElement(tag, null, children);
}

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  caption: string;
  variant?: TableVariant;
  density?: TableDensity;
  headerColor?: TableColor;
  rowColor?: TableColor;
  striped?: boolean;
  hover?: boolean;
  gridlines?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  columnCount?: number;
  rounded?: SurfaceRounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  header?: ReactNode;
  footer?: ReactNode;
  emptyContent?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Readonly<Record<TableVariant, string[]>> = {
  surface: ["border-balsa-border", "bg-balsa-surface"],
  outline: ["border-balsa-border-strong", "bg-transparent"],
  soft: ["border-transparent", "bg-balsa-muted"],
  glass: ["border-balsa-border/60", "bg-balsa-surface/60", "backdrop-balsa"],
};
const densityClasses: Readonly<Record<TableDensity, string>> = {
  compact: "text-xs",
  default: "text-sm",
  comfortable: "text-base",
};
const stickyHeaderClasses: Readonly<Record<TableVariant, string[]>> = {
  surface: ["[&_thead]:bg-balsa-surface"],
  outline: ["[&_thead]:bg-balsa-background"],
  soft: ["[&_thead]:bg-balsa-muted"],
  glass: ["[&_thead]:bg-balsa-surface/80", "[&_thead]:backdrop-balsa"],
};
const headerColorClasses: Readonly<Record<TableColor, string[]>> = {
  neutral: [],
  primary: ["[&_thead_th]:bg-balsa-primary/15", "[&_thead_th]:text-balsa-primary"],
  secondary: ["[&_thead_th]:bg-balsa-secondary/15", "[&_thead_th]:text-balsa-secondary"],
  accent: ["[&_thead_th]:bg-balsa-accent/15", "[&_thead_th]:text-balsa-accent"],
  info: ["[&_thead_th]:bg-balsa-info/15", "[&_thead_th]:text-balsa-info"],
  success: ["[&_thead_th]:bg-balsa-success/15", "[&_thead_th]:text-balsa-success"],
  warning: ["[&_thead_th]:bg-balsa-warning/15", "[&_thead_th]:text-balsa-warning"],
  destructive: ["[&_thead_th]:bg-balsa-destructive/15", "[&_thead_th]:text-balsa-destructive"],
};
const rowColorClasses: Readonly<Record<TableColor, string[]>> = {
  neutral: [],
  primary: ["[&_tbody_tr]:bg-balsa-primary/10", "[&_tbody_th]:text-balsa-primary", "[&_tbody_td]:text-balsa-primary"],
  secondary: ["[&_tbody_tr]:bg-balsa-secondary/10", "[&_tbody_th]:text-balsa-secondary", "[&_tbody_td]:text-balsa-secondary"],
  accent: ["[&_tbody_tr]:bg-balsa-accent/10", "[&_tbody_th]:text-balsa-accent", "[&_tbody_td]:text-balsa-accent"],
  info: ["[&_tbody_tr]:bg-balsa-info/10", "[&_tbody_th]:text-balsa-info", "[&_tbody_td]:text-balsa-info"],
  success: ["[&_tbody_tr]:bg-balsa-success/10", "[&_tbody_th]:text-balsa-success", "[&_tbody_td]:text-balsa-success"],
  warning: ["[&_tbody_tr]:bg-balsa-warning/10", "[&_tbody_th]:text-balsa-warning", "[&_tbody_td]:text-balsa-warning"],
  destructive: ["[&_tbody_tr]:bg-balsa-destructive/10", "[&_tbody_th]:text-balsa-destructive", "[&_tbody_td]:text-balsa-destructive"],
};
const stripedRowClasses: Readonly<Record<TableColor, string>> = {
  neutral: "[&_tbody_tr:nth-child(even)]:bg-balsa-muted/60",
  primary: "[&_tbody_tr:nth-child(even)]:bg-balsa-primary/15",
  secondary: "[&_tbody_tr:nth-child(even)]:bg-balsa-secondary/15",
  accent: "[&_tbody_tr:nth-child(even)]:bg-balsa-accent/15",
  info: "[&_tbody_tr:nth-child(even)]:bg-balsa-info/15",
  success: "[&_tbody_tr:nth-child(even)]:bg-balsa-success/15",
  warning: "[&_tbody_tr:nth-child(even)]:bg-balsa-warning/15",
  destructive: "[&_tbody_tr:nth-child(even)]:bg-balsa-destructive/15",
};
const hoverRowClasses: Readonly<Record<TableColor, string>> = {
  neutral: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-selected/60",
  primary: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-primary/20",
  secondary: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-secondary/20",
  accent: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-accent/20",
  info: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-info/20",
  success: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-success/20",
  warning: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-warning/20",
  destructive: "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-balsa-destructive/20",
};
const selectedRowClasses = [
  "[&_tbody_tr[data-selected=true]]:bg-balsa-selected",
  "[&_tbody_tr[data-selected=true]_th]:text-balsa-selected-foreground",
  "[&_tbody_tr[data-selected=true]_td]:text-balsa-selected-foreground",
];

export function Table(rawProps: TableProps) {
  const { props, theme } = useResolvedThemeProps("table", "surfaces", rawProps, {
    variant: "surface",
    density: "default",
    rounded: "auto",
    shadow: "auto",
  } as const);
  const {
    caption,
    variant,
    density,
    headerColor = "neutral",
    rowColor = "neutral",
    striped = false,
    hover = true,
    gridlines = false,
    stickyHeader = false,
    loading = false,
    empty = false,
    emptyText = "No rows to display.",
    columnCount = 1,
    rounded,
    shadow,
    theme: _themeInput,
    header,
    footer,
    emptyContent,
    children,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const classes = mergeClasses(
    "max-w-full overflow-x-auto text-balsa-foreground",
    variantClasses[variant],
    surfaceRoundedClasses[rounded],
    className,
  );
  const tableClasses = mergeClasses(
    "w-full min-w-max border-collapse text-left",
    densityClasses[density],
    "[&_th]:font-medium [&_th]:text-balsa-muted-foreground [&_tr]:border-b [&_tr]:border-balsa-border [&_tbody_tr:last-child]:border-b-0",
    headerColorClasses[headerColor],
    rowColorClasses[rowColor],
    striped && stripedRowClasses[rowColor],
    hover && hoverRowClasses[rowColor],
    selectedRowClasses,
    gridlines && "[&_th]:border-r [&_th]:border-balsa-border [&_td]:border-r [&_td]:border-balsa-border",
    stickyHeader && [
      "[&_thead]:sticky",
      "[&_thead]:top-0",
      "[&_thead]:z-10",
      stickyHeaderClasses[variant],
    ],
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="table"
        data-rounded={rounded}
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        data-density={density}
        data-header-color={headerColor}
        data-row-color={rowColor}
        data-shadow={shadow}
        className={classes}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <table className={tableClasses}>
          <caption className="sr-only">{caption}</caption>
          <TableSection tag="thead">{header}</TableSection>
          {loading ? (
            <tbody>
              <tr>
                <td colSpan={columnCount} className="text-center">
                  <Spinner label="Loading rows" />
                </td>
              </tr>
            </tbody>
          ) : empty ? (
            <tbody>
              <tr>
                <td colSpan={columnCount} className="text-center text-balsa-muted-foreground">
                  {emptyContent ?? emptyText}
                </td>
              </tr>
            </tbody>
          ) : (
            <TableSection tag="tbody">{children}</TableSection>
          )}
          <TableSection tag="tfoot">{footer}</TableSection>
        </table>
      </div>
    </BalsaThemeContext.Provider>
  );
}
