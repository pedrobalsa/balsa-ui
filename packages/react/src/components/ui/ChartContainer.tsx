import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClasses } from "./classes";
import type { Rounded } from "./form";
import { Spinner } from "./Spinner";
import type { ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import {
  BalsaChartContext,
  ensureChartContrast,
  type ChartConfig,
  type ChartPaletteRole,
  type ChartTableSeries,
} from "./chart";

export interface ChartPlotSlot {
  width: number;
  height: number;
  colors: Readonly<Record<string, string>>;
  reducedMotion: boolean;
}

export interface ChartContainerProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  "data-balsa"?: string;
  title: string;
  description?: string;
  config: ChartConfig;
  labels?: readonly string[];
  tableSeries?: readonly ChartTableSeries[];
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyText?: string;
  showTable?: boolean;
  showCaption?: boolean;
  responsive?: boolean;
  width?: number;
  height?: number;
  rounded?: Rounded;
  labelFormatter?: (label: string, index: number) => string;
  valueFormatter?: (value: number, series: ChartTableSeries, index: number) => string;
  theme?: ThemeInput;
  children?: (slot: ChartPlotSlot) => ReactNode;
}

const defaultRoles: readonly ChartPaletteRole[] = ["primary", "secondary", "accent", "neutral"];

function token(role: ChartPaletteRole): string {
  if (role === "neutral") return "foreground";
  return role;
}

export function ChartContainer(rawProps: ChartContainerProps) {
  const { props, theme } = useResolvedThemeProps("charts", "surfaces", rawProps, {
    rounded: "lg",
  } as const);
  const {
    title,
    description,
    config,
    labels = [],
    tableSeries = [],
    loading = false,
    error,
    empty = false,
    emptyText = "No chart data.",
    showTable = false,
    showCaption = true,
    responsive = true,
    width,
    height = 260,
    rounded: _rounded,
    labelFormatter = (label: string) => label,
    valueFormatter = (value: number) => new Intl.NumberFormat().format(value),
    theme: _themeInput,
    className,
    style,
    children,
    "data-balsa": dataBalsa,
    ...domProps
  } = props;
  void _rounded;
  void _themeInput;

  const rootRef = useRef<HTMLElement | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [paletteVersion, setPaletteVersion] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const resolvedWidth = width ?? measuredWidth;
  const resolvedHeight = Math.max(0, height);
  const renderable = resolvedWidth > 0 && resolvedHeight > 0;
  const chartStyle: CSSProperties = {
    height: `${resolvedHeight}px`,
    ...(width === undefined ? {} : { width: `${Math.max(0, width)}px`, maxWidth: responsive ? "100%" : undefined }),
  };
  const tableClasses = showTable ? "mt-balsa-xl overflow-x-auto" : "sr-only";

  const colors = useMemo(() => {
    void paletteVersion;
    const node = rootRef.current;
    if (!node) return Object.fromEntries(Object.keys(config).map((key) => [key, "currentColor"]));
    const styles = getComputedStyle(node);
    const surface = styles.getPropertyValue("--balsa-color-chart-surface").trim()
      || styles.getPropertyValue("--balsa-color-surface").trim();
    const foreground = styles.getPropertyValue("--balsa-color-chart-axis").trim()
      || styles.getPropertyValue("--balsa-color-surface-foreground").trim();
    return Object.fromEntries(Object.entries(config).map(([key, item], index) => {
      const role = item.color ?? defaultRoles[index % defaultRoles.length]!;
      const source = styles.getPropertyValue(`--balsa-color-${token(role)}`).trim() || foreground || "currentColor";
      return [key, ensureChartContrast(source, surface, foreground, 3)];
    }));
  }, [config, paletteVersion]);

  useEffect(() => {
    setPaletteVersion((current) => current + 1);
  }, [rawProps.theme]);

  useEffect(() => {
    function refreshWidth(): void {
      setMeasuredWidth(plotRef.current?.clientWidth ?? 0);
    }

    refreshWidth();
    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let media: MediaQueryList | undefined;

    function refreshMotion(): void {
      setReducedMotion(media?.matches ?? false);
    }

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(refreshWidth);
      if (plotRef.current) resizeObserver.observe(plotRef.current);
    }
    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(() => {
        setPaletteVersion((current) => current + 1);
      });
      let context: HTMLElement | null = rootRef.current;
      while (context) {
        mutationObserver.observe(context, {
          attributes: true,
          attributeFilter: ["style", "class", "data-palette", "data-theme", "data-theme-base"],
        });
        context = context.parentElement;
      }
    }
    if (typeof window.matchMedia === "function") {
      media = window.matchMedia("(prefers-reduced-motion: reduce)");
      refreshMotion();
      media.addEventListener("change", refreshMotion);
    }
    setPaletteVersion((current) => current + 1);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      media?.removeEventListener("change", refreshMotion);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ config, colors, reducedMotion }),
    [config, colors, reducedMotion],
  );

  return (
    <BalsaThemeContext.Provider value={theme}>
      <BalsaChartContext.Provider value={contextValue}>
        <figure
          {...domProps}
          ref={rootRef}
          data-balsa={dataBalsa ?? "chart-container"}
          data-theme={theme.explicitPresentation?.id}
          data-theme-base={theme.explicitPresentation?.base}
          data-responsive={responsive}
          className={mergeClasses("text-balsa-foreground", className)}
          style={{ ...theme.explicitPresentation?.style, ...style } as CSSProperties}
        >
          <figcaption className={showCaption ? undefined : "sr-only"}>
            <h3 className="text-sm font-semibold leading-snug">{title}</h3>
            {description ? (
              <p className="mt-balsa-3xs text-xs text-balsa-muted-foreground">{description}</p>
            ) : null}
          </figcaption>
          {loading ? (
            <div style={chartStyle} className="grid place-items-center" aria-busy="true">
              <Spinner label="Loading chart" />
            </div>
          ) : error ? (
            <div style={chartStyle} className="grid place-items-center text-center text-balsa-destructive" role="alert">
              {error}
            </div>
          ) : empty ? (
            <div style={chartStyle} className="grid place-items-center text-center text-balsa-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <div ref={plotRef} style={chartStyle} className="mt-balsa-lg min-w-0" aria-hidden="true">
              {renderable ? children?.({
                width: resolvedWidth,
                height: resolvedHeight,
                colors,
                reducedMotion,
              }) : null}
            </div>
          )}
          <div className={tableClasses}>
            <table className="w-full text-left text-sm tabular-nums">
              <caption>{title} data</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  {tableSeries.map((item) => (
                    <th key={item.key} scope="col">{item.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, index) => (
                  <tr key={`${label}-${index}`}>
                    <th scope="row">{labelFormatter(label, index)}</th>
                    {tableSeries.map((item) => (
                      <td key={item.key}>
                        {item.data[index] === undefined ? "—" : valueFormatter(item.data[index]!, item, index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      </BalsaChartContext.Provider>
    </BalsaThemeContext.Provider>
  );
}
