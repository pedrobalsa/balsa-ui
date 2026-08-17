import { Icon } from "./Icon";
import { useChart } from "./chart";

export interface ChartTooltipItem {
  key: string;
  value: string;
}

export interface ChartTooltipContentProps {
  label?: string;
  items: readonly ChartTooltipItem[];
}

export function ChartTooltipContent({ label, items }: ChartTooltipContentProps) {
  const chart = useChart();

  return (
    <div
      data-balsa="chart-tooltip-content"
      className="min-w-36 rounded-balsa-control border bg-balsa-chart-tooltip p-balsa-sm text-xs text-balsa-chart-tooltip-foreground shadow-balsa-overlay"
    >
      {label ? (
        <p className="mb-balsa-xs font-medium text-balsa-muted-foreground">{label}</p>
      ) : null}
      {items.map((item) => {
        const configItem = chart.config[item.key];
        return (
          <div key={item.key} className="flex items-center gap-balsa-xs py-balsa-4xs">
            {configItem?.icon ? (
              <Icon icon={configItem.icon} size="xs" />
            ) : (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: chart.colors[item.key] }}
                aria-hidden="true"
              />
            )}
            <span className="text-balsa-muted-foreground">{configItem?.label ?? item.key}</span>
            <span className="ml-auto font-mono font-semibold tabular-nums">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
