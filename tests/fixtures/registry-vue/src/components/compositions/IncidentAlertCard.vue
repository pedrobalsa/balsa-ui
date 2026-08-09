<script setup lang="ts">
import { TriangleAlert } from "@lucide/vue";
import Alert from "../ui/Alert.vue";
import Button from "../ui/Button.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * An incident banner and the two things anyone would do about it. Half height,
 * because an alert that needs more room than this is a page.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  alertTitle?: string;
  alertDescription?: string;
}>(), {
  title: "Active incident",
  alertTitle: "Elevated latency in São Paulo",
  alertDescription: "Serving from Washington while the region recovers. Deploys are paused.",
});
const emit = defineEmits<{ acknowledge: []; open: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="incident-alert">
    <div class="flex flex-1 flex-col justify-center gap-balsa-md">
      <Alert
        id="incident-alert"
        :title="props.alertTitle"
        :description="props.alertDescription"
        :icon="TriangleAlert"
        variant="soft"
        persistent
      />
      <dl class="grid grid-cols-3 gap-balsa-md text-sm">
        <div>
          <dt class="text-xs text-balsa-muted-foreground">Started</dt>
          <dd class="mt-balsa-4xs font-medium tabular-nums">14 minutes ago</dd>
        </div>
        <div>
          <dt class="text-xs text-balsa-muted-foreground">Affected</dt>
          <dd class="mt-balsa-4xs font-medium">Atlas, Relay</dd>
        </div>
        <div>
          <dt class="text-xs text-balsa-muted-foreground">Requests hit</dt>
          <dd class="mt-balsa-4xs font-medium tabular-nums">3.2%</dd>
        </div>
      </dl>
      <div class="flex gap-balsa-md">
        <Button variant="soft" class="flex-1" @click="emit('acknowledge')">Acknowledge</Button>
        <Button class="flex-1" @click="emit('open')">Open the incident</Button>
      </div>
    </div>
  </CompositionRoot>
</template>
