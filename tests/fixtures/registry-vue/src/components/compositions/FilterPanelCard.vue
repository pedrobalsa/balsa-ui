<script setup lang="ts">
import { reactive, ref } from "vue";
import Accordion, { type AccordionItem } from "../ui/Accordion.vue";
import Button from "../ui/Button.vue";
import Checkbox from "../ui/Checkbox.vue";
import Slider from "../ui/Slider.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

/**
 * Filters as a rail: every group open to its own depth, with the reset and
 * apply pair pinned to the bottom. It is tall because a filter panel that fits
 * in one unit is a toolbar, and toolbars do not need sections.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
}>(), {
  title: "Filter deployments",
  description: "Narrow the deployment history.",
});
const emit = defineEmits<{ apply: []; reset: [] }>();

const sections: readonly AccordionItem[] = [
  { id: "environment", title: "Environment" },
  { id: "outcome", title: "Outcome" },
  { id: "duration", title: "Duration" },
  { id: "actor", title: "Triggered by" },
];

const environments = reactive({ production: true, preview: true, development: false });
const outcomes = reactive({ succeeded: true, failed: true, rolledBack: false });
const maxDuration = ref(180);
// Every group open at rest: a filter panel that hides its own state makes the
// reader click three times to learn what is already filtered.
const openSections = ref<readonly string[]>(["environment", "outcome", "duration", "actor"]);
const actors = reactive({ people: true, schedule: true, api: false });
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="filter-panel">
    <div class="flex-1">
      <Accordion id="deployment-filters" v-model="openSections" :items="sections" type="multiple" label="Filter groups">
        <template #environment>
          <div class="grid gap-balsa-md">
            <Checkbox id="filter-production" v-model="environments.production" label="Production" />
            <Checkbox id="filter-preview" v-model="environments.preview" label="Preview" />
            <Checkbox id="filter-development" v-model="environments.development" label="Development" />
          </div>
        </template>
        <template #outcome>
          <div class="grid gap-balsa-md">
            <Checkbox id="filter-succeeded" v-model="outcomes.succeeded" label="Succeeded" />
            <Checkbox id="filter-failed" v-model="outcomes.failed" label="Failed" />
            <Checkbox id="filter-rolled-back" v-model="outcomes.rolledBack" label="Rolled back" />
          </div>
        </template>
        <template #duration>
          <Slider
            id="filter-duration"
            v-model="maxDuration"
            label="At most"
            :min="30"
            :max="600"
            :step="30"
            show-value
            :format-value="(value: number) => `${Math.round(value / 60)} min`"
          />
        </template>
        <template #actor>
          <div class="grid gap-balsa-md">
            <Checkbox id="filter-people" v-model="actors.people" label="A person" />
            <Checkbox id="filter-schedule" v-model="actors.schedule" label="A schedule" />
            <Checkbox id="filter-api" v-model="actors.api" label="The API" />
          </div>
        </template>
      </Accordion>
      <p class="mt-balsa-lg text-xs text-balsa-muted-foreground">
        42 of 318 deployments match.
      </p>
    </div>
    <template #footer>
      <div class="flex justify-between gap-balsa-md">
        <Button variant="soft" @click="emit('reset')">Reset</Button>
        <Button @click="emit('apply')">Apply filters</Button>
      </div>
    </template>
  </CompositionRoot>
</template>
