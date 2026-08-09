<script setup lang="ts">
import { ref } from "vue";
import Badge from "../ui/Badge.vue";
import Button from "../ui/Button.vue";
import Table from "../ui/Table.vue";
import Tabs, { type TabItem } from "../ui/Tabs.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface PlanRow { id: string; capability: string; starter: string; pro: string; scale: string }

/**
 * Three plans across, one capability per row. Wide because the comparison is
 * horizontal — stacked, it stops being a comparison — and one and a half units
 * tall because the table needs its rows and nothing more.
 */
const props = withDefaults(defineProps<CompositionSurfaceProps & {
  title?: string;
  description?: string;
  rows?: readonly PlanRow[];
}>(), {
  title: "Compare plans",
  description: "What changes as a workspace grows.",
  rows: () => [
    { id: "members", capability: "Members", starter: "3", pro: "25", scale: "Unlimited" },
    { id: "environments", capability: "Environments", starter: "1", pro: "5", scale: "Unlimited" },
    { id: "regions", capability: "Edge regions", starter: "1", pro: "6", scale: "All 14" },
    { id: "retention", capability: "Log retention", starter: "3 days", pro: "30 days", scale: "1 year" },
    { id: "support", capability: "Support", starter: "Community", pro: "4 hour response", scale: "Dedicated" },
    { id: "builds", capability: "Concurrent builds", starter: "1", pro: "8", scale: "40" },
    { id: "sso", capability: "Single sign-on", starter: "—", pro: "Google, Okta", scale: "Any SAML provider" },
  ],
});
const emit = defineEmits<{ choose: [plan: string] }>();

const billing: readonly TabItem[] = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual, save 10%" },
];
const period = ref("monthly");
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="plan-comparison">
    <template #action><Badge variant="soft">Current: Pro</Badge></template>
    <div class="flex flex-1 flex-col gap-balsa-lg">
      <Tabs id="billing-period" v-model="period" :items="billing" label="Billing period" :panel-surface="false">
        <template #monthly><span class="sr-only">Prices shown per member, per month.</span></template>
        <template #annual><span class="sr-only">Prices shown per member, billed once a year.</span></template>
      </Tabs>
      <Table caption="Plan comparison" rounded="none" class="w-full flex-1">
        <template #header>
          <thead>
            <tr>
              <th scope="col">Capability</th>
              <th scope="col">Starter</th>
              <th scope="col">Pro</th>
              <th scope="col">Scale</th>
            </tr>
          </thead>
        </template>
        <tbody>
          <tr v-for="row in props.rows" :key="row.id">
            <th scope="row">{{ row.capability }}</th>
            <td class="text-balsa-muted-foreground">{{ row.starter }}</td>
            <td class="font-medium">{{ row.pro }}</td>
            <td class="text-balsa-muted-foreground">{{ row.scale }}</td>
          </tr>
        </tbody>
      </Table>
    </div>
    <template #footer>
      <div class="flex gap-balsa-md">
        <Button variant="soft" class="flex-1" @click="emit('choose', 'starter')">Downgrade to Starter</Button>
        <Button class="flex-1" @click="emit('choose', 'scale')">Move to Scale</Button>
      </div>
    </template>
  </CompositionRoot>
</template>
