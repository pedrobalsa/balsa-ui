<script setup lang="ts">
import { computed, useAttrs, useSlots } from "vue";
import ApplicationCard from "./ApplicationCard.vue";
import type { CompositionSurfaceProps } from "./composition";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title: string;
  description?: string;
}>(), { headingLevel: 2, shadow: "auto" });
const slots = useSlots();
const attrs = useAttrs();
const resolvedShadow = computed(() => props.shadow ?? "auto");
const rootAttrs = computed(() => Object.fromEntries(
  Object.entries(attrs).filter(([key]) =>
    key === "class" || key === "style" || key === "id" || key === "role" ||
    key.startsWith("data-") || key.startsWith("aria-")),
));
</script>

<template>
  <ApplicationCard
    v-bind="rootAttrs"
    :title="props.title"
    :description="props.description"
    :heading-level="props.headingLevel"
    :shadow="resolvedShadow"
    :theme="props.theme"
    class="min-w-0"
  >
    <template v-if="slots.action" #action><slot name="action" /></template>
    <slot />
    <template v-if="slots.footer" #footer><slot name="footer" /></template>
  </ApplicationCard>
</template>
