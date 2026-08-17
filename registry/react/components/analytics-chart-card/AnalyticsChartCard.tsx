import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Charts } from "../ui/Charts";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface CompositionChartSeries {
  label: string;
  data: readonly number[];
  color?: CompositionPaletteColor;
}

const defaultLabels: readonly string[] = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"];
const defaultSeries: readonly CompositionChartSeries[] = [
  { label: "p95", data: [268, 251, 244, 226, 231, 209, 198, 186], color: "primary" },
];

export interface AnalyticsChartCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  delta?: string;
  labels?: readonly string[];
  series?: readonly CompositionChartSeries[];
}

export function AnalyticsChartCard({
  title = "Request latency",
  description = "p95 across every region",
  delta = "-18%",
  labels = defaultLabels,
  series = defaultSeries,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: AnalyticsChartCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="analytics-chart"
      action={<Badge color="accent" variant="soft">{delta}</Badge>}
    >
      <p className="flex items-baseline gap-balsa-xs">
        <strong className="text-2xl font-semibold tabular-nums">186 ms</strong>
        <span className="text-xs text-balsa-muted-foreground">p95, down from 268 ms</span>
      </p>
      <div className="min-h-0">
        <Charts
          title="Milliseconds per request"
          labels={labels}
          series={series}
          type="area"
          showLegend={false}
          showXAxis={false}
          showYAxis={false}
          showGrid={false}
          showCaption={false}
          height={196}
        />
      </div>
    </CompositionRoot>
  );
}
