import {
  VisArea,
  VisAreaSelectors,
  VisAxis,
  VisDonut,
  VisDonutSelectors,
  VisGroupedBar,
  VisGroupedBarSelectors,
  VisLine,
  VisLineSelectors,
  VisSingleContainer,
  VisStackedBar,
  VisStackedBarSelectors,
  VisTooltip,
  VisXYContainer,
} from "@unovis/react";
import { CurveType } from "@unovis/ts";
import { type HTMLAttributes, type ReactNode, useMemo } from "react";
import { ChartContainer } from "./ChartContainer";
import { ChartCrosshair } from "./ChartCrosshair";
import { ChartLegendContent } from "./ChartLegendContent";
import type { ChartConfig, ChartPaletteRole, ChartTableSeries } from "./chart";
import type { Rounded } from "./form";
import type { IconComponent } from "./Icon";
import type { ThemeInput } from "./theme";
import type { SemanticColor } from "./types";

export type ChartsType = "line" | "area" | "bar" | "donut" | "doughnut";
export type ChartsBarMode = "grouped" | "stacked";
export type ChartsAreaFill = "gradient" | "solid" | "none";

export interface ChartSeries {
  key?: string;
  label: string;
  data: readonly number[];
  color?: SemanticColor | "neutral";
  icon?: IconComponent;
}

interface XYDatum {
  index: number;
  label: string;
  values: number[];
}

interface DonutDatum {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface ChartsProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  title: string;
  description?: string;
  type?: ChartsType;
  labels: readonly string[];
  series: readonly ChartSeries[];
  colors?: readonly SemanticColor[];
  config?: ChartConfig;
  barMode?: ChartsBarMode;
  loading?: boolean;
  error?: string;
  emptyText?: string;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showCaption?: boolean;
  showTable?: boolean;
  responsive?: boolean;
  areaFill?: ChartsAreaFill;
  width?: number;
  height?: number;
  rounded?: Rounded;
  labelFormatter?: (label: string, index: number) => string;
  valueFormatter?: (value: number, series: ChartSeries, index: number) => string;
  theme?: ThemeInput;
  center?: ReactNode;
}

const defaultRoles: readonly ChartPaletteRole[] = ["primary", "secondary", "accent", "neutral"];
const areaFillOpacity: Readonly<Record<ChartsAreaFill, readonly [number, number]>> = {
  gradient: [0.5, 0.02],
  solid: [0.24, 0.24],
  none: [0, 0],
};
const plotStyle = ".balsa-chart-plot{display:block;position:relative;width:100%}";

const x = (datum: XYDatum) => datum.index;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function dashArray(_: XYDatum[], index: number): number[] {
  return index % 3 === 1 ? [7, 4] : index % 3 === 2 ? [2, 4] : [];
}

