import { type HTMLAttributes } from "react";
import { Skeleton } from "../ui/Skeleton";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface LoadingStateCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  rows?: number;
}

export function LoadingStateCard({
  title = "Loading activity",
  description = "Fetching the latest workspace events.",
  rows = 4,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: LoadingStateCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="loading-state"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <div className="grid flex-1 content-between gap-balsa-lg">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-balsa-md">
            <Skeleton className="size-10 rounded-balsa-control" />
            <div className="grid gap-balsa-xs">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </CompositionRoot>
  );
}
