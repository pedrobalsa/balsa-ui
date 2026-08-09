<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import Carousel, { type CarouselItem } from "../ui/Carousel.vue";
import GradientBackground from "../ui/GradientBackground.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface AssetSlide extends CarouselItem { caption: string; preset: "mesh-drift" | "aurora-veil" | "silver-dunes" | "solar-bloom" }

/**
 * Captured screens, stood in for by palette-mode gradients: the placeholder is
 * imagery rather than an "image missing" mark, so it reads as the artwork this
 * carousel is for and follows the palette being edited.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  slides?: readonly AssetSlide[];
}>(), {
  title: "Launch artwork",
  description: "Every asset queued for the Atlas announcement.",
  slides: () => [
    { id: "hero", label: "Hero banner", caption: "2560 × 1440 · approved", preset: "mesh-drift" },
    { id: "social", label: "Social card", caption: "1200 × 630 · in review", preset: "aurora-veil" },
    { id: "email", label: "Email header", caption: "1080 × 400 · approved", preset: "silver-dunes" },
    { id: "docs", label: "Docs cover", caption: "1600 × 900 · draft", preset: "solar-bloom" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="asset-carousel">
    <template #action><Badge variant="soft">4 assets</Badge></template>
    <Carousel
      label="Launch artwork"
      :items="props.slides"
      :slides-per-view="2"
      loop
      arrows-position="bottom-start"
      indicators-position="bottom-end"
      class="min-h-0"
    >
      <template #item="{ item }">
        <figure class="min-w-0">
          <div class="relative h-40 overflow-hidden rounded-balsa-control border border-balsa-border bg-balsa-muted">
            <GradientBackground
              color-mode="palette"
              :preset="(item as AssetSlide).preset"
              :speed="0"
              class="absolute inset-0"
            />
          </div>
          <figcaption class="mt-balsa-xs min-w-0">
            <strong class="block truncate text-sm font-medium">{{ item.label }}</strong>
            <span class="block truncate text-xs text-balsa-muted-foreground">{{ (item as AssetSlide).caption }}</span>
          </figcaption>
        </figure>
      </template>
    </Carousel>
  </CompositionRoot>
</template>
