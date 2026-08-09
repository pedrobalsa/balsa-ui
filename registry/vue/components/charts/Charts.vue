<script setup lang="ts">
defineOptions({ name: "BalsaCharts" });

import { computed } from "vue";
import { VisArea, VisAreaSelectors, VisAxis, VisDonut, VisDonutSelectors, VisGroupedBar, VisGroupedBarSelectors, VisLine, VisLineSelectors, VisSingleContainer, VisStackedBar, VisStackedBarSelectors, VisTooltip, VisXYContainer } from "@unovis/vue";
import { CurveType } from "@unovis/ts";
import ChartContainer from "./ChartContainer.vue";
import ChartCrosshair from "./ChartCrosshair.vue";
import ChartLegendContent from "./ChartLegendContent.vue";
import type { ChartConfig, ChartPaletteRole, ChartTableSeries } from "./chart";
import type { IconComponent } from "./Icon.vue";
import type { Rounded } from "./form";
import type { SemanticColor } from "./types";
import type { ThemeInput } from "./theme";

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

const props = withDefaults(defineProps<{
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
  /** How the band under an area series is painted. */
  areaFill?: ChartsAreaFill;
  width?: number;
  height?: number;
  rounded?: Rounded;
  labelFormatter?: (label: string, index: number) => string;
  valueFormatter?: (value: number, series: ChartSeries, index: number) => string;
  theme?: ThemeInput;
}>(), {
  type: "bar",
  barMode: "grouped",
  loading: false,
  emptyText: "No chart data.",
  showGrid: true,
  showXAxis: true,
  showYAxis: true,
  showTooltip: true,
  showLegend: true,
  showCaption: true,
  showTable: false,
  responsive: true,
  areaFill: "gradient",
  height: 260,
  labelFormatter: (label: string) => label,
  valueFormatter: (value: number) => new Intl.NumberFormat().format(value),
});

const defaultRoles: readonly ChartPaletteRole[] = ["primary", "secondary", "accent", "neutral"];
const normalizedType = computed(() => props.type === "doughnut" ? "donut" : props.type);
const seriesKeys = computed(() => props.series.map((series, index) => series.key ?? `series-${index}`));
const config = computed<ChartConfig>(() => {
  if (props.config) return props.config;
  if (normalizedType.value === "donut") {
    return Object.fromEntries(props.labels.map((label, index) => [
      `segment-${index}`,
      {
        label: props.labelFormatter(label, index),
        color: props.series[0]?.color ?? props.colors?.[index % (props.colors.length || 1)] ?? defaultRoles[index % defaultRoles.length],
        icon: props.series[0]?.icon,
      },
    ]));
  }
  return Object.fromEntries(props.series.map((series, index) => [
    seriesKeys.value[index]!,
    {
      label: series.label,
      color: series.color ?? props.colors?.[index % (props.colors.length || 1)] ?? defaultRoles[index % defaultRoles.length],
      icon: series.icon,
    },
  ]));
});
const tableSeries = computed<ChartTableSeries[]>(() => props.series.map((series, index) => ({ key: seriesKeys.value[index]!, label: series.label, data: series.data })));
const empty = computed(() => !props.series.length || !props.labels.length || props.series.every((series) => !series.data.length));
const xyData = computed<XYDatum[]>(() => props.labels.map((label, index) => ({
  index,
  label,
  values: props.series.map((series) => series.data[index] ?? 0),
})));
const x = (datum: XYDatum) => datum.index;
const y = computed(() => props.series.map((_, seriesIndex) => (datum: XYDatum) => datum.values[seriesIndex] ?? 0));
const labelTick = (tick: number | Date) => {
  const index = typeof tick === "number" ? Math.round(tick) : 0;
  return props.labelFormatter(props.labels[index] ?? "", index);
};
const valueTick = (tick: number | Date) => props.valueFormatter(Number(tick), props.series[0] ?? { label: "Value", data: [] }, 0);
const tableValueFormatter = (value: number, series: ChartTableSeries, index: number) => props.valueFormatter(
  value,
  props.series.find((item, seriesIndex) => (item.key ?? `series-${seriesIndex}`) === series.key) ?? { label: series.label, data: series.data },
  index,
);
const cornerRadius = computed(() => ({ none: 0, sm: 2, md: 4, lg: 6, xl: 8, "2xl": 12, "3xl": 16, full: 9999 } satisfies Record<Rounded, number>)[props.rounded ?? "lg"]);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function tooltipTemplate(colors: Readonly<Record<string, string>>, datum: XYDatum): string {
  const rows = props.series.map((series, index) => `<div class="balsa-chart-tooltip-row"><span class="balsa-chart-tooltip-marker" style="background:${escapeHtml(colors[seriesKeys.value[index]!] ?? "currentColor")}"></span><span>${escapeHtml(series.label)}</span><strong>${escapeHtml(props.valueFormatter(datum.values[index] ?? 0, series, datum.index))}</strong></div>`).join("");
  return `<div class="balsa-chart-tooltip-content"><div class="balsa-chart-tooltip-label">${escapeHtml(props.labelFormatter(datum.label, datum.index))}</div>${rows}</div>`;
}

