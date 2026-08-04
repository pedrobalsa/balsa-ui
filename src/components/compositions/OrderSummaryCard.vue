<script setup lang="ts">
import Button from "../ui/Button.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionSurfaceProps } from "./composition";

export interface OrderLine { id: string; label: string; detail?: string; amount: string }
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly OrderLine[]; subtotal?: string; tax?: string; total?: string }>(), {
  title: "Order summary", description: "Review charges before confirming.", items: () => [
    { id: "pro", label: "Pro workspace", detail: "12 members", amount: "$240.00" },
    { id: "storage", label: "Additional storage", detail: "500 GB", amount: "$35.00" },
  ], subtotal: "$275.00", tax: "$22.00", total: "$297.00",
});
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="order-summary">
    <ul class="divide-y divide-balsa-border" role="list"><li v-for="item in props.items" :key="item.id" class="flex justify-between gap-4 py-3 first:pt-0"><span><strong class="block text-sm font-medium">{{ item.label }}</strong><span class="text-xs text-balsa-muted-foreground">{{ item.detail }}</span></span><strong class="text-sm font-medium tabular-nums">{{ item.amount }}</strong></li></ul>
    <dl class="mt-4 divide-y divide-balsa-border rounded-balsa-control bg-balsa-muted px-3 text-sm"><div class="flex justify-between py-3"><dt>Subtotal</dt><dd class="tabular-nums">{{ props.subtotal }}</dd></div><div class="flex justify-between py-3"><dt>Tax</dt><dd class="tabular-nums">{{ props.tax }}</dd></div><div class="flex justify-between py-3 font-semibold"><dt>Total</dt><dd class="tabular-nums">{{ props.total }}</dd></div></dl>
    <template #footer><Button class="w-full" @click="emit('confirm')">Confirm order</Button></template>
  </CompositionRoot>
</template>
