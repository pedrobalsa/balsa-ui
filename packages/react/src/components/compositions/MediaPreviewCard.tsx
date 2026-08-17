import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { GradientBackground } from "../ui/GradientBackground";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface MediaPreviewCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  status?: string;
  statusColor?: CompositionPaletteColor;
  actionLabel?: string;
  onAction?: () => void;
}

export function MediaPreviewCard({
  title = "Preview build",
  description = "What visitors see at relay-preview.example.com.",
  status = "Awaiting review",
  statusColor = "secondary",
  actionLabel = "Open the preview",
  headingLevel,
  shadow,
  theme,
  onAction,
  "data-balsa": _dataBalsa,
  ...domProps
}: MediaPreviewCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="media-preview"
      action={<Badge color={statusColor} variant="soft">{status}</Badge>}
      footer={
        <Button className="w-full" variant="soft" onClick={onAction}>
          {actionLabel}
        </Button>
      }
    >
      {/*
        A captured page is imagery, so the stand-in is imagery too: a palette-mode
        gradient reads as a rendered screen and answers to the palette being
        edited, where a checkerboard only ever reads as "no image here". The
        checkerboard belongs on surfaces that genuinely have nothing yet.
      */}
      <div className="relative min-h-80 flex-1 overflow-hidden rounded-balsa-panel border border-balsa-border bg-balsa-muted">
        <GradientBackground
          colorMode="palette"
          preset="mesh-drift"
          speed={0}
          className="absolute inset-0"
        />
      </div>
      <dl className="mt-balsa-lg divide-y divide-balsa-border text-sm">
        <div className="flex justify-between py-balsa-sm">
          <dt className="text-balsa-muted-foreground">Captured at</dt>
          <dd className="tabular-nums">1440 × 900</dd>
        </div>
        <div className="flex justify-between py-balsa-sm">
          <dt className="text-balsa-muted-foreground">Commit</dt>
          <dd className="tabular-nums">a41c9f2</dd>
        </div>
        <div className="flex justify-between py-balsa-sm">
          <dt className="text-balsa-muted-foreground">Built</dt>
          <dd>4 minutes ago</dd>
        </div>
      </dl>
    </CompositionRoot>
  );
}
