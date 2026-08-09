<script setup lang="ts">
import { ref } from "vue";
import Accordion, { type AccordionItem } from "../ui/Accordion.vue";
import Badge from "../ui/Badge.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * A procedure people follow under pressure, so each step is collapsed until it
 * is the one being done. The accordion is the composition: nothing else on the
 * card competes with the step you are on.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  steps?: readonly AccordionItem[];
}>(), {
  title: "Rollback runbook",
  description: "Follow in order. Each step is safe to repeat.",
  steps: () => [
    { id: "freeze", title: "1 · Freeze the pipeline", content: "Pause queued deploys so nothing lands on top of the rollback. Anything mid-build finishes but does not promote." },
    { id: "confirm", title: "2 · Confirm the last good build", content: "Check the deployment history for the newest build that passed two consecutive health checks in every region." },
    { id: "promote", title: "3 · Promote it", content: "Promote that build to production. The rollout holds at 10% until the health check passes twice, as it does for any deploy." },
    { id: "verify", title: "4 · Verify each region", content: "Watch p95 latency and error rate per region. São Paulo recovers last because it is furthest from the origin." },
    { id: "unfreeze", title: "5 · Unfreeze and write it up", content: "Resume the pipeline, then record what happened while it is still fresh." },
  ],
});

// Opens on the steps someone reaching for a runbook is most likely to be on.
const openStep = ref<readonly string[]>(["confirm", "promote"]);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="runbook-steps">
    <template #action><Badge variant="soft">5 steps</Badge></template>
    <div class="flex-1">
      <Accordion id="rollback-runbook" v-model="openStep" :items="props.steps" type="multiple" label="Rollback steps" />
    </div>
  </CompositionRoot>
</template>
