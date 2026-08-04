<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch, type CSSProperties } from "vue";
import Spinner from "./Spinner.vue";
import type { Rounded } from "./form";
import type { ThemeInput } from "./theme";
import { useResolvedThemeProps } from "./theme-context";
import { chartContextKey, ensureChartContrast, type ChartConfig, type ChartPaletteRole, type ChartTableSeries } from "./chart";

const defaultRoles: readonly ChartPaletteRole[] = ["primary", "secondary", "accent", "neutral"];

const rawProps = withDefaults(defineProps<{
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
}>(), {
  labels: () => [],
  tableSeries: () => [],
  loading: false,
  empty: false,
  emptyText: "No chart data.",
  showTable: false,
  showCaption: true,
  responsive: true,
  height: 260,
  labelFormatter: (label: string) => label,
  valueFormatter: (value: number) => new Intl.NumberFormat().format(value),
});

const { props, theme } = useResolvedThemeProps("charts", "surfaces", rawProps, { rounded: "lg" } as const);
const root = ref<HTMLElement | null>(null);
const plot = ref<HTMLElement | null>(null);
const measuredWidth = ref(0);
const paletteVersion = ref(0);
const reducedMotion = ref(false);
let resizeObserver: ResizeObserver | undefined;
let mutationObserver: MutationObserver | undefined;
let media: MediaQueryList | undefined;

const resolvedWidth = computed(() => props.width ?? measuredWidth.value);
const resolvedHeight = computed(() => Math.max(0, props.height));
const renderable = computed(() => resolvedWidth.value > 0 && resolvedHeight.value > 0);
const chartStyle = computed<CSSProperties>(() => ({
  height: `${resolvedHeight.value}px`,
  ...(props.width === undefined ? {} : { width: `${Math.max(0, props.width)}px`, maxWidth: props.responsive ? "100%" : undefined }),
}));
const tableClasses = computed(() => props.showTable ? "mt-5 overflow-x-auto" : "sr-only");

function token(role: ChartPaletteRole): string {
  if (role === "neutral") return "foreground";
  return role;
}

const colors = computed<Readonly<Record<string, string>>>(() => {
  void paletteVersion.value;
  if (!root.value) return Object.fromEntries(Object.keys(props.config).map((key) => [key, "currentColor"]));
  const styles = getComputedStyle(root.value);
  const surface = styles.getPropertyValue("--balsa-color-chart-surface").trim() || styles.getPropertyValue("--balsa-color-surface").trim();
  const foreground = styles.getPropertyValue("--balsa-color-chart-axis").trim() || styles.getPropertyValue("--balsa-color-surface-foreground").trim();
  return Object.fromEntries(Object.entries(props.config).map(([key, item], index) => {
    const role = item.color ?? defaultRoles[index % defaultRoles.length]!;
    const source = styles.getPropertyValue(`--balsa-color-${token(role)}`).trim() || foreground || "currentColor";
    return [key, ensureChartContrast(source, surface, foreground, 3)];
  }));
});

provide(chartContextKey, {
  get config() {
    return props.config;
  },
  colors,
  reducedMotion,
});

function refreshWidth(): void {
  measuredWidth.value = plot.value?.getBoundingClientRect().width ?? 0;
}

function refreshMotion(): void {
  reducedMotion.value = media?.matches ?? false;
}

onMounted(async () => {
  await nextTick();
  refreshWidth();
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(refreshWidth);
    if (plot.value) resizeObserver.observe(plot.value);
  }
  if (typeof MutationObserver !== "undefined") {
    mutationObserver = new MutationObserver(() => { paletteVersion.value += 1; });
    let context: HTMLElement | null = root.value;
    while (context) {
      mutationObserver.observe(context, { attributes: true, attributeFilter: ["style", "class", "data-palette", "data-theme", "data-theme-base"] });
      context = context.parentElement;
    }
  }
  if (typeof window.matchMedia === "function") {
    media = window.matchMedia("(prefers-reduced-motion: reduce)");
    refreshMotion();
    media.addEventListener("change", refreshMotion);
  }
  paletteVersion.value += 1;
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
  media?.removeEventListener("change", refreshMotion);
});

watch(() => props.theme, () => { paletteVersion.value += 1; });
</script>

<template>
  <figure
    ref="root"
    data-balsa="chart-container"
    :data-theme="theme.explicitPresentation.value?.id"
    :data-theme-base="theme.explicitPresentation.value?.base"
    :data-responsive="props.responsive"
    class="text-balsa-foreground"
    :style="theme.explicitPresentation.value?.style"
  >
    <figcaption :class="{ 'sr-only': !props.showCaption }">
      <!-- A chart usually sits inside a titled surface, so its caption stays
           subordinate to that surface title rather than taking the h3 display size. -->
      <h3 class="text-sm font-semibold leading-snug">{{ props.title }}</h3>
      <p v-if="props.description" class="mt-1 text-xs text-balsa-muted-foreground">{{ props.description }}</p>
    </figcaption>
    <div v-if="props.loading" :style="chartStyle" class="grid place-items-center" aria-busy="true">
      <Spinner label="Loading chart" />
    </div>
    <div v-else-if="props.error" :style="chartStyle" class="grid place-items-center text-center text-balsa-destructive" role="alert">{{ props.error }}</div>
    <div v-else-if="props.empty" :style="chartStyle" class="grid place-items-center text-center text-balsa-muted-foreground">{{ props.emptyText }}</div>
    <div v-else ref="plot" :style="chartStyle" class="mt-4 min-w-0" aria-hidden="true">
      <slot v-if="renderable" :width="resolvedWidth" :height="resolvedHeight" :colors="colors" :reduced-motion="reducedMotion" />
    </div>
    <div :class="tableClasses">
      <table class="w-full text-left text-sm tabular-nums">
        <caption>{{ props.title }} data</caption>
        <thead><tr><th scope="col">Category</th><th v-for="item in props.tableSeries" :key="item.key" scope="col">{{ item.label }}</th></tr></thead>
        <tbody><tr v-for="(label, index) in props.labels" :key="`${label}-${index}`"><th scope="row">{{ props.labelFormatter(label, index) }}</th><td v-for="item in props.tableSeries" :key="item.key">{{ item.data[index] === undefined ? "—" : props.valueFormatter(item.data[index], item, index) }}</td></tr></tbody>
      </table>
    </div>
  </figure>
</template>
