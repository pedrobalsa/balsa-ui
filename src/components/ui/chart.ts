import { inject, type InjectionKey, type Ref } from "vue";
import type { IconComponent } from "./Icon.vue";
import type { SemanticColor } from "./types";

export type ChartPaletteRole = SemanticColor | "neutral";

export interface ChartConfigItem {
  label: string;
  color?: ChartPaletteRole;
  icon?: IconComponent;
}

export type ChartConfig = Record<string, ChartConfigItem>;

export interface ChartTableSeries {
  key: string;
  label: string;
  data: readonly number[];
}

export interface ChartContextValue {
  config: Readonly<ChartConfig>;
  colors: Ref<Readonly<Record<string, string>>>;
  reducedMotion: Ref<boolean>;
}

export const chartContextKey: InjectionKey<ChartContextValue> = Symbol("balsa-chart");

export function useChart(): ChartContextValue {
  const context = inject(chartContextKey);
  if (!context) throw new Error("Chart components must be used inside ChartContainer.");
  return context;
}

interface Rgb {
  red: number;
  green: number;
  blue: number;
}

function parseColor(value: string): Rgb | undefined {
  const hex = value.trim().match(/^#([\da-f]{6})$/i)?.[1];
  if (hex) {
    return {
      red: Number.parseInt(hex.slice(0, 2), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      blue: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  const rgb = value.trim().match(/^rgba?\(([-\d.]+)[, ]+([-\d.]+)[, ]+([-\d.]+)/i);
  if (!rgb) return undefined;
  return { red: Number(rgb[1]), green: Number(rgb[2]), blue: Number(rgb[3]) };
}

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrast(first: Rgb, second: Rgb): number {
  const luminance = (color: Rgb) => 0.2126 * channel(color.red) + 0.7152 * channel(color.green) + 0.0722 * channel(color.blue);
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function mix(first: Rgb, second: Rgb, amount: number): Rgb {
  return {
    red: Math.round(first.red + (second.red - first.red) * amount),
    green: Math.round(first.green + (second.green - first.green) * amount),
    blue: Math.round(first.blue + (second.blue - first.blue) * amount),
  };
}

function serialize(color: Rgb): string {
  return `rgb(${color.red} ${color.green} ${color.blue})`;
}

export function ensureChartContrast(colorValue: string, surfaceValue: string, foregroundValue: string, minimum: 3 | 4.5): string {
  const color = parseColor(colorValue);
  const surface = parseColor(surfaceValue);
  const foreground = parseColor(foregroundValue);
  if (!color || !surface || !foreground || contrast(color, surface) >= minimum) return colorValue;

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const middle = (low + high) / 2;
    if (contrast(mix(color, foreground, middle), surface) >= minimum) high = middle;
    else low = middle;
  }
  return serialize(mix(color, foreground, high));
}
