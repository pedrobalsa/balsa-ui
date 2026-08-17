import { ImageOff } from "lucide-react";
import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { GradientBackground } from "../ui/GradientBackground";
import { Icon } from "../ui/Icon";
import { Resizable } from "../ui/Resizable";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

/**
 * Before and after, with the divider between them.
 *
 * This is what Resizable is for: the reader decides how much of each to see,
 * and there is no correct split for the component to default to. The left side
 * keeps an explicit image placeholder because it stands for an asset that is
 * genuinely missing; the right is a palette gradient because it stands for one
 * that exists.
 */
export interface ImageCompareCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ImageCompareCard({
  title = "Before and after",
  description = "Drag the divider to compare the replacement against the original.",
  beforeLabel = "Original, not yet uploaded",
  afterLabel = "Proposed replacement",
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: ImageCompareCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="image-compare"
      action={<Badge variant="soft">Awaiting sign-off</Badge>}
    >
      <Resizable
        id="artwork-compare"
        defaultValue={50}
        label="Original against replacement"
        min={20}
        max={80}
        className="min-h-64 flex-1 grid-rows-1"
        first={
          <figure className="relative grid h-full place-items-center overflow-hidden bg-balsa-muted">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(135deg,transparent_25%,var(--balsa-color-border)_25%,var(--balsa-color-border)_50%,transparent_50%,transparent_75%,var(--balsa-color-border)_75%)] [background-size:2rem_2rem]" />
            <Icon icon={ImageOff} size="xl" className="relative text-balsa-muted-foreground" />
            <figcaption className="absolute inset-x-0 bottom-0 truncate bg-balsa-surface/80 px-balsa-md py-balsa-xs text-xs text-balsa-muted-foreground">
              {beforeLabel}
            </figcaption>
          </figure>
        }
        second={
          <figure className="relative h-full overflow-hidden bg-balsa-muted">
            <GradientBackground colorMode="palette" preset="aurora-veil" speed={0} className="absolute inset-0" />
            <figcaption className="absolute inset-x-0 bottom-0 truncate bg-balsa-surface/80 px-balsa-md py-balsa-xs text-xs text-balsa-muted-foreground">
              {afterLabel}
            </figcaption>
          </figure>
        }
      />
    </CompositionRoot>
  );
}
