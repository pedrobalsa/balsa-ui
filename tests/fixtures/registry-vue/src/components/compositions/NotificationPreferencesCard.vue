<script setup lang="ts">
import { reactive, ref } from "vue";
import Button from "../ui/Button.vue";
import Select, { type SelectOption } from "../ui/Select.vue";
import Switch from "../ui/Switch.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface NotificationPreference { id: string; label: string; description: string; enabled: boolean }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly NotificationPreference[] }>(), {
  title: "Delivery preferences", description: "Where workspace events reach you.", items: () => [
    { id: "failures", label: "Deploy failures", description: "Paged the moment a production build fails.", enabled: true },
    { id: "quota", label: "Quota warnings", description: "Sent once usage passes 80% of the plan.", enabled: true },
    { id: "mentions", label: "Mentions", description: "When someone names you in a review comment.", enabled: true },
    { id: "digest", label: "Weekly digest", description: "One summary of everything, Monday at 09:00.", enabled: false },
    { id: "budget", label: "Budget alerts", description: "When projected spend passes the monthly cap.", enabled: true },
  ],
});
const emit = defineEmits<{ change: [id: string, enabled: boolean]; save: [channel: string] }>();
const channel = ref("email");
const channels: readonly SelectOption[] = [
  { label: "Email — ada@example.com", value: "email" },
  { label: "Slack — #atlas-deploys", value: "slack" },
  { label: "Webhook — hooks.example.com", value: "webhook" },
];
const values = reactive(Object.fromEntries(props.items.map((item) => [item.id, item.enabled])) as Record<string, boolean>);
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="notification-preferences">
    <div class="flex-1 divide-y divide-balsa-border">
      <div v-for="item in props.items" :key="item.id" class="py-balsa-lg first:pt-0 last:pb-0">
        <Switch :id="`notification-${item.id}`" v-model="values[item.id]" :label="item.label" :hint="item.description" @update:model-value="emit('change', item.id, $event)" />
      </div>
    </div>
    <div class="mt-balsa-xl border-t-(length:--balsa-border-width) border-balsa-border pt-balsa-xl">
      <Select id="notification-channel" v-model="channel" label="Send everything to" :options="channels" />
    </div>
    <template #footer><Button class="w-full" @click="emit('save', channel)">Save preferences</Button></template>
  </CompositionRoot>
</template>
