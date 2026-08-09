<script setup lang="ts">
import { ImageOff } from "@lucide/vue";
import { ref } from "vue";
import Badge from "../ui/Badge.vue";
import GradientBackground from "../ui/GradientBackground.vue";
import Icon from "../ui/Icon.vue";
import Resizable from "../ui/Resizable.vue";
import CompositionRoot from "./_CompositionRoot.vue";
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
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  beforeLabel?: string;
  afterLabel?: string;
}>(), {
  title: "Before and after",
  description: "Drag the divider to compare the replacement against the original.",
  beforeLabel: "Original, not yet uploaded",
  afterLabel: "Proposed replacement",
});

const split = ref(50);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="image-compare">
    <template #action><Badge variant="soft">Awaiting sign-off</Badge></template>
    <Resizable
      id="artwork-compare"
      v-model="split"
      label="Original against replacement"
      :min="20"
      :max="80"
      class="min-h-64 flex-1 grid-rows-1"
    >
      <template #first>
        <figure class="relative grid h-full place-items-center overflow-hidden bg-balsa-muted">
          <div
            class="absolute inset-0 opacity-40 [background-image:linear-gradient(135deg,transparent_25%,var(--balsa-color-border)_25%,var(--balsa-color-border)_50%,transparent_50%,transparent_75%,var(--balsa-color-border)_75%)] [background-size:2rem_2rem]"
          ></div>
          <Icon :icon="ImageOff" size="xl" class="relative text-balsa-muted-foreground" />
          <figcaption class="absolute inset-x-0 bottom-0 truncate bg-balsa-surface/80 px-balsa-md py-balsa-xs text-xs text-balsa-muted-foreground">
            {{ props.beforeLabel }}
          </figcaption>
        </figure>
      </template>
      <template #second>
        <figure class="relative h-full overflow-hidden bg-balsa-muted">
          <GradientBackground color-mode="palette" preset="aurora-veil" :speed="0" class="absolute inset-0" />
          <figcaption class="absolute inset-x-0 bottom-0 truncate bg-balsa-surface/80 px-balsa-md py-balsa-xs text-xs text-balsa-muted-foreground">
            {{ props.afterLabel }}
          </figcaption>
        </figure>
      </template>
    </Resizable>
  </CompositionRoot>
</template>