function colorsArray(colors: Readonly<Record<string, string>>): string[] {
  return seriesKeys.value.map((key) => colors[key] ?? "currentColor");
}
function dashArray(_: XYDatum[], index: number): number[] {
  return index % 3 === 1 ? [7, 4] : index % 3 === 2 ? [2, 4] : [];
}
const areaFillOpacity: Readonly<Record<ChartsAreaFill, readonly [number, number]>> = {
  gradient: [0.5, 0.02],
  solid: [0.24, 0.24],
  none: [0, 0],
};

function areaDefs(colors: Readonly<Record<string, string>>): string {
  const [top, bottom] = areaFillOpacity[props.areaFill];
  return seriesKeys.value.map((key, index) => {
    const color = escapeHtml(colors[key] ?? "currentColor");
    return `<linearGradient id="balsa-area-${index}" x1="0" x2="0" y1="0" y2="1">`
      + `<stop offset="0%" stop-color="${color}" stop-opacity="${top}"/>`
      + `<stop offset="100%" stop-color="${color}" stop-opacity="${bottom}"/>`
      + `</linearGradient>`;
  }).join("");
}
function donutData(colors: Readonly<Record<string, string>>): DonutDatum[] {
  const source = props.series[0];
  return props.labels.map((label, index) => ({
    key: `segment-${index}`,
    label,
    value: source?.data[index] ?? 0,
    color: colors[`segment-${index}`] ?? "currentColor",
  }));
}
function donutTooltip(datum: DonutDatum): string {
  const source = props.series[0] ?? { label: "Value", data: [] };
  return `<div class="balsa-chart-tooltip-content"><div class="balsa-chart-tooltip-row"><span class="balsa-chart-tooltip-marker" style="background:${escapeHtml(datum.color)}"></span><span>${escapeHtml(datum.label)}</span><strong>${escapeHtml(props.valueFormatter(datum.value, source, props.labels.indexOf(datum.label)))}</strong></div></div>`;
}
</script>

