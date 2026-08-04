<script setup lang="ts">
import { Image } from "@lucide/vue";
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; status?: string; statusColor?: CompositionPaletteColor; actionLabel?: string }>(), {
  title: "Cover art", description: "Preview the asset before publishing.", status: "Draft", statusColor: "secondary", actionLabel: "Replace image",
});
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="media-preview">
    <template #action><Badge :color="props.statusColor" variant="soft">{{ props.status }}</Badge></template>
    <div class="relative grid min-h-72 place-items-center overflow-hidden rounded-balsa-panel border border-balsa-border bg-balsa-muted">
      <div class="absolute inset-0 opacity-40 [background-image:linear-gradient(135deg,transparent_25%,var(--balsa-color-border)_25%,var(--balsa-color-border)_50%,transparent_50%,transparent_75%,var(--balsa-color-border)_75%)] [background-size:2rem_2rem]"></div>
      <Icon :icon="Image" size="xl" class="relative text-balsa-muted-foreground" />
    </div>
    <template #footer><Button class="w-full" variant="soft" @click="emit('action')">{{ props.actionLabel }}</Button></template>
  </CompositionRoot>
</template>
