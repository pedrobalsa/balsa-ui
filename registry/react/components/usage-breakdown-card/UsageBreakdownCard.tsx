import { type HTMLAttributes } from "react";
import { Charts } from "../ui/Charts";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface UsageSeries {
  label: string;
  data: readonly number[];
  color?: CompositionPaletteColor;
}

const defaultLabels: readonly string[] = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const defaultSeries: readonly UsageSeries[] = [
  { label: "Compute", data: [96, 104, 112, 119, 108, 121, 128, 141, 137, 162, 158, 174], color: "primary" },
  { label: "Bandwidth", data: [41, 46, 52, 63, 49, 58, 64, 71, 88, 74, 92, 96], color: "secondary" },
  { label: "Storage", data: [14, 15, 17, 18, 19, 21, 22, 24, 27, 29, 31, 35], color: "accent" },
];

/**
 * Stacked bars, because the question is where the spend went rather than how it
 * moved. Wide for the same reason the line chart is: a month per bar needs the
 * room, and squeezed into one unit the categories stop being comparable.
 */
export interface UsageBreakdownCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  labels?: readonly string[];
  series?: readonly UsageSeries[];
}

export function UsageBreakdownCard({
  title = "Where the spend goes",
  description = "Billed usage by category, last twelve months.",
  labels = defaultLabels,
  series = defaultSeries,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: UsageBreakdownCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="usage-breakdown"
    >
      <p className="flex items-baseline gap-balsa-xs">
        <strong className="text-2xl font-semibold tabular-nums">$305</strong>
        <span className="text-xs text-balsa-muted-foreground">this month, across compute, bandwidth and storage</span>
      </p>
      <div className="mt-balsa-md min-h-0">
        <Charts
          title="Monthly cost by category"
          labels={labels}
          series={series}
          type="bar"
          barMode="stacked"
          showLegend={false}
          showXAxis={false}
          showYAxis={false}
          showGrid={false}
          showCaption={false}
          height={160}
        />
      </div>
    </CompositionRoot>
  );
}
