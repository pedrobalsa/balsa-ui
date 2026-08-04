<script setup lang="ts">
import { ref } from "vue";
import Badge from "../ui/Badge.vue";
import Calendar, { type CalendarModelValue } from "../ui/Calendar.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ScheduleItem { id: string; title: string; date: string; meta: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly ScheduleItem[] }>(), {
  title: "Upcoming payments", description: "Select a date to review scheduled activity.", items: () => [
    { id: "netflix", title: "Netflix subscription", date: "Apr 15, 2026", meta: "$19.99" },
    { id: "hosting", title: "Cloud hosting", date: "Apr 18, 2026", meta: "$48.00" },
  ],
});
const date = ref<CalendarModelValue>(new Date(2026, 6, 31));
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="schedule">
    <Calendar id="composition-schedule" v-model="date" label="Schedule date" />
    <ul class="mt-4 divide-y divide-balsa-border" role="list"><li v-for="item in props.items" :key="item.id" class="flex items-center justify-between gap-4 py-3"><span><strong class="block text-sm font-medium">{{ item.title }}</strong><span class="text-xs text-balsa-muted-foreground">{{ item.date }}</span></span><Badge variant="soft">{{ item.meta }}</Badge></li></ul>
  </CompositionRoot>
</template>
