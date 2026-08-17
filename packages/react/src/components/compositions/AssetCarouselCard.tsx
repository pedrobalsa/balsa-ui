import { type HTMLAttributes } from "react";
import { Badge } from "../ui/Badge";
import { Carousel, type CarouselItem } from "../ui/Carousel";
import { GradientBackground } from "../ui/GradientBackground";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface AssetSlide extends CarouselItem {
  caption: string;
  preset: "mesh-drift" | "aurora-veil" | "silver-dunes" | "solar-bloom";
}

/**
 * Captured screens, stood in for by palette-mode gradients: the placeholder is
 * imagery rather than an "image missing" mark, so it reads as the artwork this
 * carousel is for and follows the palette being edited.
 */
const defaultSlides: readonly AssetSlide[] = [
  { id: "hero", label: "Hero banner", caption: "2560 × 1440 · approved", preset: "mesh-drift" },
  { id: "social", label: "Social card", caption: "1200 × 630 · in review", preset: "aurora-veil" },
  { id: "email", label: "Email header", caption: "1080 × 400 · approved", preset: "silver-dunes" },
  { id: "docs", label: "Docs cover", caption: "1600 × 900 · draft", preset: "solar-bloom" },
];

export interface AssetCarouselCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  slides?: readonly AssetSlide[];
}

export function AssetCarouselCard({
  title = "Launch artwork",
  description = "Every asset queued for the Atlas announcement.",
  slides = defaultSlides,
  headingLevel,
  shadow,
  theme,
  "data-balsa": _dataBalsa,
  ...domProps
}: AssetCarouselCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="asset-carousel"
      action={<Badge variant="soft">4 assets</Badge>}
    >
      <Carousel
        label="Launch artwork"
        items={slides}
        slidesPerView={2}
        loop
        arrowsPosition="bottom-start"
        indicatorsPosition="bottom-end"
        className="min-h-0"
        renderItem={({ item }) => {
          const slide = item as AssetSlide;
          return (
            <figure className="min-w-0">
              <div className="relative h-40 overflow-hidden rounded-balsa-control border border-balsa-border bg-balsa-muted">
                <GradientBackground
                  colorMode="palette"
                  preset={slide.preset}
                  speed={0}
                  className="absolute inset-0"
                />
              </div>
              <figcaption className="mt-balsa-xs min-w-0">
                <strong className="block truncate text-sm font-medium">{item.label}</strong>
                <span className="block truncate text-xs text-balsa-muted-foreground">{slide.caption}</span>
              </figcaption>
            </figure>
          );
        }}
      />
    </CompositionRoot>
  );
}
