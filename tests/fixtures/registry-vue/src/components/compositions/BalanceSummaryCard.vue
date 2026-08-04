<script setup lang="ts">
import Button from "../ui/Button.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; value?: string; detail?: string; actionLabel?: string }>(), {
  title: "Card balance", value: "US$12.94", detail: "US$11,337.06 available", actionLabel: "Pay early",
});
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" :title="props.title" data-composition="balance-summary">
    <strong class="block text-3xl tabular-nums">{{ props.value }}</strong>
    <p class="mt-1 text-sm text-balsa-muted-foreground">{{ props.detail }}</p>
    <Button class="mt-4 w-full" size="sm" variant="soft" @click="emit('action')">{{ props.actionLabel }}</Button>
  </CompositionRoot>
</template>
