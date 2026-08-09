<script setup lang="ts">
import { reactive } from "vue";
import Button from "../ui/Button.vue";
import Checkbox from "../ui/Checkbox.vue";
import Progress from "../ui/Progress.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface OnboardingTask { id: string; label: string; description: string; complete: boolean }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; tasks?: readonly OnboardingTask[] }>(), {
  title: "Set up your workspace", description: "Complete these tasks to get ready for launch.", tasks: () => [
    { id: "profile", label: "Complete profile", description: "Add a name and workspace image.", complete: true },
    { id: "team", label: "Invite your team", description: "Bring collaborators into the workspace.", complete: true },
    { id: "project", label: "Create first project", description: "Start with a production or preview project.", complete: false },
    { id: "domain", label: "Connect a domain", description: "Publish with your own address.", complete: false },
    { id: "environment", label: "Add a preview environment", description: "Review changes before they reach production.", complete: false },
    { id: "alerts", label: "Choose where alerts go", description: "Send deploy failures to the right people.", complete: false },
  ],
});
const emit = defineEmits<{ continue: [] }>();
const values = reactive(Object.fromEntries(props.tasks.map((task) => [task.id, task.complete])) as Record<string, boolean>);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="onboarding-checklist">
    <Progress label="Setup progress" :value="Math.round((Object.values(values).filter(Boolean).length / props.tasks.length) * 100)" color="primary" show-value />
    <div class="mt-balsa-xl flex flex-1 flex-col justify-between divide-y divide-balsa-border"><div v-for="task in props.tasks" :key="task.id" class="py-balsa-md"><Checkbox :id="`onboarding-${task.id}`" v-model="values[task.id]" :label="task.label" :hint="task.description" /></div></div>
    <template #footer><Button class="w-full" @click="emit('continue')">Continue setup</Button></template>
  </CompositionRoot>
</template>
