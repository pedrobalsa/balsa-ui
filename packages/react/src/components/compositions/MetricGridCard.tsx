import { type HTMLAttributes } from "react";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionMetric, CompositionSurfaceProps } from "./composition";

const defaultMetrics: readonly CompositionMetric[] = [
  { label: "Deployments", value: "128", detail: "+12 this week" },
  { label: "Uptime", value: "99.99%", detail: "30 day window" },
  { label: "Members", value: "24", detail: "3 online" },
  { label: "Regions", value: "6", detail: "Global coverage" },
  { label: "Build time", value: "42s", detail: "median" },
  { label: "Error rate", value: "0.04%", detail: "last 24 hours" },
  { label: "Requests", value: "8.1M", detail: "this week" },
  { label: "Rollbacks", value: "2", detail: "this quarter" },
];

export interface MetricGridCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  metrics?: readonly CompositionMetric[];
}

export function MetricGridCard({
  title = "Workspace metrics",
  description = "Current operational snapshot.",
  metrics = defaultMetrics,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: MetricGridCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="metric-grid"
    >
      <dl className="grid flex-1 grid-cols-2 gap-px sm:grid-cols-4 overflow-hidden rounded-balsa-control bg-balsa-border">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-balsa-surface p-balsa-lg">
            <dt className="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">{metric.label}</dt>
            <dd className="mt-balsa-xs text-2xl font-semibold tabular-nums">{metric.value}</dd>
            {metric.detail ? (
              <p className="mt-balsa-3xs text-xs text-balsa-muted-foreground">{metric.detail}</p>
            ) : null}
          </div>
        ))}
      </dl>
    </CompositionRoot>
  );
}
