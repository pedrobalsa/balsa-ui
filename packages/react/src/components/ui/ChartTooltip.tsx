import { VisTooltip } from "@unovis/react";
import type { TooltipConfigInterface } from "@unovis/ts";

export type ChartTooltipProps = Pick<
  TooltipConfigInterface,
  "triggers" | "followCursor" | "allowHover" | "showDelay" | "hideDelay"
>;

export function ChartTooltip(props: ChartTooltipProps) {
  return <VisTooltip {...props} className="balsa-chart-tooltip" />;
}
