<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import {
  createBalsaAnalytics,
  provideBalsaAnalytics,
  type AnalyticsAdapter,
  type AnalyticsErrorContext,
  type AnalyticsProperties,
  type AnalyticsTransform,
} from "./analytics";

defineOptions({ name: "BalsaAnalyticsProvider" });

const props = withDefaults(
  defineProps<{
    adapters?: readonly AnalyticsAdapter[];
    enabled?: boolean;
    automatic?: boolean;
    context?: AnalyticsProperties;
    transform?: AnalyticsTransform;
    onError?: (error: unknown, context: AnalyticsErrorContext) => void;
  }>(),
  {
    adapters: () => [],
    enabled: true,
    automatic: true,
    context: () => ({}),
  },
);

const analytics = createBalsaAnalytics({
  adapters: () => props.adapters,
  enabled: () => props.enabled,
  automatic: () => props.automatic,
  context: () => props.context,
  transform: props.transform,
  onError: props.onError,
});

provideBalsaAnalytics(analytics);
onMounted(analytics.start);
onBeforeUnmount(analytics.stop);
</script>

<template>
  <slot />
</template>
