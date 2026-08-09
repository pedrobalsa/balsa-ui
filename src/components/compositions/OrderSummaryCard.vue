<script setup lang="ts">
import Button from "../ui/Button.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface OrderLine { id: string; label: string; detail?: string; amount: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly OrderLine[]; subtotal?: string; tax?: string; total?: string }>(), {
  title: "Order summary", description: "Review charges before confirming.", items: () => [
    { id: "pro", label: "Pro workspace", detail: "12 members", amount: "$240.00" },
    { id: "storage", label: "Additional storage", detail: "500 GB", amount: "$35.00" },
    { id: "regions", label: "Extra regions", detail: "3 beyond the plan", amount: "$45.00" },
    { id: "support", label: "Priority support", detail: "4 hour response", amount: "$60.00" },
    { id: "credit", label: "Annual commitment", detail: "-10% for 12 months", amount: "-$38.00" },
  ], subtotal: "$342.00", tax: "$27.36", total: "$369.36",
});
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="order-summary">
    <ul class="divide-y divide-balsa-border" role="list"><li v-for="item in props.items" :key="item.id" class="flex justify-between gap-balsa-lg py-balsa-md first:pt-0"><span><strong class="block text-sm font-medium">{{ item.label }}</strong><span class="text-xs text-balsa-muted-foreground">{{ item.detail }}</span></span><strong class="text-sm font-medium tabular-nums">{{ item.amount }}</strong></li></ul>
    <dl class="mt-balsa-lg divide-y divide-balsa-border rounded-balsa-control bg-balsa-muted px-balsa-md text-sm"><div class="flex justify-between py-balsa-md"><dt>Subtotal</dt><dd class="tabular-nums">{{ props.subtotal }}</dd></div><div class="flex justify-between py-balsa-md"><dt>Tax</dt><dd class="tabular-nums">{{ props.tax }}</dd></div><div class="flex justify-between py-balsa-md font-semibold"><dt>Total</dt><dd class="tabular-nums">{{ props.total }}</dd></div></dl>
    <template #footer><Button class="w-full" @click="emit('confirm')">Confirm order</Button></template>
  </CompositionRoot>
</template>