<template>
  <ChartContainer
    data-balsa="charts"
    :title="props.title"
    :description="props.description"
    :config="config"
    :labels="props.labels"
    :table-series="tableSeries"
    :loading="props.loading"
    :error="props.error"
    :empty="empty"
    :empty-text="props.emptyText"
    :show-caption="props.showCaption"
    :show-table="props.showTable"
    :label-formatter="props.labelFormatter"
    :value-formatter="tableValueFormatter"
    :responsive="props.responsive"
    :width="props.width"
    :height="props.height"
    :rounded="props.rounded"
    :theme="props.theme"
    :data-type="normalizedType"
    :data-bar-mode="props.barMode"
  >
    <template #default="slotProps">
      <VisSingleContainer
        v-if="normalizedType === 'donut'"
        :data="donutData(slotProps.colors)"
        :width="slotProps.width"
        :height="slotProps.height"
        :duration="slotProps.reducedMotion ? 0 : undefined"
        :aria-label="props.title"
        class="balsa-chart-plot"
      >
        <VisDonut
          :value="(datum: DonutDatum) => datum.value"
          :color="(datum: DonutDatum) => datum.color"
          :pad-angle="0.025"
          :corner-radius="Math.min(cornerRadius, 8)"
          :arc-width="28"
        />
        <VisTooltip v-if="props.showTooltip" :triggers="{ [VisDonutSelectors.segment]: donutTooltip }" class-name="balsa-chart-tooltip" />
      </VisSingleContainer>
      <VisXYContainer
        v-else
        :data="xyData"
        :width="slotProps.width"
        :height="slotProps.height"
        :duration="slotProps.reducedMotion ? 0 : undefined"
        :svg-defs="normalizedType === 'area' ? areaDefs(slotProps.colors) : undefined"
        :y-domain="[0, undefined]"
        :aria-label="props.title"
        class="balsa-chart-plot"
      >
        <VisLine
          v-if="normalizedType === 'line'"
          :x="x"
          :y="y"
          :color="colorsArray(slotProps.colors)"
          :line-width="2"
          :curve-type="CurveType.MonotoneX"
          :line-dash-array="dashArray"
          highlight-on-hover
        />
        <VisArea
          v-else-if="normalizedType === 'area'"
          :x="x"
          :y="y"
          :color="seriesKeys.map((_, index) => `url(#balsa-area-${index})`)"
          :line-color="colorsArray(slotProps.colors)"
          :line-dash-array="dashArray"
          :line-width="2"
          :curve-type="CurveType.MonotoneX"
          line
        />
        <VisGroupedBar
          v-else-if="props.barMode === 'grouped'"
          :x="x"
          :y="y"
          :color="colorsArray(slotProps.colors)"
          :group-padding="0.18"
          :bar-padding="0.08"
          :rounded-corners="cornerRadius"
        />
        <VisStackedBar
          v-else
          :x="x"
          :y="y"
          :color="colorsArray(slotProps.colors)"
          :bar-padding="0.22"
          :rounded-corners="cornerRadius"
        />
        <VisAxis v-if="props.showXAxis" type="x" :grid-line="false" :domain-line="false" :tick-line="false" :tick-format="labelTick" :num-ticks="props.labels.length" />
        <VisAxis v-if="props.showYAxis" type="y" :grid-line="props.showGrid" :domain-line="false" :tick-line="false" :tick-format="valueTick" />
        <ChartCrosshair v-if="props.showTooltip" :x="x" :y="y" :template="(datum: XYDatum) => tooltipTemplate(slotProps.colors, datum)" />
        <VisTooltip
          v-if="props.showTooltip"
          :triggers="{
          [VisLineSelectors.line]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
          [VisAreaSelectors.area]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
          [VisGroupedBarSelectors.bar]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
          [VisStackedBarSelectors.bar]: (datum: XYDatum) => tooltipTemplate(slotProps.colors, datum),
        }" class-name="balsa-chart-tooltip" />
      </VisXYContainer>
      <div v-if="normalizedType === 'donut' && $slots.center" class="pointer-events-none absolute inset-0 grid place-items-center">
        <slot name="center" />
      </div>
      <ChartLegendContent v-if="props.showLegend" class="mt-balsa-md" />
    </template>
  </ChartContainer>
</template>

<!--
  Unovis lays its containers out from a stylesheet its entry injects at import
  time, but `@unovis/vue` ships `sideEffects: false`, so a production bundler
  drops that injection as dead code while a dev server keeps it. The plot then
  falls back to its intrinsic width in built apps only. Owning the two rules the
  containers actually need keeps the chart the same size in both, and keeps it
  independent of how a consuming app is bundled.
-->
<style>
.balsa-chart-plot {
  display: block;
  position: relative;
  width: 100%;
}
</style>
