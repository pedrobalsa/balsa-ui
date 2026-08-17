import { type HTMLAttributes } from "react";
import { Progress } from "../ui/Progress";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface StorageUsageCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  used?: string;
  included?: string;
  percent?: number;
}

export function StorageUsageCard({
  title = "Object storage",
  description,
  used = "612 GB",
  included = "of 1 TB included",
  percent = 61,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: StorageUsageCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="storage-usage"
    >
      <p className="flex items-baseline gap-balsa-xs">
        <strong className="text-2xl font-semibold tabular-nums">{used}</strong>
        <span className="text-xs text-balsa-muted-foreground">{included}</span>
      </p>
      <Progress className="mt-balsa-md" label="Storage used" value={percent} color="primary" />
    </CompositionRoot>
  );
}
