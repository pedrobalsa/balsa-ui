<script setup lang="ts">
import { CloudAlert, RefreshCw } from "@lucide/vue";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; message?: string; requestId?: string; retryLabel?: string }>(), {
  title: "Unable to load projects", description: "The workspace did not respond.", message: "Check your connection and try again. Your changes have not been lost.", requestId: "req_01J8A2", retryLabel: "Try again",
});
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="error-state" role="status">
    <div class="flex min-h-52 flex-col items-center justify-center text-center">
      <Icon :icon="CloudAlert" size="xl" class="text-balsa-accent" />
      <p class="mt-4 max-w-sm text-sm text-balsa-muted-foreground">{{ props.message }}</p>
      <code class="mt-3 rounded-balsa-control bg-balsa-muted px-2 py-1 text-xs">{{ props.requestId }}</code>
      <Button class="mt-5" :prefix-icon="RefreshCw" @click="emit('retry')">{{ props.retryLabel }}</Button>
    </div>
  </CompositionRoot>
</template>
