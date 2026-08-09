<script setup lang="ts">
import { Mail, Video } from "@lucide/vue";
import { ref } from "vue";
import Avatar from "../ui/Avatar.vue";
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import Calendar from "../ui/Calendar.vue";
import Icon from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface ScheduleSlot { id: string; time: string; label: string; taken?: boolean }

/**
 * Two columns that answer different halves of one question: the left says when
 * and with whom, the right says at what hour. The confirm sits under the hours
 * because that is the last choice made — put in a card footer it would read as
 * confirming the calendar too.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  guestName?: string;
  guestRole?: string;
  guestInitials?: string;
  guestEmail?: string;
  slots?: readonly ScheduleSlot[];
}>(), {
  title: "Schedule meeting",
  description: "Pick a day and an hour that suits you both.",
  guestName: "Grace Hopper",
  guestRole: "Platform, Frankfurt",
  guestInitials: "GH",
  guestEmail: "grace@example.com",
  slots: () => [
    { id: "08", time: "08:00", label: "Early, before either inbox" },
    { id: "09", time: "09:00", label: "Before the standup" },
    { id: "10", time: "10:00", label: "Held for the release review", taken: true },
    { id: "11", time: "11:00", label: "Overlaps both time zones" },
    { id: "14", time: "14:00", label: "After lunch in Frankfurt" },
    { id: "15", time: "15:00", label: "Quiet hour on both calendars" },
    { id: "16", time: "16:00", label: "Held for on-call handover", taken: true },
    { id: "17", time: "17:00", label: "Last hour of the Frankfurt day" },
  ],
});
const emit = defineEmits<{ schedule: [slot: string] }>();

const day = ref<Date | null>(new Date(2026, 8, 16));
const slot = ref("11");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="schedule-planner">
    <div class="grid flex-1 gap-balsa-xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col gap-balsa-lg">
        <Calendar id="meeting-day" v-model="day" label="Meeting day" />
        <div class="flex min-w-0 items-center gap-balsa-md rounded-balsa-control border border-balsa-border p-balsa-md">
          <Avatar :label="props.guestName" :fallback="props.guestInitials" size="md" />
          <span class="min-w-0 flex-1">
            <strong class="block truncate text-sm font-medium">{{ props.guestName }}</strong>
            <span class="block truncate text-xs text-balsa-muted-foreground">{{ props.guestRole }}</span>
          </span>
        </div>
        <ul class="grid gap-balsa-xs text-xs text-balsa-muted-foreground" role="list">
          <li class="flex min-w-0 items-center gap-balsa-xs">
            <Icon :icon="Video" size="sm" class="shrink-0" />
            <span class="truncate">30 minutes, video call</span>
          </li>
          <li class="flex min-w-0 items-center gap-balsa-xs">
            <Icon :icon="Mail" size="sm" class="shrink-0" />
            <span class="truncate">{{ props.guestEmail }}</span>
          </li>
        </ul>
      </div>

      <div class="flex min-w-0 flex-col">
        <p class="text-xs font-medium uppercase tracking-wider text-balsa-muted-foreground">
          Available hours
        </p>
        <ul class="mt-balsa-md grid flex-1 content-start gap-balsa-xs" role="list">
          <li v-for="option in props.slots" :key="option.id">
            <button
              type="button"
              :disabled="option.taken"
              :aria-pressed="slot === option.id"
              :class="['flex w-full items-center justify-between gap-balsa-md rounded-balsa-control border px-balsa-md py-balsa-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring',
                       option.taken ? 'cursor-not-allowed border-balsa-border opacity-60'
                       : slot === option.id ? 'border-balsa-primary bg-balsa-muted'
                       : 'border-balsa-border hover:bg-balsa-muted']"
              @click="slot = option.id"
            >
              <span class="min-w-0">
                <strong class="block text-sm font-medium tabular-nums">{{ option.time }}</strong>
                <span class="block truncate text-xs text-balsa-muted-foreground">{{ option.label }}</span>
              </span>
              <Badge v-if="option.taken" variant="soft">Taken</Badge>
            </button>
          </li>
        </ul>
        <Button class="mt-balsa-md w-full" @click="emit('schedule', slot)">Confirm the meeting</Button>
      </div>
    </div>
  </CompositionRoot>
</template>
