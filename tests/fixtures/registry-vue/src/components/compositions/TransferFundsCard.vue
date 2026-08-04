<script setup lang="ts">
import { ref } from "vue";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import Select, { type SelectOption } from "../ui/Select.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; amount?: string }>(), {
  title: "Transfer funds", description: "Move money between connected accounts.", amount: "1,200.00",
});
const emit = defineEmits<{ confirm: [{ amount: string; from: string; to: string }] }>();
const amountValue = ref(props.amount);
const from = ref("checking");
const to = ref("savings");
const fromOptions: readonly SelectOption[] = [{ label: "Main checking (••8402) — $12,450.00", value: "checking" }];
const toOptions: readonly SelectOption[] = [{ label: "High yield savings (••1192) — $42,100.00", value: "savings" }];
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="transfer-funds">
    <div class="grid gap-4">
      <Input id="transfer-amount" v-model="amountValue" label="Amount to transfer" type="monetary" />
      <Select id="transfer-from" v-model="from" label="From account" :options="fromOptions" />
      <Select id="transfer-to" v-model="to" label="To account" :options="toOptions" />
      <dl class="divide-y divide-balsa-border rounded-balsa-control bg-balsa-muted px-3 text-sm">
        <div class="flex justify-between gap-4 py-3"><dt class="text-balsa-muted-foreground">Estimated arrival</dt><dd class="font-medium tabular-nums">Today, Apr 14</dd></div>
        <div class="flex justify-between gap-4 py-3"><dt class="text-balsa-muted-foreground">Transaction fee</dt><dd class="font-medium tabular-nums">$0.00</dd></div>
        <div class="flex justify-between gap-4 py-3"><dt class="font-semibold">Total amount</dt><dd class="font-semibold tabular-nums">${{ amountValue }}</dd></div>
      </dl>
    </div>
    <template #footer><Button class="w-full" @click="emit('confirm', { amount: amountValue, from, to })">Confirm transfer</Button></template>
  </CompositionRoot>
</template>
