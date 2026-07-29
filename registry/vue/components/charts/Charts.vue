<script setup lang="ts">
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from "chart.js";
import { Chart } from "vue-chartjs";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";
import Spinner from "./Spinner.vue";
import type { Rounded } from "./form";
import type { SemanticColor } from "./types";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export type ChartsType = "line" | "bar" | "doughnut";
export interface ChartSeries {
  label: string;
  data: readonly number[];
  color?: SemanticColor;
}

const defaultColors: readonly SemanticColor[] = ["primary", "secondary", "accent", "success", "warning", "info", "destructive"];

const roundedChartRadii: Readonly<Record<Rounded, number>> = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: Number.MAX_VALUE,
};

const rawProps = withDefaults(defineProps<{
  title: string;
  description?: string;
  type?: ChartsType;
  labels: readonly string[];
  series: readonly ChartSeries[];
  colors?: readonly SemanticColor[];
  loading?: boolean;
  error?: string;
  emptyText?: string;
  showLegend?: boolean;
  showTable?: boolean;
  responsive?: boolean;
  width?: number;
  height?: number;
  rounded?: Rounded;
  theme?: ThemeInput;
}>(), {
  type: "bar",
  loading: false,
  emptyText: "No chart data.",
  showLegend: true,
  showTable: false,
  responsive: true,
});
const { props, theme } = useResolvedThemeProps(
  "charts",
  "surfaces",
  rawProps,
  { rounded: "lg" } as const,
);
const root = ref<HTMLElement | null>(null);
const paletteVersion = ref(0);
let observer: MutationObserver | undefined;
type ChartColorToken = SemanticColor | "foreground" | "muted-foreground" | "border" | "surface";
function colorFor(role: ChartColorToken): string {
  void paletteVersion.value;
  const value = root.value ? getComputedStyle(root.value).getPropertyValue(`--balsa-color-${role}`).trim() : "";
  return value || "currentColor";
}
const chartType = computed<ChartType>(() => props.type);
const empty = computed(() => !props.series.length || !props.labels.length || props.series.every((series) => !series.data.length));
const chartRadius = computed(() => roundedChartRadii[props.rounded]);
const palette = computed(() => props.colors?.length ? props.colors : defaultColors);
const chartWidth = computed(() => props.width === undefined ? undefined : Math.max(1, props.width));
const chartHeight = computed(() => props.height === undefined ? undefined : Math.max(1, props.height));
const data = computed<ChartData>(() => ({
  labels: [...props.labels],
  datasets: props.series.map((series, index) => {
    const color = colorFor(series.color ?? palette.value[index % palette.value.length] ?? defaultColors[index % defaultColors.length]!);
    return {
      label: series.label,
      data: [...series.data],
      borderColor: color,
      backgroundColor: props.type === "line" ? `color-mix(in oklab, ${color} 22%, transparent)` : color,
      borderWidth: props.type === "doughnut" ? 2 : props.type === "line" ? 2 : 0,
      ...(props.type === "doughnut" ? { borderColor: colorFor("surface"), borderRadius: chartRadius.value } : {}),
      ...(props.type === "bar" ? { borderRadius: chartRadius.value, borderSkipped: false } : {}),
      tension: 0.3,
      fill: props.type === "line",
    };
  }),
}));
const options = computed<ChartOptions>(() => ({
  responsive: props.responsive,
  maintainAspectRatio: chartHeight.value === undefined,
  animation: typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : undefined,
  plugins: {
    legend: { display: props.showLegend, labels: { color: colorFor("foreground") } },
    title: { display: false },
  },
  scales: props.type === "doughnut" ? undefined : {
    x: { ticks: { color: colorFor("muted-foreground") }, grid: { color: `color-mix(in oklab, ${colorFor("border")} 60%, transparent)` } },
    y: { beginAtZero: true, ticks: { color: colorFor("muted-foreground") }, grid: { color: `color-mix(in oklab, ${colorFor("border")} 60%, transparent)` } },
  },
}));
const chartStyle = computed<CSSProperties>(() => ({
  ...(chartWidth.value === undefined ? {} : { width: `${chartWidth.value}px`, maxWidth: props.responsive ? "100%" : undefined }),
  ...(chartHeight.value === undefined ? {} : { height: `${chartHeight.value}px` }),
}));
const tableClasses = computed(() => props.showTable ? "mt-5 overflow-x-auto" : "sr-only");
onMounted(async () => {
  await nextTick();
  paletteVersion.value += 1;
  observer = new MutationObserver(() => { paletteVersion.value += 1; });
  let context: HTMLElement | null = root.value;
  while (context) {
    observer.observe(context, {
      attributes: true,
      attributeFilter: ["style", "class", "data-palette", "data-theme"],
    });
    context = context.parentElement;
  }
});
onBeforeUnmount(() => observer?.disconnect());
watch(() => props.theme, () => { paletteVersion.value += 1; });
</script>

<template>
  <figure
    ref="root"
    data-balsa="charts"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-type="props.type"
    :data-responsive="props.responsive"
    class="text-balsa-foreground"
    :style="theme.explicitPresentation.value?.style"
  >
    <figcaption>
      <h3>{{ props.title }}</h3>
      <p v-if="props.description" class="mt-1 text-sm text-balsa-muted-foreground">{{ props.description }}</p>
    </figcaption>
    <div v-if="props.loading" :style="chartStyle" class="grid place-items-center" aria-busy="true">
      <Spinner label="Loading chart" />
    </div>
    <div v-else-if="props.error" :style="chartStyle" class="grid place-items-center text-center text-balsa-destructive" role="alert">{{ props.error }}</div>
    <div v-else-if="empty" :style="chartStyle" class="grid place-items-center text-center text-balsa-muted-foreground">{{ props.emptyText }}</div>
    <div v-else :style="chartStyle" class="mt-4">
      <Chart :key="props.type" :type="chartType" :data="data" :options="options" :width="chartWidth" :height="chartHeight" aria-hidden="true" />
    </div>
    <div :class="tableClasses">
      <table>
        <caption>{{ props.title }} data</caption>
        <thead><tr><th scope="col">Category</th><th v-for="item in props.series" :key="item.label" scope="col">{{ item.label }}</th></tr></thead>
        <tbody><tr v-for="(label, index) in props.labels" :key="label"><th scope="row">{{ label }}</th><td v-for="item in props.series" :key="item.label">{{ item.data[index] ?? "—" }}</td></tr></tbody>
      </table>
    </div>
  </figure>
</template>
