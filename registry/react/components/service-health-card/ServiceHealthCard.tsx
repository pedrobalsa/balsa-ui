import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface ServiceStatus {
  id: string;
  region: string;
  state: string;
  latency: string;
  color?: CompositionPaletteColor;
}

const defaultRegions: readonly ServiceStatus[] = [
  { id: "iad", region: "Washington", state: "Healthy", latency: "18 ms", color: "primary" },
  { id: "fra", region: "Frankfurt", state: "Healthy", latency: "24 ms", color: "primary" },
  { id: "gru", region: "São Paulo", state: "Degraded", latency: "96 ms", color: "secondary" },
  { id: "syd", region: "Sydney", state: "Healthy", latency: "41 ms", color: "primary" },
];

export interface ServiceHealthCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  regions?: readonly ServiceStatus[];
}

export function ServiceHealthCard({
  title = "Regional health",
  description = "Every edge, right now.",
  regions = defaultRegions,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: ServiceHealthCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="service-health"
    >
      <ul className="grid flex-1 grid-cols-2 content-center gap-balsa-md sm:grid-cols-4" role="list">
        {regions.map((region) => (
          <li key={region.id} className="min-w-0">
            <strong className="block truncate text-sm font-medium">{region.region}</strong>
            <span className="mt-balsa-3xs flex items-center gap-balsa-xs">
              <Badge color={region.color} variant="soft">{region.state}</Badge>
              <span className="text-xs tabular-nums text-balsa-muted-foreground">{region.latency}</span>
            </span>
          </li>
        ))}
      </ul>
    </CompositionRoot>
  );
}
