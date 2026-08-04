<script setup lang="ts">
import { ref } from "vue";
import Button from "../ui/Button.vue";
import RadioGroup, { type RadioGroupOption } from "../ui/RadioGroup.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; dateLabel?: string; times?: readonly string[] }>(), {
  title: "Book appointment", description: "Dr. Sarah Chen · Cardiology", dateLabel: "Available on March 18, 2026", times: () => ["9:00 AM", "10:30 AM", "11:00 AM", "1:30 PM"],
});
const emit = defineEmits<{ book: [time: string] }>();
const selected = ref("9:00 AM");
const options: readonly RadioGroupOption[] = props.times.map((time) => ({ value: time, label: time }));
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="appointment">
    <p class="text-sm font-medium">{{ props.dateLabel }}</p>
    <RadioGroup id="appointment-time" v-model="selected" class="mt-4" label="Available times" :options="options" layout="row" />
    <div class="mt-5 rounded-balsa-control bg-balsa-muted p-3"><strong class="text-sm font-medium">New patient?</strong><p class="mt-1 text-sm text-balsa-muted-foreground">Please arrive 15 minutes early.</p></div>
    <template #footer><Button class="w-full" @click="emit('book', selected)">Book appointment</Button></template>
  </CompositionRoot>
</template>

