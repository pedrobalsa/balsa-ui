<script setup lang="ts">
import { ArrowLeftRight, Coffee, ShoppingCart, Wallet } from "@lucide/vue";
import Button from "../ui/Button.vue";
import Icon, { type IconComponent } from "../ui/Icon.vue";
import CompositionRoot from "./_CompositionRoot.vue";
import type { CompositionPaletteColor, CompositionSurfaceProps } from "./composition";

export interface TransactionItem { id: string; name: string; category: string; time: string; amount: string; icon?: IconComponent; status?: CompositionPaletteColor }
const amountColorClasses: Readonly<Record<CompositionPaletteColor, string>> = {
  primary: "text-balsa-primary",
  secondary: "text-balsa-secondary",
  accent: "text-balsa-accent",
};
const amountColorClass = (color?: CompositionPaletteColor) => color ? amountColorClasses[color] : undefined;
const props = withDefaults(defineProps<CompositionSurfaceProps & { title?: string; description?: string; items?: readonly TransactionItem[] }>(), {
  title: "Recent transactions", description: "Your latest account activity.", items: () => [
    { id: "coffee", name: "Blue Bottle Coffee", category: "Food & drink", time: "Today, 10:24 AM", amount: "-$6.50", icon: Coffee },
    { id: "market", name: "Whole Foods Market", category: "Groceries", time: "Yesterday", amount: "-$142.30", icon: ShoppingCart },
    { id: "payout", name: "Stripe payout", category: "Income", time: "Oct 12", amount: "+$4,200.00", icon: Wallet, status: "accent" },
  ],
});
const emit = defineEmits<{ viewAll: []; select: [id: string] }>();
</script>

<template>
  <CompositionRoot v-bind="props" data-composition="transaction-list">
    <template #action><Button size="sm" variant="soft" @click="emit('viewAll')">View all</Button></template>
    <ul class="divide-y divide-balsa-border" role="list">
      <li v-for="item in props.items" :key="item.id">
        <button type="button" class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring" @click="emit('select', item.id)">
          <span class="grid size-9 place-items-center rounded-balsa-control bg-balsa-muted"><Icon :icon="item.icon || ArrowLeftRight" size="sm" /></span>
          <span class="min-w-0"><strong class="block truncate text-sm font-medium">{{ item.name }}</strong><span class="block truncate text-xs text-balsa-muted-foreground">{{ item.category }} · {{ item.time }}</span></span>
          <strong :class="['text-sm font-medium tabular-nums', amountColorClass(item.status)]">{{ item.amount }}</strong>
        </button>
      </li>
    </ul>
  </CompositionRoot>
</template>
