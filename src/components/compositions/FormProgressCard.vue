<script setup lang="ts">
import { Check } from "@lucide/vue";
import Icon from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface FormStep { id: string; label: string; description?: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; steps?: readonly FormStep[]; current?: number }>(), {
  title: "Application progress", description: "Your information is saved after every step.", current: 2, steps: () => [
    { id: "profile", label: "Profile", description: "Complete" }, { id: "details", label: "Details", description: "Current step" },
    { id: "review", label: "Review", description: "Not started" }, { id: "submit", label: "Submit", description: "Not started" },
  ],
});
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="form-progress">
    <ol class="grid gap-0" aria-label="Application steps">
      <li v-for="(step, index) in props.steps" :key="step.id" :aria-current="index + 1 === props.current ? 'step' : undefined" class="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
        <div class="flex flex-col items-center"><span :class="['grid size-7 place-items-center rounded-full border text-xs font-medium', index + 1 < props.current ? 'border-balsa-primary bg-balsa-primary text-balsa-primary-foreground' : index + 1 === props.current ? 'border-balsa-primary text-balsa-primary' : 'border-balsa-border text-balsa-muted-foreground']"><Icon v-if="index + 1 < props.current" :icon="Check" size="sm" /><span v-else>{{ index + 1 }}</span></span><span v-if="index < props.steps.length - 1" class="min-h-8 w-px flex-1 bg-balsa-border"></span></div>
        <div class="pb-5"><strong class="block text-sm font-medium">{{ step.label }}</strong><span class="text-xs text-balsa-muted-foreground">{{ step.description }}</span></div>
      </li>
    </ol>
  </CompositionRoot>
</template>
