<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface ServiceStatus { id: string; region: string; state: string; latency: string; color?: CompositionPaletteColor }

/**
 * A status strip: one row of regions, and nothing else. It takes a half-height
 * tile because that is all it is — stretching it to a full unit would add empty
 * space and imply there is detail here that there is not.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  regions?: readonly ServiceStatus[];
}>(), {
  title: "Regional health",
  description: "Every edge, right now.",
  regions: () => [
    { id: "iad", region: "Washington", state: "Healthy", latency: "18 ms", color: "primary" },
    { id: "fra", region: "Frankfurt", state: "Healthy", latency: "24 ms", color: "primary" },
    { id: "gru", region: "São Paulo", state: "Degraded", latency: "96 ms", color: "secondary" },
    { id: "syd", region: "Sydney", state: "Healthy", latency: "41 ms", color: "primary" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="service-health">
    <ul class="grid flex-1 grid-cols-2 content-center gap-balsa-md sm:grid-cols-4" role="list">
      <li v-for="region in props.regions" :key="region.id" class="min-w-0">
        <strong class="block truncate text-sm font-medium">{{ region.region }}</strong>
        <span class="mt-balsa-3xs flex items-center gap-balsa-xs">
          <Badge :color="region.color" variant="soft">{{ region.state }}</Badge>
          <span class="text-xs tabular-nums text-balsa-muted-foreground">{{ region.latency }}</span>
        </span>
      </li>
    </ul>
  </CompositionRoot>
</template>
