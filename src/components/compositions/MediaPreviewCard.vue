<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import GradientBackground from "../ui/GradientBackground.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; status?: string; statusColor?: CompositionPaletteColor; actionLabel?: string }>(), {
  title: "Preview build", description: "What visitors see at relay-preview.example.com.", status: "Awaiting review", statusColor: "secondary", actionLabel: "Open the preview",
});
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="media-preview">
    <template #action><Badge :color="props.statusColor" variant="soft">{{ props.status }}</Badge></template>
    <!--
      A captured page is imagery, so the stand-in is imagery too: a palette-mode
      gradient reads as a rendered screen and answers to the palette being
      edited, where a checkerboard only ever reads as "no image here". The
      checkerboard belongs on surfaces that genuinely have nothing yet.
    -->
    <div class="relative min-h-80 flex-1 overflow-hidden rounded-balsa-panel border border-balsa-border bg-balsa-muted">
      <GradientBackground
        color-mode="palette"
        preset="mesh-drift"
        :speed="0"
        class="absolute inset-0"
      />
    </div>
    <dl class="mt-balsa-lg divide-y divide-balsa-border text-sm">
      <div class="flex justify-between py-balsa-sm"><dt class="text-balsa-muted-foreground">Captured at</dt><dd class="tabular-nums">1440 &times; 900</dd></div>
      <div class="flex justify-between py-balsa-sm"><dt class="text-balsa-muted-foreground">Commit</dt><dd class="tabular-nums">a41c9f2</dd></div>
      <div class="flex justify-between py-balsa-sm"><dt class="text-balsa-muted-foreground">Built</dt><dd>4 minutes ago</dd></div>
    </dl>
    <template #footer><Button class="w-full" variant="soft" @click="emit('action')">{{ props.actionLabel }}</Button></template>
  </CompositionRoot>
</template>
