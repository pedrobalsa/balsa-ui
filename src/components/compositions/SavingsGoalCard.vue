<script setup lang="ts">
import Button from "../ui/Button.vue";
import Progress from "../ui/Progress.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface SavingsGoal { label: string; amount: string; progress: number; remaining: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; goals?: readonly SavingsGoal[] }>(), {
  title: "Savings targets", description: "Active milestones for this year.", goals: () => [
    { label: "Retirement", amount: "$420,000", progress: 65, remaining: "$273,000" },
    { label: "Real estate", amount: "$85,000", progress: 32, remaining: "$27,200" },
  ],
});
const emit = defineEmits<{ create: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="savings-goal">
    <template #action><Button size="sm" variant="soft" @click="emit('create')">New goal</Button></template>
    <div class="grid gap-3">
      <section v-for="goal in props.goals" :key="goal.label" class="rounded-balsa-control bg-balsa-muted p-3">
        <small class="uppercase tracking-wider text-balsa-muted-foreground">{{ goal.label }}</small>
        <strong class="mt-2 block text-2xl tabular-nums">{{ goal.amount }}</strong>
        <Progress class="mt-3" :label="`${goal.progress}% achieved`" :value="goal.progress" color="primary" />
        <p class="mt-2 text-right text-xs font-medium tabular-nums">{{ goal.remaining }}</p>
      </section>
    </div>
  </CompositionRoot>
</template>
