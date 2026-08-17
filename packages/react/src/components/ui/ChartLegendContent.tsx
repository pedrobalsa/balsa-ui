import { mergeClasses } from "./classes";
import { Icon } from "./Icon";
import { useChart } from "./chart";

export interface ChartLegendContentProps {
  items?: readonly string[];
  className?: string;
}

export function ChartLegendContent({ items, className }: ChartLegendContentProps) {
  const chart = useChart();
  const keys = items ?? Object.keys(chart.config);

  return (
    <ul
      data-balsa="chart-legend"
      className={mergeClasses(
        "flex flex-wrap items-center justify-center gap-x-balsa-lg gap-y-balsa-xs text-xs text-balsa-chart-axis",
        className,
      )}
    >
      {keys.map((key, index) => {
        const item = chart.config[key];
        return (
          <li key={key} className="flex items-center gap-balsa-2xs">
            {item?.icon ? (
              <Icon icon={item.icon} size="xs" />
            ) : (
              <span
                className="h-2.5 w-2.5 rounded-[var(--balsa-chart-marker-radius)] border border-current"
                style={{
                  backgroundColor: chart.colors[key],
                  borderStyle: index % 3 === 1 ? "dashed" : "solid",
                }}
                aria-hidden="true"
              />
            )}
            <span>{item?.label ?? key}</span>
          </li>
        );
      })}
    </ul>
  );
}