export function Charts({
  title,
  description,
  type = "bar",
  labels,
  series,
  colors,
  config: explicitConfig,
  barMode = "grouped",
  loading = false,
  error,
  emptyText = "No chart data.",
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
  showLegend = true,
  showCaption = true,
  showTable = false,
  responsive = true,
  areaFill = "gradient",
  width,
  height = 260,
  rounded,
  labelFormatter = (label: string) => label,
  valueFormatter = (value: number) => new Intl.NumberFormat().format(value),
  theme,
  center,
  ...domProps
}: ChartsProps) {
  const normalizedType = type === "doughnut" ? "donut" : type;
  const seriesKeys = series.map((item, index) => item.key ?? `series-${index}`);
  const empty = !series.length || !labels.length || series.every((item) => !item.data.length);
  const xyData = labels.map((label, index) => ({
    index,
    label,
    values: series.map((item) => item.data[index] ?? 0),
  }));
  const y = series.map((_, seriesIndex) => (datum: XYDatum) => datum.values[seriesIndex] ?? 0);
  const cornerRadius = ({ none: 0, sm: 2, md: 4, lg: 6, xl: 8, "2xl": 12, "3xl": 16, full: 9999 } satisfies Record<Rounded, number>)[rounded ?? "lg"];
  const config = useMemo<ChartConfig>(() => {
    if (explicitConfig) return explicitConfig;
    if (normalizedType === "donut") {
      return Object.fromEntries(labels.map((label, index) => [
        `segment-${index}`,
        {
          label: labelFormatter(label, index),
          color: series[0]?.color ?? colors?.[index % (colors.length || 1)] ?? defaultRoles[index % defaultRoles.length]!,
          icon: series[0]?.icon,
        },
      ]));
    }
    return Object.fromEntries(series.map((item, index) => [
      seriesKeys[index]!,
      {
        label: item.label,
        color: item.color ?? colors?.[index % (colors.length || 1)] ?? defaultRoles[index % defaultRoles.length]!,
        icon: item.icon,
      },
    ]));
  }, [colors, explicitConfig, labelFormatter, labels, normalizedType, series, seriesKeys]);
  const tableSeries: ChartTableSeries[] = series.map((item, index) => ({
    key: seriesKeys[index]!,
    label: item.label,
    data: item.data,
  }));

  function labelTick(tick: number | Date): string {
    const index = typeof tick === "number" ? Math.round(tick) : 0;
    return labelFormatter(labels[index] ?? "", index);
  }

  function valueTick(tick: number | Date): string {
    return valueFormatter(Number(tick), series[0] ?? { label: "Value", data: [] }, 0);
  }

  function tableValueFormatter(value: number, tableItem: ChartTableSeries, index: number): string {
    return valueFormatter(
      value,
      series.find((item, seriesIndex) => (item.key ?? `series-${seriesIndex}`) === tableItem.key)
        ?? { label: tableItem.label, data: tableItem.data },
      index,
    );
  }

  function tooltipTemplate(resolvedColors: Readonly<Record<string, string>>, datum: XYDatum): string {
    const rows = series.map((item, index) => `<div class="balsa-chart-tooltip-row"><span class="balsa-chart-tooltip-marker" style="background:${escapeHtml(resolvedColors[seriesKeys[index]!] ?? "currentColor")}"></span><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(valueFormatter(datum.values[index] ?? 0, item, datum.index))}</strong></div>`).join("");
    return `<div class="balsa-chart-tooltip-content"><div class="balsa-chart-tooltip-label">${escapeHtml(labelFormatter(datum.label, datum.index))}</div>${rows}</div>`;
  }

  function colorsArray(resolvedColors: Readonly<Record<string, string>>): string[] {
    return seriesKeys.map((key) => resolvedColors[key] ?? "currentColor");
  }

  function areaDefs(resolvedColors: Readonly<Record<string, string>>): string {
    const [top, bottom] = areaFillOpacity[areaFill];
    return seriesKeys.map((key, index) => {
      const color = escapeHtml(resolvedColors[key] ?? "currentColor");
      return `<linearGradient id="balsa-area-${index}" x1="0" x2="0" y1="0" y2="1">`
        + `<stop offset="0%" stop-color="${color}" stop-opacity="${top}"/>`
        + `<stop offset="100%" stop-color="${color}" stop-opacity="${bottom}"/>`
        + `</linearGradient>`;
    }).join("");
  }

  function donutData(resolvedColors: Readonly<Record<string, string>>): DonutDatum[] {
    const source = series[0];
    return labels.map((label, index) => ({
      key: `segment-${index}`,
      label,
      value: source?.data[index] ?? 0,
      color: resolvedColors[`segment-${index}`] ?? "currentColor",
    }));
  }

  function donutTooltip(datum: DonutDatum): string {
    const source = series[0] ?? { label: "Value", data: [] };
    return `<div class="balsa-chart-tooltip-content"><div class="balsa-chart-tooltip-row"><span class="balsa-chart-tooltip-marker" style="background:${escapeHtml(datum.color)}"></span><span>${escapeHtml(datum.label)}</span><strong>${escapeHtml(valueFormatter(datum.value, source, labels.indexOf(datum.label)))}</strong></div></div>`;
  }

  return (
    <>
      <style>{plotStyle}</style>
      <ChartContainer
        {...domProps}
        data-balsa="charts"
        data-type={normalizedType}
        data-bar-mode={barMode}
        title={title}
        description={description}
        config={config}
        labels={labels}
        tableSeries={tableSeries}
        loading={loading}
        error={error}
        empty={empty}
        emptyText={emptyText}
        showCaption={showCaption}
        showTable={showTable}
        labelFormatter={labelFormatter}
        valueFormatter={tableValueFormatter}
        responsive={responsive}
        width={width}
        height={height}
        rounded={rounded}
        theme={theme}
      >
        {(slotProps) => (
          <>
            {normalizedType === "donut" ? (
              <VisSingleContainer
                data={donutData(slotProps.colors)}
                width={slotProps.width}
                height={slotProps.height}
                duration={slotProps.reducedMotion ? 0 : undefined}
                className="balsa-chart-plot"
              >
                <VisDonut
                  value={(datum: DonutDatum) => datum.value}
                  color={(datum: DonutDatum) => datum.color}
                  padAngle={0.025}
                  cornerRadius={Math.min(cornerRadius, 8)}
                  arcWidth={28}
                />
                {showTooltip ? (
                  <VisTooltip
                    triggers={{ [VisDonutSelectors.segment]: donutTooltip }}
                    className="balsa-chart-tooltip"
                  />
                ) : null}
              </VisSingleContainer>
            ) : (
              <VisXYContainer
                data={xyData}
                width={slotProps.width}
                height={slotProps.height}
                duration={slotProps.reducedMotion ? 0 : undefined}
                svgDefs={normalizedType === "area" ? areaDefs(slotProps.colors) : undefined}
                yDomain={[0, undefined]}
                className="balsa-chart-plot"
              >
                {normalizedType === "line" ? (
                  <VisLine
                    x={x}
                    y={y}
                    color={colorsArray(slotProps.colors)}
                    lineWidth={2}
                    curveType={CurveType.MonotoneX}
                    lineDashArray={dashArray}
                    highlightOnHover
                  />
                ) : null}
                {normalizedType === "area" ? (
                  <VisArea
                    x={x}
                    y={y}
                    color={seriesKeys.map((_, index) => `url(#balsa-area-${index})`)}
                    lineColor={colorsArray(slotProps.colors)}
                    lineDashArray={dashArray}
                    lineWidth={2}
                    curveType={CurveType.MonotoneX}
                    line
                  />
                ) : null}
                {normalizedType === "bar" && barMode === "grouped" ? (
                  <VisGroupedBar
                    x={x}
                    y={y}
                    color={colorsArray(slotProps.colors)}
                    groupPadding={0.18}
                    barPadding={0.08}
                    roundedCorners={cornerRadius}
                  />
                ) : null}
                {normalizedType === "bar" && barMode === "stacked" ? (
                  <VisStackedBar
                    x={x}
                    y={y}
                    color={colorsArray(slotProps.colors)}
                    barPadding={0.22}
                    roundedCorners={cornerRadius}
                  />
                ) : null}
                {showXAxis ? (
                  <VisAxis type="x" gridLine={false} domainLine={false} tickLine={false} tickFormat={labelTick} numTicks={labels.length} />
                ) : null}
                {showYAxis ? (
                  <VisAxis type="y" gridLine={showGrid} domainLine={false} tickLine={false} tickFormat={valueTick} />
                ) : null}
                {showTooltip ? (
                  <ChartCrosshair x={x} y={y} template={(datum: XYDatum) => tooltipTemplate(slotProps.colors, datum)} />
                ) : null}
                {showTooltip ? (
                  <VisTooltip
                    triggers={{
                      [VisLineSelectors.line]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
                      [VisAreaSelectors.area]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
                      [VisGroupedBarSelectors.bar]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
                      [VisStackedBarSelectors.bar]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
                    }}
                    className="balsa-chart-tooltip"
                  />
                ) : null}
              </VisXYContainer>
            )}
            {normalizedType === "donut" && center ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                {center}
              </div>
            ) : null}
            {showLegend ? <ChartLegendContent className="mt-balsa-md" /> : null}
          </>
        )}
      </ChartContainer>
    </>
  );
}
