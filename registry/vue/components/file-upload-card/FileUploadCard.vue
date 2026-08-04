<script setup lang="ts">
import { CloudUpload } from "@lucide/vue";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; acceptLabel?: string; actionLabel?: string }>(), { title: "File upload", description: "Drag and drop or browse.", acceptLabel: "PNG, JPG, or PDF up to 10 MB", actionLabel: "Browse files" });
const emit = defineEmits<{ browse: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="file-upload">
    <div class="flex min-h-64 flex-col items-center justify-center rounded-balsa-panel border border-dashed border-balsa-border p-6 text-center" @dragover.prevent @drop.prevent>
      <span class="grid size-11 place-items-center rounded-balsa-control bg-balsa-muted"><Icon :icon="CloudUpload" size="md" /></span>
      <strong class="mt-5 text-sm font-medium">Upload files</strong>
      <p class="mt-1 text-sm text-balsa-muted-foreground">{{ props.acceptLabel }}</p>
      <Button class="mt-5" variant="soft" @click="emit('browse')">{{ props.actionLabel }}</Button>
    </div>
  </CompositionRoot>
</template>
